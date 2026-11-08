// ViewCube IFC: representação da câmera com faces e cantos clicáveis.
export function mountViewCube({wrap,camera,THREE,setView,getViewAngles}){
  const ns='http://www.w3.org/2000/svg';
  const make=(tag,attrs={})=>{
    const el=document.createElementNS(ns,tag);
    for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));
    return el;
  };
  const root=document.createElement('div');
  root.id='orientation';
  root.className='viewcube-widget';
  root.setAttribute('aria-label','Cubo de navegação 3D');
  const svg=make('svg',{viewBox:'0 0 140 140','aria-label':'Orientação 3D do modelo',role:'img'});
  root.append(svg);
  const defs=make('defs');svg.append(defs);
  const specs=[
    ['top','TOPO',[0,1,0],'#edf2f3',[[1,1,-1],[1,1,1],[-1,1,1],[-1,1,-1]]],
    ['bottom','BASE',[0,-1,0],'#a5b3b8',[[1,-1,-1],[-1,-1,-1],[-1,-1,1],[1,-1,1]]],
    ['front','FRENTE',[1,0,0],'#ced7da',[[1,1,1],[1,1,-1],[1,-1,-1],[1,-1,1]]],
    ['back','TRÁS',[-1,0,0],'#b9c6c8',[[-1,1,-1],[-1,1,1],[-1,-1,1],[-1,-1,-1]]],
    ['right','DIREITA',[0,0,1],'#b0c1c6',[[-1,1,1],[1,1,1],[1,-1,1],[-1,-1,1]]],
    ['left','ESQUERDA',[0,0,-1],'#b8c9cd',[[1,1,-1],[-1,1,-1],[-1,-1,-1],[1,-1,-1]]]
  ];
  const faces=specs.map(([key,label,normal,fill,vertices])=>{
    const group=make('g',{'class':'viewcube-face',role:'button',tabindex:'0','aria-label':'Vista '+label.toLowerCase()});
    const poly=make('polygon',{fill,stroke:'#62737b','stroke-width':'1.3','stroke-linejoin':'round'});
    // Face clipping keeps labels within the visible polygon at oblique angles.
    const clip=make('clipPath',{id:'viewcube-face-clip-'+key,clipPathUnits:'userSpaceOnUse'});
    const clipPoly=make('polygon');clip.append(clipPoly);defs.append(clip);
    const text=make('text',{'class':'viewcube-face-label','text-anchor':'middle','dominant-baseline':'middle','clip-path':'url(#viewcube-face-clip-'+key+')'});
    text.textContent=label;
    const title=make('title');title.textContent='Mostrar '+label.toLowerCase();
    group.append(poly,text,title);
    const activate=()=>setView(key);
    group.addEventListener('click',activate);
    group.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
    return {key,normal:new THREE.Vector3(...normal),vertices,group,poly,clipPoly,text};
  });
  const corners=[];
  for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
    const node=make('circle',{r:4.5,'class':'viewcube-corner',role:'button',tabindex:'0','aria-label':'Vista isométrica'});
    const action=()=>setView({phi:y>0?Math.PI/4:Math.PI*3/4,theta:Math.atan2(z,x)});
    node.addEventListener('click',action);
    node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}});
    corners.push({node,vector:[x,y,z]});
  }
  const controls=document.createElement('div');
  controls.className='viewcube-rotate';
  for(const [name,symbol,direction] of [
    ['Girar 90 graus à esquerda','↶',-1],
    ['Girar 90 graus à direita','↷',1]
  ]){
    const btn=document.createElement('button');btn.type='button';
    btn.className='viewcube-rotate-button';btn.textContent=symbol;
    btn.title=name;btn.setAttribute('aria-label',name);
    btn.onclick=()=>{
      const angles=getViewAngles();
      setView({phi:angles.phi,theta:angles.theta+direction*Math.PI/2});
    };
    controls.append(btn);
  }
  root.append(controls);wrap.append(root);

  const inverse=new THREE.Quaternion(),vector=new THREE.Vector3();
  const project=point=>{
    vector.set(...point).applyQuaternion(inverse);
    // Wider cuboid (~100 px) so FRENTE/DIREITA remain legible.
    const factor=31/(1-.12*vector.z);
    return {x:70+vector.x*factor,y:64-vector.y*factor,z:vector.z};
  };
  const previous=new THREE.Quaternion(0,0,0,0);
  let frame=0;
  function redraw(){
    if(!root.isConnected)return;
    frame=requestAnimationFrame(redraw);
    if(Math.abs(previous.dot(camera.quaternion))>.999999)return;
    previous.copy(camera.quaternion);
    inverse.copy(camera.quaternion).invert();
    const visible=[];
    for(const face of faces){
      const normal=face.normal.clone().applyQuaternion(inverse);
      if(normal.z<=.001){face.group.style.display='none';continue;}
      face.group.style.display='';
      const points=face.vertices.map(project);
      const polygonPoints=points.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
      face.poly.setAttribute('points',polygonPoints);
      face.clipPoly.setAttribute('points',polygonPoints);
      face.text.setAttribute('x',(points.reduce((n,p)=>n+p.x,0)/4).toFixed(1));
      face.text.setAttribute('y',(points.reduce((n,p)=>n+p.y,0)/4).toFixed(1));
      const spanX=Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x));
      const labelWidth=Math.min(face.text.textContent.length*5.6,spanX*.68);
      face.text.setAttribute('font-size','9');
      face.text.setAttribute('lengthAdjust','spacingAndGlyphs');
      face.text.setAttribute('textLength',Math.max(6,labelWidth).toFixed(1));
      face.text.style.visibility=spanX<17?'hidden':'visible';
      visible.push({group:face.group,depth:points.reduce((n,p)=>n+p.z,0)/4});
    }
    visible.sort((a,b)=>a.depth-b.depth);
    for(const item of visible)svg.append(item.group);
    for(const corner of corners){
      const p=project(corner.vector);
      const front=new THREE.Vector3(...corner.vector).applyQuaternion(inverse).z;
      corner.node.style.display=front>-.02?'':'none';
      corner.node.setAttribute('cx',p.x.toFixed(1));corner.node.setAttribute('cy',p.y.toFixed(1));
      svg.append(corner.node);
    }
  }
  redraw();
  return {destroy(){cancelAnimationFrame(frame);root.remove();}};
}
