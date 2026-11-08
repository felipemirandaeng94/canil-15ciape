// Visualizador de pranchas: PDF.js com leitor nativo como alternativa.
// Não modifica arquivos PDF, IFC ou a ferramenta de publicação.
const PDFJS_URL='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
let pdfJsPromise;
function loadPdfJs(){
  if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
  if(!pdfJsPromise)pdfJsPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=PDFJS_URL;
    script.async=true;
    script.onload=()=>{
      if(!window.pdfjsLib){reject(new Error('PDF.js não iniciou.'));return;}
      window.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
      resolve(window.pdfjsLib);
    };
    script.onerror=()=>reject(new Error('Biblioteca PDF.js indisponível.'));
    document.head.append(script);
  });
  return pdfJsPromise;
}
function formatBytes(n){
  if(!Number.isFinite(n)||n<=0)return 'PDF';
  return n>=1048576?(n/1048576).toLocaleString('pt-BR',{maximumFractionDigits:1})+' MB':
    (n/1024).toLocaleString('pt-BR',{maximumFractionDigits:0})+' KB';
}
function cleanName(name){return String(name).replace(/\.pdf$/i,'');}
export function initPdfWorkspace({dialog,onChoose}){
  dialog.innerHTML=[
    '<div class="pdfw-shell">',
      '<header class="pdfw-header">',
        '<div class="pdfw-filemark" aria-hidden="true">PDF</div>',
        '<div class="pdfw-identity"><span class="pdfw-kicker" id="pdfw-kicker">PRANCHAS DO PROJETO</span><h2 id="pdf-title">Visualizador de pranchas</h2></div>',
        '<div class="pdfw-header-actions">',
          '<a id="pdf-download" class="pdfw-action" download>↓ <span>Baixar PDF</span></a>',
          '<a id="pdfw-newtab" class="pdfw-action" target="_blank" rel="noopener">↗ <span>Abrir em nova aba</span></a>',
          '<button id="pdfw-fullscreen" class="pdfw-action" type="button">⛶ <span>Tela cheia</span></button>',
          '<button id="close-pdf" class="pdfw-action pdfw-close" type="button">× <span>Fechar</span></button>',
        '</div>',
      '</header>',
      '<div class="pdfw-main">',
        '<aside class="pdfw-sidebar" aria-label="Pranchas da disciplina">',
          '<div class="pdfw-side-heading"><div><strong>Pranchas da disciplina</strong><span id="pdfw-category">Arquitetônico</span></div><button id="pdfw-hide-sidebar" type="button" title="Recolher miniaturas" aria-label="Recolher miniaturas">‹</button></div>',
          '<div id="pdfw-files" class="pdfw-files"></div>',
          '<div class="pdfw-side-decoration" aria-hidden="true">◈</div>',
        '</aside>',
        '<section class="pdfw-reader" aria-label="Leitura da prancha">',
          '<div class="pdfw-toolbar">',
            '<button class="pdfw-tool pdfw-toggle-thumbs" id="pdfw-show-sidebar" type="button" title="Mostrar miniaturas" aria-label="Mostrar miniaturas">☰</button>',
            '<div class="pdfw-tools-group">',
              '<button class="pdfw-tool" id="pdfw-prev-page" type="button" title="Página anterior" aria-label="Página anterior">‹</button>',
              '<input id="pdfw-page-input" type="number" min="1" value="1" aria-label="Número da página">',
              '<span class="pdfw-page-count">/ <span id="pdfw-pages">1</span></span>',
              '<button class="pdfw-tool" id="pdfw-next-page" type="button" title="Próxima página" aria-label="Próxima página">›</button>',
            '</div>',
            '<span class="pdfw-divider"></span>',
            '<div class="pdfw-tools-group">',
              '<button class="pdfw-tool" id="pdfw-zoom-out" type="button" title="Reduzir zoom">−</button>',
              '<select id="pdfw-zoom" aria-label="Escala de visualização"><option value="fit-width">Ajustar à largura</option><option value="fit-page">Ajustar à página</option><option value="50">50%</option><option value="75">75%</option><option value="100">100%</option><option value="125">125%</option><option value="150">150%</option><option value="200">200%</option><option value="300">300%</option></select>',
              '<button class="pdfw-tool" id="pdfw-zoom-in" type="button" title="Aumentar zoom">+</button>',
            '</div>',
            '<span class="pdfw-divider"></span>',
            '<button class="pdfw-tool pdfw-tool-labeled" id="pdfw-rotate" type="button" title="Girar a página 90 graus">↻ <span>Girar 90°</span></button>',
            '<button class="pdfw-tool pdfw-tool-labeled active" id="pdfw-pan" type="button" aria-pressed="true" title="Arrastar para mover">✋ <span>Mover</span></button>',
            '<span class="pdfw-toolbar-spacer"></span>',
            '<button class="pdfw-tool pdfw-tool-labeled" id="pdfw-print" type="button" title="Abrir PDF para impressão">⎙ <span>Imprimir</span></button>',
          '</div>',
          '<div class="pdfw-stage" id="pdfw-stage" tabindex="0" aria-label="Área da prancha; rolagem para percorrer">',
            '<div id="pdfw-paper" class="pdfw-paper"><canvas id="pdfw-canvas" aria-label="Página PDF renderizada"></canvas></div>',
            '<iframe id="pdf-frame" title="Leitor PDF alternativo" hidden></iframe>',
            '<div id="pdfw-loading" class="pdfw-loading" role="status">Carregando prancha...</div>',
          '</div>',
        '</section>',
      '</div>',
      '<footer class="pdfw-footer">',
        '<div class="pdfw-document-data"><span>15ª CIA PE · Consulta de projeto</span><span id="pdfw-size">PDF</span><span id="pdfw-dimensions"></span></div>',
        '<div class="pdfw-document-nav"><button id="pdfw-prev-file" type="button">← Anterior</button><span id="pdfw-file-position">Prancha 1 de 1</span><button id="pdfw-next-file" type="button">Próxima →</button></div>',
      '</footer>',
    '</div>'
  ].join('');
  const $=id=>dialog.querySelector('#'+id);
  const stage=$('pdfw-stage'),canvas=$('pdfw-canvas'),paper=$('pdfw-paper'),frame=$('pdf-frame');
  const loader=$('pdfw-loading'),filesArea=$('pdfw-files'),zoom=$('pdfw-zoom');
  let doc=null,loadingTask=null,renderTask=null,source=null,lib=null;
  let activePage=1,rotation=0,mode='fit-width',scalePct=100,hand=true;
  let documentSeq=0,renderSeq=0,thumbObserver=null,thumbQueue=Promise.resolve(),dragStart=null;
  const state={category:'',name:'',files:[],url:''};
  function status(message){loader.textContent=message;loader.hidden=false;}
  function stopStatus(){loader.hidden=true;}
  function setSidebar(visible){
    dialog.classList.toggle('pdfw-sidebar-closed',!visible);
    $('pdfw-hide-sidebar').setAttribute('aria-expanded',String(visible));
    $('pdfw-show-sidebar').setAttribute('aria-expanded',String(visible));
  }
  $('pdfw-hide-sidebar').onclick=()=>setSidebar(false);
  $('pdfw-show-sidebar').onclick=()=>setSidebar(!dialog.classList.contains('pdfw-sidebar-closed'));
  $('pdfw-fullscreen').onclick=async()=>{
    try{
      if(document.fullscreenElement===dialog)await document.exitFullscreen();
      else if(dialog.requestFullscreen)await dialog.requestFullscreen();
    }catch(error){console.warn('Tela cheia indisponível:',error);}
  };
  $('pdfw-print').onclick=()=>{if(state.url)window.open(state.url,'_blank','noopener');};
  function updateFileNav(){
    const index=state.files.findIndex(item=>item.name===state.name);
    const position=index<0?0:index;
    $('pdfw-file-position').textContent='Prancha '+(position+1)+' de '+Math.max(state.files.length,1);
    $('pdfw-prev-file').disabled=position<=0;
    $('pdfw-next-file').disabled=position>=state.files.length-1;
    filesArea.querySelectorAll('.pdfw-file-item').forEach(el=>el.classList.toggle('active',el.dataset.name===state.name));
    filesArea.querySelectorAll('.pdfw-file-item').forEach(el=>el.setAttribute('aria-current',el.dataset.name===state.name?'true':'false'));
  }
  function navigateFile(delta){
    const index=state.files.findIndex(item=>item.name===state.name);
    const next=state.files[index+delta];
    if(next)onChoose(state.category,next.name);
  }
  $('pdfw-prev-file').onclick=()=>navigateFile(-1);
  $('pdfw-next-file').onclick=()=>navigateFile(1);
  function updatePageNav(){
    $('pdfw-page-input').value=activePage;
    $('pdfw-page-input').max=doc?doc.numPages:1;
    $('pdfw-pages').textContent=doc?doc.numPages:1;
    $('pdfw-prev-page').disabled=!doc||activePage<=1;
    $('pdfw-next-page').disabled=!doc||activePage>=doc.numPages;
  }
  function setPage(p){
    if(!doc)return;
    const n=Math.max(1,Math.min(doc.numPages,Math.round(Number(p)||1)));
    if(n===activePage)return;
    activePage=n;updatePageNav();render();
  }
  $('pdfw-prev-page').onclick=()=>setPage(activePage-1);
  $('pdfw-next-page').onclick=()=>setPage(activePage+1);
  $('pdfw-page-input').onchange=e=>setPage(e.target.value);
  function setZoom(value){
    if(value==='fit-width'||value==='fit-page'){mode=value;}
    else{mode='custom';scalePct=Math.max(20,Math.min(400,Number(value)||100));}
    if(mode==='custom'){
      if(!Array.from(zoom.options).some(x=>x.value===String(scalePct))){
        const option=new Option(scalePct+'%',String(scalePct));zoom.add(option);
      }
      zoom.value=String(scalePct);
    }else zoom.value=mode;
    render();
  }
  zoom.onchange=e=>setZoom(e.target.value);
  $('pdfw-zoom-in').onclick=()=>setZoom(String(Math.round((effectiveScale()*100+25)/25)*25));
  $('pdfw-zoom-out').onclick=()=>setZoom(String(Math.round((effectiveScale()*100-25)/25)*25));
  $('pdfw-rotate').onclick=()=>{rotation=(rotation+90)%360;render();};
  $('pdfw-pan').onclick=()=>{hand=!hand;$('pdfw-pan').classList.toggle('active',hand);$('pdfw-pan').setAttribute('aria-pressed',String(hand));stage.classList.toggle('pdfw-panning',hand);};
  stage.classList.add('pdfw-panning');
  stage.addEventListener('pointerdown',e=>{
    if(!hand||e.button!==0||frame.hidden===false)return;
    dragStart={x:e.clientX,y:e.clientY,left:stage.scrollLeft,top:stage.scrollTop,id:e.pointerId};
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove',e=>{
    if(!dragStart||dragStart.id!==e.pointerId)return;
    stage.scrollLeft=dragStart.left-(e.clientX-dragStart.x);
    stage.scrollTop=dragStart.top-(e.clientY-dragStart.y);
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(type,()=>{dragStart=null;});
  stage.addEventListener('wheel',e=>{
    if(!(e.ctrlKey||e.metaKey)||!doc)return;
    e.preventDefault();setZoom(String(Math.round(effectiveScale()*100+(e.deltaY<0?10:-10))));
  },{passive:false});
  function effectiveScale(){
    if(!doc)return scalePct/100;
    if(mode==='custom')return scalePct/100;
    const w=Number(paper.dataset.baseWidth)||1,h=Number(paper.dataset.baseHeight)||1;
    return Math.max(.08,mode==='fit-page'?Math.min((stage.clientWidth-54)/w,(stage.clientHeight-48)/h):(stage.clientWidth-54)/w);
  }
  async function render(){
    if(!doc)return;
    const token=++renderSeq;
    if(renderTask){try{renderTask.cancel();await renderTask.promise;}catch(error){}renderTask=null;}
    if(token!==renderSeq)return;
    try{
      const page=await doc.getPage(activePage);
      if(token!==renderSeq)return;
      const base=page.getViewport({scale:1,rotation});
      paper.dataset.baseWidth=String(base.width);
      paper.dataset.baseHeight=String(base.height);
      const scale=Math.max(.08,Math.min(4,effectiveScale()));
      const logical=page.getViewport({scale,rotation});
      const dpr=Math.min(window.devicePixelRatio||1,2);
      const pixels=logical.width*logical.height*dpr*dpr;
      const limitedDpr=pixels>22000000?Math.max(1,Math.sqrt(22000000/(logical.width*logical.height))):dpr;
      canvas.width=Math.max(1,Math.round(logical.width*limitedDpr));
      canvas.height=Math.max(1,Math.round(logical.height*limitedDpr));
      canvas.style.width=Math.round(logical.width)+'px';
      canvas.style.height=Math.round(logical.height)+'px';
      paper.style.width=canvas.style.width;
      paper.style.height=canvas.style.height;
      $('pdfw-dimensions').textContent=Math.round(base.width*25.4/72)+' × '+Math.round(base.height*25.4/72)+' mm';
      const ctx=canvas.getContext('2d',{alpha:false});
      const viewport=page.getViewport({scale:scale*limitedDpr,rotation});
      renderTask=page.render({canvasContext:ctx,viewport,background:'#ffffff'});
      await renderTask.promise;
      if(token===renderSeq){stopStatus();frame.hidden=true;paper.hidden=false;}
    }catch(error){
      if(error?.name==='RenderingCancelledException')return;
      console.warn('Falha na renderização da prancha:',error);
      if(token===renderSeq)useNativeFallback('Leitor alternativo disponível.');
    }finally{
      if(token===renderSeq)renderTask=null;
    }
  }
  function useNativeFallback(message){
    if(source){frame.src=state.url;frame.hidden=false;paper.hidden=true;loader.textContent=message;loader.hidden=true;}
    updatePageNav();
  }
  async function renderThumbnail(button,file,seq){
    if(seq!==documentSeq||button.dataset.thumbReady)return;
    button.dataset.thumbReady='loading';
    let pageDoc=null,task=null;
    try{
      if(!lib)return;
      if(file.name===state.name&&doc)pageDoc=doc;
      else{
        const url=new URL('./plantas/'+encodeURIComponent(state.category)+'/'+encodeURIComponent(file.name),location.href);
        const response=await fetch(url,{signal:AbortSignal.timeout(25000)});
        if(!response.ok)throw new Error('Prévia indisponível');
        task=lib.getDocument({data:new Uint8Array(await response.arrayBuffer())});
        pageDoc=await task.promise;
      }
      if(seq!==documentSeq)return;
      const first=await pageDoc.getPage(1);
      const basic=first.getViewport({scale:1});
      const thumb=first.getViewport({scale:Math.min(110/basic.width,82/basic.height)});
      const small=document.createElement('canvas');small.width=Math.max(1,Math.floor(thumb.width));small.height=Math.max(1,Math.floor(thumb.height));
      await first.render({canvasContext:small.getContext('2d'),viewport:thumb,background:'#fff'}).promise;
      if(seq===documentSeq){const container=button.querySelector('.pdfw-thumb');container.replaceChildren(small);}
      button.dataset.thumbReady='done';
    }catch(error){button.dataset.thumbReady='failed';}
    finally{if(task)try{await task.destroy();}catch(error){}}
  }
  function renderFileList(seq){
    thumbObserver?.disconnect();thumbObserver=null;
    filesArea.replaceChildren();
    const list=state.files;
    const actions=[];
    list.forEach((file,i)=>{
      const item=document.createElement('button');item.type='button';item.className='pdfw-file-item';
      item.dataset.name=file.name;item.title='Abrir '+file.name;
      const preview=document.createElement('span');preview.className='pdfw-thumb';preview.textContent='PDF';
      const info=document.createElement('span');info.className='pdfw-file-info';
      const number=document.createElement('span');number.className='pdfw-file-number';number.textContent=String(i+1).padStart(2,'0');
      const name=document.createElement('strong');name.textContent=cleanName(file.name);
      const details=document.createElement('small');details.textContent='PDF'+(file.size?' · '+formatBytes(file.size):'');
      info.append(number,name,details);
      const active=document.createElement('span');active.className='pdfw-file-check';active.textContent='✓';
      item.append(preview,info,active);
      item.onclick=()=>{if(state.name!==file.name)onChoose(state.category,file.name);};
      filesArea.append(item);actions.push({item,file});
    });
    updateFileNav();
    if('IntersectionObserver' in window){
      thumbObserver=new IntersectionObserver(entries=>{
        for(const e of entries){if(!e.isIntersecting)return;const selected=actions.find(x=>x.item===e.target);if(!selected)continue;thumbObserver.unobserve(e.target);thumbQueue=thumbQueue.then(()=>renderThumbnail(selected.item,selected.file,seq));}
      },{root:filesArea,rootMargin:'70px'});
      actions.forEach(x=>thumbObserver.observe(x.item));
    }else actions.slice(0,3).forEach(x=>{thumbQueue=thumbQueue.then(()=>renderThumbnail(x.item,x.file,seq));});
  }
  async function open({category,label,name,url,bytes,files}){
    const seq=++documentSeq;
    renderSeq++;
    if(renderTask){try{renderTask.cancel();await renderTask.promise;}catch(error){}renderTask=null;}
    if(loadingTask){try{await loadingTask.destroy();}catch(error){}loadingTask=null;}
    doc=null;lib=null;source=bytes;
    state.category=category;state.name=name;state.url=url;
    state.files=(files?.length?files:[{name}]).map(x=>({name:x.name,size:x.size||0}));
    activePage=1;rotation=0;mode='fit-width';zoom.value='fit-width';
    $('pdfw-kicker').textContent=label.toUpperCase()+' · PRANCHA '+String(Math.max(1,state.files.findIndex(x=>x.name===name)+1)).padStart(2,'0')+'/'+String(state.files.length).padStart(2,'0');
    $('pdf-title').textContent=name;
    $('pdfw-category').textContent=label+' ('+state.files.length+')';
    $('pdfw-size').textContent=formatBytes(bytes.byteLength);
    $('pdfw-dimensions').textContent='';
    $('pdf-download').href=url;$('pdf-download').download=name;
    $('pdfw-newtab').href=url;
    paper.hidden=true;frame.hidden=true;frame.src='about:blank';
    status('Preparando visualização da prancha...');
    updatePageNav();
    renderFileList(seq);
    try{
      lib=await loadPdfJs();if(seq!==documentSeq)return;
      loadingTask=lib.getDocument({data:new Uint8Array(bytes)});
      doc=await loadingTask.promise;if(seq!==documentSeq)return;
      updatePageNav();await render();
    }catch(error){
      if(seq!==documentSeq)return;
      console.warn('PDF.js indisponível; usando leitor do navegador.',error);
      useNativeFallback('Exibindo no leitor do navegador.');
    }
  }
  function dispose(){
    documentSeq++;renderSeq++;
    thumbObserver?.disconnect();thumbObserver=null;
    if(renderTask){renderTask.cancel();renderTask=null;}
    if(loadingTask){loadingTask.destroy().catch(()=>{});loadingTask=null;}
    doc=null;lib=null;source=null;frame.src='about:blank';paper.hidden=true;
    if(document.fullscreenElement===dialog)document.exitFullscreen().catch(()=>{});
  }
  function showError(error){status(error);paper.hidden=true;frame.hidden=true;}
  const resize=new ResizeObserver(()=>{if(doc&&(mode==='fit-width'||mode==='fit-page'))render();});
  resize.observe(stage);
  return {open,dispose,showError};
}
