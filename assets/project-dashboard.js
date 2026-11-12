// Painel de dados do projeto. Nao altera a geometria ou os controles BIM.
export function mountProjectDashboard(wrap, main){
  const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
  const num=(n,d=0)=>new Intl.NumberFormat('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
  const dashboard=document.createElement('section');
  dashboard.id='project-dashboard';dashboard.hidden=true;
  dashboard.setAttribute('aria-label','Dados de quantitativos, custo e prazo da obra');
  wrap.append(dashboard);
  const btn=(label,handler,cls='pd-button')=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.addEventListener('click',handler);return b;};
  const metric=(value,label,detail='')=>'<article class="pd-metric"><strong>'+value+'</strong><span>'+label+'</span>'+(detail?'<small>'+detail+'</small>':'')+'</article>';
  function shell(title,subtitle){
    dashboard.replaceChildren();
    const head=document.createElement('header');head.className='pd-header';
    const heading=document.createElement('div');heading.innerHTML='<p class="pd-kicker">OP RICARDO FRANCO / 15ª CIA PE</p><h2>'+title+'</h2><p>'+subtitle+'</p>';
    head.append(heading,btn('Voltar ao 3D',hide,'pd-button pd-close'));dashboard.append(head);
  }
  function section(html,extra=''){
    const node=document.createElement('section');node.className='pd-section '+extra;node.innerHTML=html;dashboard.append(node);return node;
  }
  function show(kind){
    main.classList.add('dashboard-open','panel-collapsed');
    dashboard.hidden=false;
    dashboard.scrollTop=0;
    if(kind==='quant')showQuant();else showCost();
  }
  function hide(){dashboard.hidden=true;main.classList.remove('dashboard-open');}
  function showQuant(){
    shell('Quantitativos','Resumo por disciplina extraído das quatro planilhas de materiais. Não são contagens de malhas IFC.');
    section('<div class="pd-metrics">'+
      metric('34 un.','Esquadrias','Portas e janelas · arquitetura')+
      metric('385,31 m²','Pisos','Área por camadas modeladas')+
      metric('127,26 m²','Forros','Área de forro arquitetônico')+
      metric('198,06 m²','Área útil','Área total dos ambientes')+'</div>');
    section('<h3>Principais quantitativos</h3><div class="pd-table-wrap"><table class="pd-table"><thead><tr><th>Disciplina</th><th>Material ou serviço</th><th>Quantidade</th></tr></thead><tbody>'+
      [['Arquitetura','Paredes de alvenaria (área modelada)','428,25 m²'],['Arquitetura','Cobertura de fibrocimento','175,40 m²'],
       ['Estrutura','Aço com acréscimo de 10%','2.099,30 kg'],['Estrutura','Volume de concreto moldado in loco','39,00 m³'],
       ['Estrutura','Área de fôrmas','485,90 m²'],['Elétrica','Caixas 4 × 2 polegadas','19 un.'],
       ['Elétrica','Eletroduto flexível 3/4 polegada','140,76 m'],['Elétrica','Luminárias (tipos listados)','21 un.'],
       ['Hidrossanitário','Torneiras de jardim','28 un.'],['Hidrossanitário','Caixas sifonadas','14 un.'],
       ['Hidrossanitário','Tubos de esgoto DN 100','45,80 m'],['Hidrossanitário','Reservatório de água','2.000 L']].
      map(x=>'<tr><td>'+x[0]+'</td><td>'+x[1]+'</td><td class="pd-amount">'+x[2]+'</td></tr>').join('')+
      '</tbody></table></div><p class="pd-small">Fontes: listas de materiais arquitetônico (Revit), estrutural e instalações (AltoQi). Quantitativos de projeto, sujeitos à conferência em campo. Áreas sobrepostas por camadas não equivalem automaticamente à área útil.</p>');
    section('<h3>Leitura rápida por disciplina</h3><div class="pd-discipline-grid">'+
      [['Arquitetura','Esquadrias, pisos, forros, paredes e cobertura.'],['Estrutural','Concreto, fôrmas e armaduras, conforme resumo de materiais.'],['Elétrica','Eletrodutos, cabos, iluminação, caixas e dispositivos.'],['Hidrossanitário','Água fria, esgoto, drenagem pluvial e reservação.']].
      map(a=>'<div><strong>'+a[0]+'</strong><p>'+a[1]+'</p></div>').join('')+'</div>');
  }
  const budget=[
    ['Administração e serviços auxiliares',206434.64],
    ['Fundações e estruturas',201255.43],
    ['Revestimentos',101053.99],
    ['Pisos',64972.99],['Paredes',63165.18],
    ['Esquadrias',50228.76],['Canteiro de obras',47791.10],['Cobertura',33832.54],
    ['Pintura',22924.16],['Demais grupos',107817.67]
  ];
  const milestones=[
    {day:30,part:194028.09,cum:194028.09,pct:21.57},
    {day:60,part:211359.65,cum:405387.74,pct:45.07},
    {day:90,part:298116.78,cum:703504.52,pct:78.21},
    {day:120,part:195971.91,cum:899476.46,pct:100}
  ];
  const pdfs=[
    {name:'Orçamento sintético (14 páginas)',path:'documentos/ORCAMENTO-SINTETICO-CANIL.pdf'},
    {name:'Cronograma físico-financeiro (1 página)',path:'documentos/CRONOGRAMA-FISICO-FINANCEIRO-CANIL.pdf'}
  ];
  async function addDocumentLinks(root){
    const holder=document.createElement('div');holder.className='pd-docs';
    const title=document.createElement('h3');title.textContent='Documentos originais';root.append(title,holder);
    for(const d of pdfs){
      const a=document.createElement('a');a.className='pd-document';a.textContent=d.name;a.href=new URL('./'+d.path,location.href).href;a.target='_blank';a.rel='noopener';
      const state=document.createElement('small');state.textContent='Verificando PDF...';a.append(state);holder.append(a);
      try{
        const resp=await fetch(a.href,{method:'HEAD',signal:AbortSignal.timeout(5000)});
        if(!resp.ok)throw new Error('não encontrado');
        state.textContent='Abrir PDF';
      }catch(e){a.removeAttribute('href');a.removeAttribute('target');a.classList.add('unavailable');state.textContent='Arquivo original ainda não publicado no repositório';}
    }
  }
  function showCost(){
    shell('Custo e Prazo','Orçamento sintético e cronograma físico-financeiro da obra · valores planejados, não medição executada.');
    section('<div class="pd-total"><span>VALOR GLOBAL PREVISTO DA OBRA</span><strong>'+money(899476.46)+'</strong><small>SINAPI 09/2026 · SEDOP 03/2026 · Pará · não desonerado</small></div>');
    section('<div class="pd-metrics">'+
      metric(money(691952.93),'Custo sem BDI')+
      metric(money(207523.53),'Parcela de BDI','Taxa aplicada: 30%')+
      metric('120 dias','Prazo total','4 períodos de 30 dias')+
      metric('19','Grupos orçamentários','Orçamento sintético')+'</div>');
    section('<h3>Distribuição do orçamento</h3><div class="pd-budget-list">'+budget.map(([name,val])=>'<div class="pd-budget-item"><div class="pd-budget-top"><span>'+name+'</span><strong>'+money(val)+'</strong></div><div class="pd-progress"><span style="width:'+((val/899476.46)*100).toFixed(2)+'%"></span></div></div>').join('')+'</div><p class="pd-small">Grupos agrupados para visualização. Para composições e preços unitários, consultar o orçamento sintético integral.</p>');
    section('<h3>Cronograma físico-financeiro · 120 dias</h3><p class="pd-small">Distribuição por períodos, conforme documento original. Percentuais representam o previsto acumulado, não avanço medido.</p>'+
      '<div class="pd-schedule">'+milestones.map((m,i)=>'<article class="pd-schedule-item"><div class="pd-period"><strong>'+m.day+' dias</strong><span>'+money(m.part)+' no período</span></div><div class="pd-progress pd-schedule-bar"><span style="width:'+m.pct+'%"></span></div><div class="pd-schedule-foot"><strong>'+num(m.pct,2)+'% acumulado</strong><span>'+money(m.cum)+'</span></div></article>').join('')+'</div>');
    const doc=section('<p class="pd-small">Arquivos de referência recebidos: ORÇAMENTO SINTÉTICO CANIL - FINAL(1).pdf e CRONOGRAMA FISICO-FINANCEIRO - CANIL(1).pdf.</p>');
    addDocumentLinks(doc);
  }
  return {show,hide};
}
