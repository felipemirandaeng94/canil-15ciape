# Redesign da interface BIM

## Inspeção e preservação

O projeto é um site estático, sem framework ou compilação. Antes desta alteração, interface, cena Three.js r160, controles de navegação e administração de PDFs estavam em `index.html`. O leitor web-ifc 0.0.78 roda em um Web Worker e transfere geometria para a cena. Os brasões ficam em `assets/`, os IFCs na raiz e as pranchas em `plantas/{arquitetonico,estrutural,eletrico,hidrossanitario}/`.

GitHub Pages publica a raiz de `main`. Esta implementação está na branch `redesign/interface-bim`; não altera a configuração de publicação. Nenhum IFC, PDF ou brasão foi modificado.

## Componentes

- `assets/interface.css`: identidade visual, menu, painéis, barra de ferramentas, vistas e comportamento responsivo.
- `assets/interface.js`: organização dos controles existentes, abas acessíveis, menu recolhível, contagens por classe, isolamento de elementos, propriedades e orientação dos eixos da câmera.
- `index.html`: integração dos componentes, leitura de GlobalId/ObjectType e conjuntos IFC ligados por IfcRelDefinesByProperties, redimensionamento pelo ResizeObserver e modelo elétrico opcional `ELETRICO.ifc`.

O motor, materiais, coordenadas, carregamento automático, controles de órbita, caminhada, velocidade, qualidade, grade, linhas, ocultação H H e restauração foram preservados. O administrador continua usando o mesmo envio autenticado com token efêmero para a pasta da disciplina na branch main. Não houve envio administrativo de teste.

## Recursos e limites

- Disciplinas: arquitetura, estrutura, elétrica e grupo hidrossanitário (hidráulica e esgoto com controles independentes). Arquivos ausentes permanecem indisponíveis.
- PDFs: visualizador existente e links relativos para abrir em nova aba ou baixar; 3 arquitetônicos e 13 estruturais.
- Propriedades: identificação, nome, tipo, classe, disciplina, GlobalId, pavimento e Psets/quantitativos associados diretamente à ocorrência. Nomes das propriedades preservam a nomenclatura original IFC. Unidades não são inferidas. Propriedades herdadas exclusivamente do tipo não são expandidas nesta versão.
- Quantitativos: contagens reais dos produtos com geometria; não calcula orçamento, área ou volume automaticamente. O resumo inclui produtos carregados que estejam ocultos, enquanto os cartões conservam a contagem tratada pelas regras existentes do canil.
- Compatibilização: sobreposição visual usando os controles de disciplina; não realiza detecção automática de colisões.
- Documentos: acesso às pranchas existentes, sem criar um segundo armazenamento.
- Vistas: orientações do sistema de coordenadas do visualizador, sem inventar norte geográfico. Não são usadas miniaturas ilustrativas.
- Medição, seção e explosão não foram adicionadas; exigem implementação e validação próprias.

## Verificações

- Sintaxe de todos os scripts e Worker, e `git diff --check`.
- Modelos locais de arquitetura e estrutura carregados na interface, com ausência dos modelos opcionais tratada sem bloquear o uso.
- Seleção de cobertura mostrou GlobalId, Pset_SlabCommon e Qto_SlabBaseQuantities reais.
- Isolamento de elemento e restauração, ocultação da arquitetura deixando a estrutura visível, controle de opacidade e troca de vistas exercitados no navegador.
- Listagem das 16 pranchas e ações de arquivo conferidas. O fetch do PDF passou na verificação de assinatura e abriu o diálogo; o navegador integrado não renderizou o PDF no iframe, portanto a renderização nativa do documento não foi validada nele.
- Layout desktop, notebook e mobile a 390 px, sem overflow horizontal do documento; menus e painel responsivos verificados.
- Os testes não alteram a publicação atual.
