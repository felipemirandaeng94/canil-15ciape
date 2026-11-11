// Interface components; geometry, materials and navigation remain in index.html.
export function initInterface(api){
  const $=id=>document.getElementById(id);
  const paths={cube:'m12 3 9 5v9l-9 5-9-5V8z M3 8l9 5 9-5 M12 13v9',folder:'M3 7V4h6l3 3h9v13H3z',layers:'m12 3 10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5',chart:'M4 20V12h4v8 M10 20V8h4v12 M16 20V3h4v17',info:'M12 11v6 M12 7v1 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',menu:'M4 6h16 M4 12h16 M4 18h16',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',arrow:'M5 3v17l5-5 5 6 3-2-5-6 7-2z',expand:'M8 3H3v5 M16 3h5v5 M3 16v5h5 M21 16v5h-5',download:'M12 3v12 m-5-5 5 5 5-5 M4 16v5h16v-5',external:'M14 3h7v7 M21 3l-11 11 M10 5H4v15h15v-6',reset:'M4 9a8 8 0 1 1-1 7 M4 3v6h6'};
  const icon=name=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.cube}"/></svg>`;
  function button(label,symbol,action,cls='ui-button'){const b=document.createElement('button');b.className=cls;b.title=label;b.innerHTML=icon(symbol);const s=document.createElement('span');s.textContent=label;b.append(s);b.onclick=action;return b;}
  function note(text){const p=document.createElement('p');p.className='ui-note';p.textContent=text;return p;}
  const main=$('main'),side=$('sidebar'),wrap=$('canvas-wrap'),toolbar=$('toolbar');
  const nav=document.createElement('nav');nav.id='workspace-nav';nav.setAttribute('aria-label','Áreas do projeto');main.prepend(nav);
  const collapse=button('Recolher menu','menu',()=>{main.classList.toggle('nav-collapsed');collapse.setAttribute('aria-expanded',String(!main.classList.contains('nav-collapsed')));});collapse.setAttribute('aria-expanded','true');nav.append(collapse);
  const panelHeader=document.createElement('div');panelHeader.className='panel-header';panelHeader.innerHTML='<span>ARQUIVOS E DISCIPLINAS</span>';
  // Reenquadrar somente após a grade flex ajustar o canvas, preservando os ângulos.
  let layoutFrame=0;
  function reframeAfterLayout(){
    if(matchMedia('(max-width:800px)').matches)return;
    cancelAnimationFrame(layoutFrame);
    layoutFrame=requestAnimationFrame(()=>{
      layoutFrame=requestAnimationFrame(()=>api.reframeCurrentView?.());
    });
  }
  const closePanel=button('Recolher painel','expand',()=>{
    main.classList.add('panel-collapsed');api.closeMobilePanels();reframeAfterLayout();
  });panelHeader.append(closePanel);
  const tabs=document.createElement('div');tabs.className='panel-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Painel BIM');
  const panels={},tabButtons={};
  function showPanel(key){
    const wasCollapsed=main.classList.contains('panel-collapsed');
    main.classList.remove('panel-collapsed');
    for(const [name,p] of Object.entries(panels))p.hidden=name!==key;
    for(const [name,b] of Object.entries(tabButtons)){
      b.setAttribute('aria-selected',String(name===key));
      b.tabIndex=name===key?0:-1;
    }
    if(matchMedia('(max-width:800px)').matches){
      api.closeMobilePanels();side.classList.add('mobile-open');side.inert=false;main.classList.add('mobile-panel-open');
    }else if(wasCollapsed)reframeAfterLayout();
    updateSelection();
  }
  const pdf=$('pdf-list'),refresh=$('refresh-pdfs'),layers=$('layers');
  for(const [key,label] of [['disciplines','Disciplinas'],['pdf','Plantas PDF'],['properties','Propriedades']]){const p=document.createElement('section');p.id='panel-'+key;p.className='workspace-panel';p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby','tab-'+key);panels[key]=p;const b=button(label,'folder',()=>showPanel(key));b.id='tab-'+key;b.setAttribute('role','tab');b.setAttribute('aria-controls',p.id);b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const keys=Object.keys(tabButtons),i=keys.indexOf(key);const next=keys[e.key==='Home'?0:e.key==='End'?keys.length-1:(i+(e.key==='ArrowRight'?1:-1)+keys.length)%keys.length];showPanel(next);tabButtons[next].focus();});tabButtons[key]=b;tabs.append(b);}
  panels.pdf.append(note('Escolha uma disciplina para consultar suas pranchas.'),pdf,refresh);
  panels.disciplines.append(note('Sobreponha os modelos e ajuste a visibilidade e a transparência.'),layers,note('Compatibilização visual. Exporte os IFCs com a mesma origem e orientação.'));
  const hydro=document.createElement('section');hydro.className='hydro-group';hydro.innerHTML='<h3>Hidrossanitário</h3>';for(const def of api.modelDefs.filter(d=>['HID','ESG'].includes(d.id)))hydro.append(def.check.closest('.model-card'));layers.append(hydro);
  // Each discipline offers a direct path back to the interactive 3D viewer.
  for(const def of api.modelDefs){
    const card=def.check.closest('.model-card');
    if(!card)continue;
    const open=button('Visualizar no 3D','cube',()=>{
      def.visible=true;def.check.checked=true;
      api.closeMobilePanels();main.classList.add('panel-collapsed');reframeAfterLayout();
      api.fitView();
    },'ui-button ifc-view-action');
    open.title='Abrir o visualizador IFC de '+def.label;
    card.append(open);
  }
  side.replaceChildren(panelHeader,tabs,...Object.values(panels));
  const navItems=[['Modelo IFC','cube',()=>{api.closeMobilePanels();main.classList.add('panel-collapsed');reframeAfterLayout();}],['Plantas (PDF)','folder',()=>showPanel('pdf')],['Disciplinas','layers',()=>showPanel('disciplines')],['Quantitativos','chart',()=>showOverview('counts')],['Compatibilização','layers',()=>showPanel('disciplines')],['Documentos','folder',()=>showPanel('pdf')],['Dados do Projeto','info',()=>showOverview('project')]];
  for(const [label,symbol,action] of navItems){const b=button(label,symbol,()=>{nav.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');action();},'ui-button nav-item');nav.append(b);}
  nav.querySelector('.nav-item').classList.add('active');
  const overview=document.createElement('dialog');overview.className='overview-dialog';document.body.append(overview);
  function uniqueElements(){return [...new Map([...api.meshMeta.values()].map(m=>[m.discipline+':'+m.id,m])).values()];}
  function showOverview(kind){overview.replaceChildren();const title=document.createElement('h2');title.textContent=kind==='counts'?'Quantitativos do modelo':'Dados do projeto';overview.append(title);if(kind==='counts'){overview.append(note('Contagem de elementos com geometria, por classe IFC. Quantidades fornecidas pelo autor, quando existentes, aparecem nas propriedades de cada elemento.'));const counts=new Map();for(const m of uniqueElements()){const key=m.disciplineLabel+' · '+api.categoryLabel(m.type)+' · '+m.type;counts.set(key,(counts.get(key)||0)+1);}for(const [name,count] of counts){const row=document.createElement('p');row.className='count-row';row.textContent=name+' — '+count;overview.append(row);}}else{overview.append(note('OP RICARDO FRANCO — EXTENSÃO DO CANIL DA 15ª CIA PE'));for(const d of api.modelDefs)overview.append(note(d.status.textContent));}overview.append(button('Fechar','reset',()=>overview.close()));api.leaveWalk();overview.showModal();}
  const summary=document.createElement('div');summary.className='model-summary';nav.append(summary);
  const badge=document.querySelector('#header .badge');const coordination=button('Coordenação BIM','layers',()=>showPanel('disciplines'));coordination.classList.add('coordination');badge.replaceWith(coordination);
  const title=$('header').querySelector('h1');title.innerHTML='<strong>OP RICARDO FRANCO</strong><span>EXTENSÃO DO CANIL DA 15ª CIA PE</span>';
  // Keep the original controls and event handlers, changing only their placement.
  const views=document.createElement('div');views.id='preset-views';views.setAttribute('aria-label','Vistas predefinidas');
  const viewsHeading=document.createElement('span');viewsHeading.className='view-strip-heading';viewsHeading.textContent='VISTAS PREDEFINIDAS';views.append(viewsHeading);
  const viewControls=[['iso','Isométrica','cube'],['top','Superior','layers'],['front','Frontal','cube'],['side','Lateral','cube']];
  const viewCards=new Map();
  let previewTimer=0;
  for(const [key,label,symbol] of viewControls){
    const card=document.createElement('button');card.type='button';card.className='ui-button view-card';
    card.dataset.view=key;card.title='Exibir vista '+label.toLowerCase();
    card.setAttribute('aria-label','Exibir vista '+label.toLowerCase());
    card.setAttribute('aria-pressed',String(key==='iso'));
    if(key==='iso')card.classList.add('active');
    const thumbnail=document.createElement('span');thumbnail.className='view-preview';
    const placeholder=document.createElement('span');placeholder.className='view-placeholder';placeholder.innerHTML=icon(symbol);
    const image=document.createElement('img');image.alt='Prévia da vista '+label.toLowerCase()+' do modelo IFC';image.hidden=true;
    thumbnail.append(placeholder,image);
    const caption=document.createElement('span');caption.className='view-caption';caption.textContent=label;
    card.append(thumbnail,caption);
    card.onclick=()=>{api.setView(key);for(const [name,node] of viewCards){node.classList.toggle('active',name===key);node.setAttribute('aria-pressed',String(name===key));}};
    views.append(card);viewCards.set(key,card);
  }
  function refreshViewThumbnails(){
    clearTimeout(previewTimer);
    previewTimer=setTimeout(()=>{
      if(!api.meshMeta.size)return;
      for(const [key,card] of viewCards){
        try{
          const data=api.captureViewThumbnail(key,256,138);
          if(!data)continue;
          const image=card.querySelector('.view-preview img');
          image.src=data;image.hidden=false;
          card.classList.add('has-preview');
        }catch(error){console.warn('Prévia IFC indisponível:',key,error);}
      }
    },240);
  }
  for(const id of ['btn-top','btn-front','btn-side'])$(id).hidden=true;
  toolbar.querySelectorAll('.tool-section').forEach(e=>e.hidden=true);
  const select=button('Selecionar','arrow',()=>{api.leaveWalk();showPanel('properties');},'tb');select.classList.add('on');toolbar.prepend(select);
  const hide=button('Ocultar','eye',api.hideSelectedElement,'tb'),isolate=button('Isolar elemento','layers',()=>{const m=api.meshMeta.get(api.getSelected());if(!m)return;for(const [mesh,meta] of api.meshMeta)if(mesh.visible&&mesh.parent.visible&&(meta.id!==m.id||meta.discipline!==m.discipline)){mesh.visible=false;api.hiddenMeshes.add(mesh);}api.updateHiddenButton();refreshViewThumbnails();},'tb');toolbar.append(hide,isolate,button('Disciplinas','layers',()=>showPanel('disciplines'),'tb'));
  const restore=button('Restaurar câmera','reset',api.fitView,'tb');toolbar.append(restore);
  const footer=document.createElement('div');footer.id='viewer-footer';const status=document.createElement('div');status.id='workspace-status';footer.append(status,views);wrap.append(footer);
  const reopen=button('Abrir painel','folder',()=>showPanel('pdf'));
  reopen.id='reopen-panel';reopen.setAttribute('aria-controls','sidebar');
  reopen.setAttribute('aria-label','Exibir painel de arquivos e disciplinas');
  wrap.append(reopen);
  // A orientação é controlada pelo ViewCube dedicado no módulo principal.
  function field(parent,label,value){const row=document.createElement('div');row.className='property-row';const term=document.createElement('span'),val=document.createElement('span');term.textContent=label;val.textContent=value??'Não informado';row.append(term,val);parent.append(row);}
  function scalar(value){if(value==null)return 'Não informado';if(Array.isArray(value))return value.map(scalar).join(', ');if(typeof value==='object'){if('value' in value)return scalar(value.value);if('_internalValue' in value)return scalar(value._internalValue);return Object.entries(value).filter(([k,v])=>!['expressID','type','_representationValue'].includes(k)&&v!=null).map(([k,v])=>k+': '+scalar(v)).join('; ');}return typeof value==='number'?value.toLocaleString('pt-BR',{maximumFractionDigits:6}):String(value);}
  let lastSelection;
  function updateSelection(){const mesh=api.getSelected();hide.disabled=isolate.disabled=!mesh;if(lastSelection===mesh&&panels.properties.childNodes.length)return;lastSelection=mesh;const p=panels.properties;p.replaceChildren();const m=api.meshMeta.get(mesh);if(!m){p.append(note('Clique em um elemento do modelo para consultar suas propriedades IFC.'));return;}
    for(const [label,value] of [['Identificação',m.id],['Nome',m.name],['Tipo',m.objectType||m.role||'Não informado'],['Classe IFC',m.type],['Disciplina',m.disciplineLabel],['GlobalId',m.globalId||'Não informado'],['Pavimento',m.storey||'Não informado']])field(p,label,value);
    if(!m.propertyGroups?.length)p.append(note('Nenhum conjunto de propriedades ou quantitativos associado diretamente a este elemento foi encontrado.'));
    for(const group of m.propertyGroups||[]){const details=document.createElement('details'),s=document.createElement('summary');s.textContent=group.name;details.append(s);for(const property of group.values){const name=property.Name?.value||'Propriedade';const entries=Object.entries(property).filter(([k,v])=>!['expressID','type','Name','Description'].includes(k)&&v!=null);field(details,name,entries.map(([k,v])=>(k==='Unit'?'Unidade: ':'')+scalar(v)).join(' · ')||'Não informado');}p.append(details);}
    p.append(button('Ocultar elemento · H H','eye',api.hideSelectedElement));
  }
  $('c').addEventListener('click',()=>{updateSelection();if(api.getSelected())showPanel('properties');});
  $('btn-mobile-pdfs').addEventListener('click',()=>showPanel('pdf'));
  $('btn-mobile-layers').addEventListener('click',()=>showPanel('disciplines'));
  // Extend each existing PDF entry without replacing its viewer or admin flow.
  new MutationObserver(()=>{for(const b of pdf.querySelectorAll('.pdf-link:not([data-actions])')){b.dataset.actions='true';const folder=b.closest('.pdf-folder'),index=[...pdf.children].indexOf(folder),slug=['arquitetonico','estrutural','eletrico','hidrossanitario'][index];if(!slug)continue;const name=b.textContent,url=new URL('./plantas/'+slug+'/'+encodeURIComponent(name),location.href);const row=document.createElement('div');row.className='pdf-entry';b.replaceWith(row);row.append(b);for(const [label,symbol,download] of [['Abrir em nova aba','external',false],['Baixar PDF','download',true]]){const a=document.createElement('a');a.className='pdf-action';a.title=label+' — '+name;a.setAttribute('aria-label',a.title);a.innerHTML=icon(symbol);a.href=url.href;if(download)a.download=name;else{a.target='_blank';a.rel='noopener';}row.append(a);}}}).observe(pdf,{childList:true,subtree:true});
  function refreshSummary(){const elems=uniqueElements(),loaded=api.modelDefs.filter(d=>d.count>0);summary.textContent='RESUMO DO MODELO\n'+elems.length.toLocaleString('pt-BR')+' elementos\n'+new Set(elems.map(m=>m.type)).size+' classes IFC\n'+loaded.length+' modelos carregados';const m=api.meshMeta.get(api.getSelected());status.textContent=(m?m.disciplineLabel+' · '+api.modelDefs.find(d=>d.id===m.discipline)?.file:loaded.map(d=>d.file).join(' + ')||'Aguardando modelos')+' · '+elems.length.toLocaleString('pt-BR')+' elementos · '+($('status').style.display==='none'?'Pronto':$('status-text').textContent);for(const d of api.modelDefs){const card=d.check.closest('.model-card');card.classList.toggle('unavailable',!d.count);card.querySelectorAll('input,button').forEach(c=>c.disabled=!d.count);}updateSelection();}
  setInterval(refreshSummary,800);refreshSummary();showPanel('pdf');api.closeMobilePanels();
  return {refreshViewThumbnails};
}
