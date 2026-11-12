# Canil da 15ª CIA PE — Coordenação BIM

Visualizador estático publicado no GitHub Pages. O `index.html` usa Three.js r160 e web-ifc 0.0.78 por CDN. A leitura geométrica ocorre em um Web Worker.

## Atualizar os modelos

Envie os arquivos para a raiz deste repositório, na branch `main`, com a capitalização exata:

| Disciplina | Arquivo |
| --- | --- |
| Arquitetura | `CANIL.ifc` |
| Estrutural | `ESTRUTURAL.ifc` |
| **Elétrico** | **`ELETRICO.ifc`** |
| **Hidrossanitário (água fria e esgoto)** | **`HIDRAULICA.ifc`** |

Os **quatro arquivos IFC estão publicados na raiz da branch `main`**, incluindo `ELETRICO.ifc`. O visualizador está configurado para buscar os quatro modelos automaticamente. A presença do arquivo no repositório não garante, por si só, que todas as geometrias sejam renderizadas. O arquivo `HIDRAULICA.ifc` é a referência hidrossanitária do site; a apresentação de água fria, esgoto e pluvial depende dos sistemas e representações exportados no IFC. Aguarde a conclusão da publicação do GitHub Pages após cada alteração e recarregue o site.

Exporte todos os modelos com a mesma origem, orientação e sistema de coordenadas. O visualizador conserva as posições relativas e aplica um deslocamento comum apenas para precisão e enquadramento. Não alinha modelos independentes por seus centros. A compatibilização disponível é visual; não há detecção automática de interferências.

Cada disciplina tem visibilidade, isolamento, opacidade e categorias independentes. A navegação em primeira pessoa usa W/A/S/D ou setas, mouse arrastado para olhar, Q/E para altura e Esc para órbita. O botão de velocidade alterna 1×, 2× e 4×; Shift aplica aceleração temporária. A navegação é livre, sem colisões.

## Projeto elétrico IFC — arquivo publicado

O arquivo **[`ELETRICO.ifc`](ELETRICO.ifc)** já está disponível na raiz da branch `main`, e o `index.html` já o referencia na disciplina **Elétrico**. Não é necessário reenviar o modelo para que o visualizador tente carregá-lo.

Para conferir a exibição:

