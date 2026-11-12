#!/usr/bin/env python3
"""Converte os IFCs do canil em GLB leve, agrupando por categoria IFC.

A visualizacao GLB preserva disciplinas e categorias. O IFC original continua
disponivel para consulta detalhada e download.
"""
import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

import ifcopenshell
import ifcopenshell.geom
import numpy as np
import trimesh

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "models"
FILES = {
    "ARQ": "CANIL.ifc",
    "EST": "ESTRUTURAL.ifc",
    "ELE": "ELETRICO.ifc",
    "HID": "HIDRAULICA.ifc",
}
COLORS = {
    "IFCWALL": [201, 198, 189, 255],
    "IFCWALLSTANDARDCASE": [201, 198, 189, 255],
    "IFCSLAB": [154, 164, 166, 255],
    "IFCROOF": [83, 96, 103, 255],
    "IFCDOOR": [95, 101, 103, 255],
    "IFCWINDOW": [140, 194, 210, 200],
    "IFCRAILING": [60, 71, 76, 255],
    "IFCCOLUMN": [165, 169, 173, 255],
    "IFCBEAM": [158, 162, 166, 255],
    "IFCFOOTING": [159, 161, 161, 255],
    "IFCPIPESEGMENT": [77, 159, 206, 255],
    "IFCPIPEFITTING": [77, 159, 206, 255],
    "IFCFLOWSEGMENT": [78, 157, 211, 255],
    "IFCCABLECARRIERSEGMENT": [226, 192, 99, 255],
    "IFCLIGHTFIXTURE": [250, 228, 162, 255],
}
DEFAULT = [158, 166, 173, 255]


def hash_file(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for part in iter(lambda: f.read(1024 * 1024), b""):
            h.update(part)
    return h.hexdigest()


def triangles_for_model(path, anchor):
    model = ifcopenshell.open(str(path))
    settings = ifcopenshell.geom.settings()
    settings.set(settings.USE_WORLD_COORDS, True)
    # A geometria e processada pelo OpenCascade integrado no IfcOpenShell.
    iterator = ifcopenshell.geom.iterator(settings, model, max(1, min(4, os.cpu_count() or 2)))
    if not iterator.initialize():
        raise RuntimeError(f"Nao foi possivel processar a geometria de {path.name}")
    segments = defaultdict(list)
    counts = defaultdict(int)
    bounds_min = np.array([np.inf, np.inf, np.inf])
    bounds_max = -bounds_min
    while True:
        shape = iterator.get()
        try:
            obj = model.by_id(int(shape.id))
            kind = obj.is_a().upper()
            if kind in {"IFCSPACE", "IFCOPENINGELEMENT"}:
                continue
            verts = np.asarray(shape.geometry.verts, dtype=np.float64).reshape((-1, 3))
            faces = np.asarray(shape.geometry.faces, dtype=np.int64).reshape((-1, 3))
            if not len(verts) or not len(faces):
                continue
            # IFC = eixo Z para cima; GLB/Three.js = eixo Y para cima.
            vertices = np.column_stack((verts[:, 0], verts[:, 2], -verts[:, 1]))
            if anchor is None:
                anchor = vertices.min(axis=0).copy()
            vertices -= anchor
            bounds_min = np.minimum(bounds_min, vertices.min(axis=0))
            bounds_max = np.maximum(bounds_max, vertices.max(axis=0))
            segments[kind].append((vertices.astype(np.float32), faces.astype(np.uint32)))
            counts[kind] += 1
        except Exception as exc:
            print(f"Aviso: geometria ignorada em {path.name}: {exc}")
        finally:
            if not iterator.next():
                break
    return segments, dict(counts), anchor, bounds_min, bounds_max


def build():
    OUT.mkdir(exist_ok=True)
    manifest = {"version": 1, "models": {}, "coordinates": "ifc-world-zup-to-gltf-yup"}
    anchor = None
    for discipline, filename in FILES.items():
        path = ROOT / filename
        if not path.exists():
            raise FileNotFoundError(path)
        print(f"Convertendo {filename}...", flush=True)
        segments, counts, anchor, min_bounds, max_bounds = triangles_for_model(path, anchor)
        if not segments:
            raise RuntimeError(f"IFC sem malhas validas: {filename}")
        scene = trimesh.Scene()
        for kind, pieces in sorted(segments.items()):
            # Agrupa todos os objetos da mesma categoria em um unico draw call.
            # Retem a categoria para camadas, mas nao a selecao individual.
            vertices_list, faces_list = [], []
            offset = 0
            for vertices, faces in pieces:
                vertices_list.append(vertices)
                faces_list.append(faces + offset)
                offset += len(vertices)
            combined = trimesh.Trimesh(
                vertices=np.concatenate(vertices_list),
                faces=np.concatenate(faces_list),
                process=False,
            )
            combined.visual.vertex_colors = np.tile(
                COLORS.get(kind, DEFAULT), (len(combined.vertices), 1)
            )
            scene.add_geometry(combined, node_name=kind, geom_name=kind)
        target = OUT / (path.stem + ".glb")
        target.write_bytes(scene.export(file_type="glb"))
        manifest["models"][discipline] = {
            "file": target.name,
            "source": filename,
            "sourceSHA256": hash_file(path),
            "categories": counts,
            "elements": sum(counts.values()),
            "sizeBytes": target.stat().st_size,
        }
        print(f"Gerado {target.name}: {target.stat().st_size:,} bytes", flush=True)
    manifest["anchor"] = [float(x) for x in anchor]
    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    build()
