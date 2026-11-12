#!/usr/bin/env python3
"""Converte o IFC arquitetonico do canil em GLB leve.

Somente o modelo arquitetonico (CANIL.ifc, o mais pesado) e convertido. As
demais disciplinas sao leves e o site as carrega direto do IFC.

Cada malha do GLB agrupa as pecas de uma mesma categoria IFC que recebem o
mesmo tipo de material no visualizador (grama, telhado, parede, concreto,
madeira, vidro, metal...). O nome do no segue o formato
``CATEGORIA|tipo|opacidade`` e a cor nativa do estilo IFC de cada peca vai
nas cores de vertice, para o site aplicar exatamente os mesmos materiais do
modo IFC.
"""
import hashlib
import json
import math
import os
import re
from collections import defaultdict
from pathlib import Path

import ifcopenshell
import ifcopenshell.geom
import numpy as np
import trimesh

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "models"
FILES = {"ARQ": "CANIL.ifc"}
# Cor usada quando o IFC nao define estilo de superficie (linear, como no web-ifc).
DEFAULT_COLOR = (0.8, 0.8, 0.8)
# Grupos ate este numero de triangulos recebem sombreamento plano (arestas vivas).
FLAT_FACE_LIMIT = 30000


def hash_file(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for part in iter(lambda: f.read(1024 * 1024), b""):
            h.update(part)
    return h.hexdigest()


def material_kind(kind, name, role, opacity):
    """Mesma regra de CANIL_MATERIAL_RULES do index.html."""
    s = f"{name} {role} {kind}"
    rx = lambda p: re.search(p, s, re.I)
    if rx(r"grama|grass|relva|veget|paisag"):
        return "grass"
    if kind == "IFCROOF" or role == "ROOF" or rx(r"telhad|cobertura|fibrocimento|telha"):
        return "roof"
    if rx(r"alambrado|cercamento"):
        return "fence"
    if rx(r"port[aã]o|gradil"):
        return "gate"
    if kind == "IFCWINDOW" and opacity >= 0.72:
        return "window-frame"
    if (kind == "IFCWINDOW" and opacity < 0.72) or rx(r"vidro|glass") or opacity < 0.72:
        return "glass"
    if re.search(r"IFCSTAIR|IFCSTAIRFLIGHT", kind) or rx(r"escada|degrau|fire[_ ]?ladder|fire stair|ladder"):
        return "stair"
    if rx(r"madeira|wood|compensado"):
        return "wood"
    if kind == "IFCDOOR" or rx(r"porta"):
        return "door"
    if kind.startswith("IFCWALL"):
        return "wall"
    if rx(r"concreto|cimento|contrapiso|cal[cç]ada|paviment") or re.search(
        r"IFCSLAB|IFCCOLUMN|IFCBEAM|IFCFOOTING", kind
    ):
        return "concrete"
    if re.search(r"IFCMEMBER|IFCPLATE|IFCFLOWSEGMENT|IFCFLOWFITTING|IFCPIPE|IFCDUCT", kind):
        return "metal"
    return "ifc"


def style_of(material):
    """Cor de superficie e opacidade do estilo IFC, como o web-ifc entrega."""
    name = str(getattr(material, "name", "") or "")
    styled = name.startswith("IfcSurfaceStyle")
    colour = None
    try:
        colour = material.surface if styled else None
    except Exception:
        colour = None
    if colour is None and styled:
        colour = material.diffuse
    rgb = (colour.r(), colour.g(), colour.b()) if colour is not None else DEFAULT_COLOR
    transparency = material.transparency if styled else 0.0
    if transparency is None or math.isnan(transparency):
        transparency = 0.0
    opacity = max(0.15, min(1.0, 1.0 - float(transparency)))
    return rgb, round(opacity, 2)


def pieces_for_model(path, anchor):
    model = ifcopenshell.open(str(path))
    settings = ifcopenshell.geom.settings()
    settings.set(settings.USE_WORLD_COORDS, True)
    iterator = ifcopenshell.geom.iterator(settings, model, max(1, min(4, os.cpu_count() or 2)))
    if not iterator.initialize():
        raise RuntimeError(f"Nao foi possivel processar a geometria de {path.name}")
    elements = []
    terrain_bounds = []
    entry_doors = []
    while True:
        shape = iterator.get()
        try:
            obj = model.by_id(int(shape.id))
            kind = obj.is_a().upper()
            if kind in {"IFCSPACE", "IFCOPENINGELEMENT", "IFCANNOTATION"}:
                continue
            geo = shape.geometry
            verts = np.asarray(geo.verts, dtype=np.float64).reshape((-1, 3))
            faces = np.asarray(geo.faces, dtype=np.int64).reshape((-1, 3))
            if not len(verts) or not len(faces):
                continue
            # IFC = eixo Z para cima; GLB/Three.js = eixo Y para cima.
            vertices = np.column_stack((verts[:, 0], verts[:, 2], -verts[:, 1]))
            # Normais do proprio IfcOpenShell: preservam arestas vivas (sem
            # suavizacao entre faces, que deixava telhado e paredes manchados).
            raw_n = np.asarray(geo.normals, dtype=np.float64).reshape((-1, 3))
            normals = (
                np.column_stack((raw_n[:, 0], raw_n[:, 2], -raw_n[:, 1]))
                if len(raw_n) == len(verts)
                else None
            )
            if anchor is None:
                anchor = vertices.min(axis=0).copy()
            vertices -= anchor
            name = str(getattr(obj, "Name", "") or "")
            role = str(getattr(obj, "PredefinedType", "") or "") if hasattr(obj, "PredefinedType") else ""
            mat_ids = np.asarray(geo.material_ids, dtype=np.int64)
            materials = list(geo.materials)
            # Porta de entrada usada como posicao inicial do modo Explorar em 3D.
            if kind == "IFCDOOR" and re.search(r"porta.*(?:02|2).*folhas.*visor", name, re.I):
                entry_doors.append((name.endswith(":3828930"), vertices.min(axis=0), vertices.max(axis=0)))
            if kind == "IFCSLAB" and re.search(r"grama|terreno|grass|relva", name, re.I):
                terrain_bounds.append((vertices.min(axis=0), vertices.max(axis=0)))
            elements.append((kind, name, role, vertices, faces, mat_ids, materials, normals))
        except Exception as exc:
            print(f"Aviso: geometria ignorada em {path.name}: {exc}")
        finally:
            if not iterator.next():
                break

    # Mesmo criterio do visualizador IFC: remove apenas ripas/caibros de
    # madeira fora do terreno, sem afetar as pecas da cobertura do canil.
    if terrain_bounds:
        tmin = np.min([v[0] for v in terrain_bounds], axis=0)
        tmax = np.max([v[1] for v in terrain_bounds], axis=0)
        tmin[[0, 2]] -= 1.0
        tmax[[0, 2]] += 1.0
        kept = []
        for el in elements:
            kind, name, _role, vertices = el[0], el[1], el[2], el[3]
            wood = re.search(r"madeira.*(?:ripa|caibro)|(?:ripa|caibro).*madeira", name, re.I)
            outside = np.any(vertices.max(axis=0)[[0, 2]] < tmin[[0, 2]]) or np.any(
                vertices.min(axis=0)[[0, 2]] > tmax[[0, 2]]
            )
            if kind == "IFCMEMBER" and wood and outside:
                print(f"Removida peca orfa fora do terreno: {name}")
            else:
                kept.append(el)
        elements = kept

    groups = defaultdict(list)
    counts = defaultdict(int)
    for kind, name, role, vertices, faces, mat_ids, materials, normals in elements:
        counts[kind] += 1
        ids = mat_ids if len(mat_ids) == len(faces) else np.full(len(faces), -1)
        for mid in np.unique(ids):
            sub = faces[ids == mid]
            if not len(sub):
                continue
            mat = materials[mid] if 0 <= mid < len(materials) else None
            rgb, opacity = style_of(mat) if mat is not None else (DEFAULT_COLOR, 1.0)
            used, local = np.unique(sub, return_inverse=True)
            mkind = material_kind(kind, name, role, opacity)
            groups[(kind, mkind, opacity)].append(
                (
                    vertices[used].astype(np.float32),
                    local.reshape((-1, 3)).astype(np.uint32),
                    rgb,
                    normals[used].astype(np.float32) if normals is not None else None,
                )
            )
    entry = None
    if entry_doors:
        # Preferencia: porta :3828930; senao, a de maior X (mesmo criterio do site).
        _pref, dmin, dmax = sorted(entry_doors, key=lambda d: (d[0], (d[1][0] + d[2][0]) / 2))[-1]
        entry = {"min": [float(v) for v in dmin], "max": [float(v) for v in dmax]}
    return groups, dict(counts), anchor, entry


def build():
    OUT.mkdir(exist_ok=True)
    manifest = {
        "version": 2,
        "materials": "canil-kinds",
        "models": {},
        "coordinates": "ifc-world-zup-to-gltf-yup",
    }
    anchor = None
    for discipline, filename in FILES.items():
        path = ROOT / filename
        if not path.exists():
            raise FileNotFoundError(path)
        print(f"Convertendo {filename}...", flush=True)
        groups, counts, anchor, entry = pieces_for_model(path, anchor)
        if entry and discipline == "ARQ":
            manifest["entryDoor"] = entry
        if not groups:
            raise RuntimeError(f"IFC sem malhas validas: {filename}")
        scene = trimesh.Scene()
        for (kind, mkind, opacity), pieces in sorted(groups.items()):
            vertices_list, faces_list, colors_list, normals_list = [], [], [], []
            offset = 0
            for vertices, faces, rgb, normals in pieces:
                if normals is None:
                    normals = trimesh.Trimesh(vertices=vertices, faces=faces, process=False).vertex_normals
                normals_list.append(np.asarray(normals, dtype=np.float32))
                vertices_list.append(vertices)
                faces_list.append(faces + offset)
                offset += len(vertices)
                # Valores do estilo IFC gravados sem conversao: o glTF trata
                # COLOR_0 como linear, igual ao modo IFC do site.
                rgba = [int(round(c * 255)) for c in rgb] + [255]
                colors_list.append(np.tile(rgba, (len(vertices), 1)))
            mesh = trimesh.Trimesh(
                vertices=np.concatenate(vertices_list),
                faces=np.concatenate(faces_list),
                process=False,
            )
            mesh.vertex_normals = np.concatenate(normals_list)
            mesh.visual.vertex_colors = np.concatenate(colors_list).astype(np.uint8)
            if len(mesh.faces) <= FLAT_FACE_LIMIT:
                # Faces planas (telhado, paredes, lajes, madeiramento): normal
                # por face, como no modo IFC, sem manchas de suavizacao.
                colors = mesh.visual.vertex_colors[mesh.faces.reshape(-1)]
                mesh = trimesh.Trimesh(
                    vertices=mesh.vertices[mesh.faces.reshape(-1)],
                    faces=np.arange(len(mesh.faces) * 3).reshape((-1, 3)),
                    vertex_normals=np.repeat(mesh.face_normals, 3, axis=0),
                    process=False,
                )
                mesh.visual.vertex_colors = colors
            node = f"{kind}|{mkind}|{opacity:.2f}"
            scene.add_geometry(mesh, node_name=node, geom_name=node)
        target = OUT / (path.stem + ".glb")
        target.write_bytes(scene.export(file_type="glb", include_normals=True))
        manifest["models"][discipline] = {
            "file": target.name,
            "source": filename,
            "sourceSHA256": hash_file(path),
            "glbSHA256": hash_file(target),
            "categories": counts,
            "elements": sum(counts.values()),
            "sizeBytes": target.stat().st_size,
        }
        print(f"Gerado {target.name}: {target.stat().st_size:,} bytes, {len(groups)} malhas", flush=True)
    manifest["anchor"] = [float(x) for x in anchor]
    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    build()
