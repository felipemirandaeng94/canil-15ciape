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
  // Fonte: ORÇAMENTO SINTÉTICO CANIL - FINAL(2).pdf, 13/11/2026.
  // PDF e planilha conferidos: 19 grupos; R$ 707.955,41 com BDI.
  const budgetTotal=707955.41, budgetWithoutBdi=544629.71, budgetBdi=163325.70;
  const budget=[
    ['Fundações e estruturas',171823.06],
    ['Revestimentos e tratamentos superficiais',101053.99],
    ['Pisos, soleiras e rodapés',64972.99],
    ['Paredes e painéis',63165.18],
    ['Esquadrias, ferragens e vidros',50228.76],
    ['Canteiro de obras',47791.10],
    ['Serviços auxiliares e administrativos',44345.96],
    ['Cobertura',33832.54],
    ['Pinturas',22924.16],
    ['Instalações hidrossanitárias',19657.42],
    ['Urbanização',19205.61],
    ['Instalações elétricas',18209.82],
    ['Impermeabilização e proteções',15470.61],
    ['Serviços preliminares',9200.94],
    ['Movimento de terra',8778.87],
    ['Serviços técnicos (locação)',7104.18],
    ['Serviços diversos',6565.94],
    ['Instalações especiais',3060.68],
    ['Serviços técnico-profissionais',563.60]
  ];
  // Fonte: CRONOGRAMA FISICO-FINANCEIRO - CANIL(2).pdf (1 página).
  // Percentuais são planejados, não medição física da obra.
  const milestones=[
    {day:30,part:141732.98,cum:141732.98,pct:20.02},
    {day:60,part:160536.15,cum:302269.13,pct:42.70},
    {day:90,part:250236.52,cum:552505.65,pct:78.04},
    {day:120,part:155449.74,cum:707955.41,pct:100.00}
  ];
  const pdfs=[
    {name:'Orçamento sintético atualizado (14 páginas)',path:'documentos/ORCAMENTO-SINTETICO-CANIL.pdf'},
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
    shell('Custo e Prazo','Orçamento sintético atualizado · SINAPI 09/2026, SEDOP 03/2026, Pará · valores previstos.');
    section('<div class="pd-total"><span>VALOR GLOBAL DO ORÇAMENTO · COM BDI</span><strong>'+money(budgetTotal)+'</strong><small>Fonte: Orçamento Sintético Canil – Final (PDF e Excel). Regime não desonerado · BDI de 30%.</small></div>');
    section('<div class="pd-metrics">'+
      metric(money(budgetWithoutBdi),'Custo sem BDI')+
      metric(money(budgetBdi),'BDI total','Taxa: 30%')+
      metric('120 dias','Prazo planejado','4 etapas de 30 dias')+
      metric('19','Grupos de serviços','Conforme orçamento atualizado')+'</div>');
    const sum=budget.reduce((total,item)=>total+item[1],0);
    if(Math.abs(sum-budgetTotal)>0.02)console.warn('Grupos orçamentários não conferem com total informado',sum,budgetTotal);
    section('<h3>Composição do orçamento por grupos</h3><div class="pd-budget-list">'+budget.map(([name,val])=>'<div class="pd-budget-item"><div class="pd-budget-top"><span>'+name+'</span><strong>'+money(val)+'</strong></div><div class="pd-progress"><span style="width:'+((val/budgetTotal)*100).toFixed(2)+'%"></span></div></div>').join('')+'</div><p class="pd-small">Os 19 grupos correspondem ao orçamento sintético atualizado. Valores incluem BDI.</p>');
    section('<h3>Cronograma físico-financeiro · 120 dias</h3>'+
      '<p class="pd-small">Parcelas financeiras e avanço planejado conforme cronograma revisado, não execução efetivamente medida.</p>'+
      '<div class="pd-schedule">'+milestones.map(m=>'<article class="pd-schedule-item">'+
        '<div class="pd-period"><strong>'+m.day+' dias</strong><span>'+money(m.part)+' no período</span></div>'+
        '<div class="pd-progress pd-schedule-bar"><span style="width:'+m.pct+'%"></span></div>'+
        '<div class="pd-schedule-foot"><strong>'+num(m.pct,2)+'% acumulado</strong><span>'+money(m.cum)+' acumulados</span></div>'+
        '</article>').join('')+'</div>'+
      '<p class="pd-small" style="margin-top:12px">Conforme a planilha de origem, os valores individuais foram arredondados para centavos. A soma dos quatro custos de período difere em R$ 0,02 do total publicado; prevalece o total geral do orçamento e o valor acumulado final indicados no documento.</p>');

  }
  return {show,hide};
}
