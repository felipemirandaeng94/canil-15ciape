# Canil da 15ª CIA PE — Coordenação BIM

Visualizador estático publicado no GitHub Pages. O `index.html` usa Three.js r160 e web-ifc 0.0.78 por CDN. A leitura geométrica ocorre em um Web Worker.

## Atualizar os modelos

Envie os arquivos para a raiz deste repositório, na branch `main`, com a capitalização exata:

| Disciplina | Arquivo |
| --- | --- |
| Arquitetura | `CANIL.ifc` |
| Estrutural | `ESTRUTURAL.ifc` |
| **Elétrico** | **`ELETRICO.ifc`** |
| **Hidrossanitário (água fria e esgoto)** | **`HIDRAULICO.ifc`** |

O site busca os **quatro arquivos IFC** automaticamente (inclusive `ELETRICO.ifc`). O modelo `HIDRAULICO.ifc` já inclui as instalações de água fria **e** de esgoto. Não é necessário exportar ou publicar `ESGOTO.IFC` separadamente. Arquivos ainda não publicados não impedem o carregamento dos demais. Aguarde a conclusão da publicação do GitHub Pages após cada alteração e recarregue o site.

Exporte todos os modelos com a mesma origem, orientação e sistema de coordenadas. O visualizador conserva as posições relativas e aplica um deslocamento comum apenas para precisão e enquadramento. Não alinha modelos independentes por seus centros. A compatibilização disponível é visual; não há detecção automática de interferências.

Cada disciplina tem visibilidade, isolamento, opacidade e categorias independentes. A navegação em primeira pessoa usa W/A/S/D ou setas, mouse arrastado para olhar, Q/E para altura e Esc para órbita. O botão de velocidade alterna 1×, 2× e 4×; Shift aplica aceleração temporária. A navegação é livre, sem colisões.

## Publicar o projeto elétrico IFC

1. Exporte o projeto elétrico em formato **IFC com elementos geométricos 3D**, preferencialmente utilizando a mesma versão de referência e o mesmo ponto de origem adotados na Arquitetura (`CANIL.ifc`) e na Estrutura (`ESTRUTURAL.ifc`). Não utilize recentralização ou rotação independente somente para a exportação elétrica.
2. No GitHub, abra a **raiz** do repositório, selecione a branch `main` e envie o arquivo com o nome **exato `ELETRICO.ifc`** (maiúsculas/minúsculas importam no GitHub Pages). Não coloque o arquivo em `assets/` nem em `plantas/`.
3. Aguarde a publicação do GitHub Pages. Reabra o site (ou faça `Ctrl + F5`). O visualizador tenta carregar `CANIL.ifc`, `ESTRUTURAL.ifc`, `ELETRICO.ifc` e `HIDRAULICO.ifc` em sequência.
4. Na aba **Disciplinas**, confirme que o cartão **Elétrico** apresenta `ELETRICO.ifc · N elementos` (com N maior que zero). Teste mostrar/ocultar, **Isolar**, opacidade, categorias IFC e alinhamento com Arquitetura e Estrutura.
5. Em caso de falha, confira o nome e o caminho do arquivo, a conclusão do deploy e se a exportação IFC realmente contém sólidos 3D. Um arquivo IFC apenas com informações textuais ou representações não suportadas pode abrir sem ter elementos renderizáveis. As outras disciplinas devem continuar disponíveis.

O leitor percorre os produtos IFC que possuem representação geométrica; classes como `IFCLIGHTFIXTURE`, `IFCOUTLET`, `IFCSWITCHINGDEVICE`, `IFCELECTRICDISTRIBUTIONBOARD` e `IFCCABLECARRIERSEGMENT` já são reconhecidas para organização por categoria. A exibição efetiva depende de a exportação incluir geometria interpretável pelo web-ifc.

**Nota de validação:** o código reconhece e busca `ELETRICO.ifc`, mas a compatibilidade de um IFC específico somente pode ser confirmada após seu envio. Não se deve considerar validada a geometria elétrica enquanto o arquivo real não estiver publicado.

## Modelo hidrossanitário unificado

O projeto utiliza **um único arquivo IFC hidrossanitário**, `HIDRAULICO.ifc`, contendo tanto os componentes de **água fria** quanto os de **esgoto sanitário**. No visualizador 3D, os dois sistemas são apresentados em uma única disciplina: **Hidrossanitário (água fria + esgoto)**. O site não tenta carregar `ESGOTO.IFC` nem apresenta uma camada de esgoto independente.

As pranchas permanecem organizadas na categoria **Hidrossanitário** do catálogo PDF (`plantas/manifest.json`), sem alteração dos arquivos ou da listagem. Se os sistemas precisarem ser diferenciados visualmente, utilize as categorias ou propriedades IFC exportadas dentro do modelo unificado, conforme estiverem disponíveis.

## Publicar plantas PDF

As plantas ficam na pasta `plantas/` da branch `main`. É possível enviar PDFs diretamente pelo GitHub ou pelo botão **Gerenciar PDFs** do site.

No site, abra o painel com a senha combinada e forneça um **fine-grained personal access token** do GitHub, limitado a este repositório e com permissão **Contents: Read and write**. Selecione PDFs de até 20 MB cada. A atualização de um arquivo existente exige marcar explicitamente a opção de substituição. Os envios são sequenciais; caso um deles falhe, os anteriores que foram confirmados continuam no repositório.

O token é usado somente em chamadas HTTPS à API do GitHub. Não é salvo no código, em cookies ou no armazenamento do navegador; o campo é limpo ao iniciar o envio. A senha do painel é uma conveniência da interface estática, não uma barreira de segurança. A autorização real de escrita é do GitHub. Nunca publique tokens neste repositório. Os PDFs são públicos, assim como os IFCs.

Os visitantes podem visualizar e baixar as plantas. A listagem usa o catálogo estático `plantas/manifest.json` servido pelo GitHub Pages (sem consumir o limite público da API GitHub). O gerenciador de PDFs atualiza o catálogo após os envios autenticados; se o PDF for adicionado diretamente pelo GitHub, atualize também o catálogo. **Atualizar plantas** recarrega o catálogo publicado. O envio real depende de um token válido com acesso de escrita e das regras de proteção da branch.

## Aparência

Terreno identificado como grama é verde. Coberturas identificadas pelo tipo/predefinição/nome usam cinza escuro com hachuras. Gradis, cercamentos e famílias identificadas como portões recebem acabamento preto. As demais cores partem dos materiais IFC.

## Verificação desta versão

- O projeto usa modelos de arquitetura e estrutura presentes na raiz; os números de elementos exibidos dependem dos arquivos publicados.
- A integração geométrica entre disciplinas depende dos arquivos IFC exportados com a mesma origem e orientação.
- Envio PDF: criação, proteção contra sobrescrita, atualização com SHA, base64, erros de autorização, tamanho e assinatura PDF verificados com respostas simuladas; sem gravar arquivos de teste no GitHub.
- A estrutura já está publicada; a compatibilidade de cada modelo deve ser validada com os arquivos IFC efetivamente publicados. A disciplina hidrossanitária utiliza um único arquivo, `HIDRAULICO.ifc`, que contém água fria e esgoto. O primeiro envio de PDF pelo painel requer uma credencial de escrita autorizada no GitHub.