1. Acesse o [visualizador publicado](https://felipemirandaeng94.github.io/canil-15ciape/) e atualize com `Ctrl + F5`, se necessário.
2. Na seção **Disciplinas**, localize **Elétrico** e confira se há elementos renderizados.
3. Teste visibilidade, isolamento, opacidade e alinhamento com os demais modelos.
4. Se o modelo não aparecer, confirme se o GitHub Pages disponibiliza o arquivo e se a exportação IFC contém representações geométricas 3D interpretáveis pelo web-ifc.

O código contém categorias para luminárias (`IFCLIGHTFIXTURE`), tomadas (`IFCOUTLET`), interruptores (`IFCSWITCHINGDEVICE`), quadros (`IFCELECTRICDISTRIBUTIONBOARD`) e eletrocalhas (`IFCCABLECARRIERSEGMENT`). A presença dessas categorias no código não comprova que todos os objetos do IFC real sejam renderizáveis.

**Situação verificada em 12/11/2026:** arquivo `ELETRICO.ifc` presente na branch `main` (aproximadamente 4,4 MB); referência correspondente presente em `index.html`. **A renderização geométrica no navegador ainda não foi validada nesta verificação.**

## Modelo hidrossanitário unificado

O site utiliza o arquivo **`HIDRAULICA.ifc`** como modelo hidrossanitário e o identifica como **Hidrossanitário (água fria + esgoto + pluvial)**. As redes efetivamente visíveis dependem das entidades e geometrias exportadas nesse arquivo; a simples existência do IFC não comprova que os três sistemas estão representados. O site não busca um arquivo `ESGOTO.IFC` independente.

As pranchas permanecem organizadas na categoria **Hidrossanitário** do catálogo PDF (`plantas/manifest.json`), sem alteração dos arquivos ou da listagem. Se os sistemas precisarem ser diferenciados visualmente, utilize as categorias ou propriedades IFC exportadas dentro do modelo unificado, conforme estiverem disponíveis.

## Interface do visualizador e download IFC

Na aba **Disciplinas**, cada modelo carregado oferece **Visualizar no 3D** e **Baixar IFC**, além de visibilidade, isolamento e opacidade. O download aponta diretamente para o IFC publicado na raiz da branch `main`; o link aparece após o carregamento bem-sucedido do arquivo. Os documentos originais não são modificados.

Na seção **Plantas PDF → Hidrossanitário**, as pranchas são separadas em **Água fria e abastecimento** e **Esgoto sanitário e águas pluviais**. A numeração repetida de pranchas corresponde a sistemas diferentes e não deve motivar exclusão. O botão da prancha abre o visualizador integrado e os controles permitem abrir em outra aba ou baixar PDF.

As pranchas novas de esgoto/pluvial precisam ser efetivamente enviadas à pasta `plantas/hidrossanitario/` e acrescentadas ao `plantas/manifest.json` antes de aparecerem no site. Não cadastrar arquivos no manifesto antes de sua publicação.

## Publicar plantas PDF

As plantas ficam na pasta `plantas/` da branch `main`. É possível enviar PDFs diretamente pelo GitHub ou pelo botão **Gerenciar PDFs** do site.

No site, abra o painel com a senha combinada e forneça um **fine-grained personal access token** do GitHub, limitado a este repositório e com permissão **Contents: Read and write**. Selecione PDFs de até 20 MB cada. A atualização de um arquivo existente exige marcar explicitamente a opção de substituição. Os envios são sequenciais; caso um deles falhe, os anteriores que foram confirmados continuam no repositório.

O token é usado somente em chamadas HTTPS à API do GitHub. Não é salvo no código, em cookies ou no armazenamento do navegador; o campo é limpo ao iniciar o envio. A senha do painel é uma conveniência da interface estática, não uma barreira de segurança. A autorização real de escrita é do GitHub. Nunca publique tokens neste repositório. Os PDFs são públicos, assim como os IFCs.

Os visitantes podem visualizar e baixar as plantas. A listagem usa o catálogo estático `plantas/manifest.json` servido pelo GitHub Pages (sem consumir o limite público da API GitHub). O gerenciador de PDFs atualiza o catálogo após os envios autenticados; se o PDF for adicionado diretamente pelo GitHub, atualize também o catálogo. **Atualizar plantas** recarrega o catálogo publicado. O envio real depende de um token válido com acesso de escrita e das regras de proteção da branch.

## Aparência

Terreno identificado como grama é verde. Coberturas identificadas pelo tipo/predefinição/nome usam cinza escuro com hachuras. Gradis, cercamentos e famílias identificadas como portões recebem acabamento preto. As demais cores partem dos materiais IFC.

## Verificação desta versão

- Os quatro arquivos `CANIL.ifc`, `ESTRUTURAL.ifc`, `ELETRICO.ifc` e `HIDRAULICA.ifc` foram encontrados na raiz da branch `main` em 12/11/2026. Os números de elementos exibidos dependem da leitura geométrica efetiva.
- A integração geométrica entre disciplinas depende dos arquivos IFC exportados com a mesma origem e orientação.
- Envio PDF: criação, proteção contra sobrescrita, atualização com SHA, base64, erros de autorização, tamanho e assinatura PDF verificados com respostas simuladas; sem gravar arquivos de teste no GitHub.
- O elétrico já está publicado; sua renderização precisa ser conferida no visualizador. A disciplina hidrossanitária aponta para `HIDRAULICA.ifc`; a existência de água fria, esgoto e pluvial renderizáveis deve ser verificada no conteúdo exportado. O primeiro envio de PDF pelo painel requer uma credencial de escrita autorizada no GitHub.
