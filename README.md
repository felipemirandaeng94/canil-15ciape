# Canil da 15ª CIA PE — Coordenação BIM

Visualizador estático publicado no GitHub Pages. O `index.html` usa Three.js r160 e web-ifc 0.0.78 por CDN. A leitura geométrica ocorre em um Web Worker.

## Atualizar os modelos

Envie os arquivos para a raiz deste repositório, na branch `main`, com a capitalização exata:

| Disciplina | Arquivo |
| --- | --- |
| Arquitetura | `CANIL.ifc` |
| Estrutural | `ESTRUTURAL.ifc` |
| Hidráulico | `HIDRAULICO.ifc` |
| Esgoto | `ESGOTO.IFC` |

O site busca os quatro arquivos automaticamente. Arquivos ainda não publicados não impedem o carregamento dos demais. Aguarde a conclusão da publicação do GitHub Pages após cada alteração e recarregue o site.

Exporte todos os modelos com a mesma origem, orientação e sistema de coordenadas. O visualizador conserva as posições relativas e aplica um deslocamento comum apenas para precisão e enquadramento. Não alinha modelos independentes por seus centros. A compatibilização disponível é visual; não há detecção automática de interferências.

Cada disciplina tem visibilidade, isolamento, opacidade e categorias independentes. A navegação em primeira pessoa usa W/A/S/D ou setas, mouse arrastado para olhar, Q/E para altura e Esc para órbita. O botão de velocidade alterna 1×, 2× e 4×; Shift aplica aceleração temporária. A navegação é livre, sem colisões.

## Publicar plantas PDF

As plantas ficam na pasta `plantas/` da branch `main`. É possível enviar PDFs diretamente pelo GitHub ou pelo botão **Gerenciar PDFs** do site.

No site, abra o painel com a senha combinada e forneça um **fine-grained personal access token** do GitHub, limitado a este repositório e com permissão **Contents: Read and write**. Selecione PDFs de até 20 MB cada. A atualização de um arquivo existente exige marcar explicitamente a opção de substituição. Os envios são sequenciais; caso um deles falhe, os anteriores que foram confirmados continuam no repositório.

O token é usado somente em chamadas HTTPS à API do GitHub. Não é salvo no código, em cookies ou no armazenamento do navegador; o campo é limpo ao iniciar o envio. A senha do painel é uma conveniência da interface estática, não uma barreira de segurança. A autorização real de escrita é do GitHub. Nunca publique tokens neste repositório. Os PDFs são públicos, assim como os IFCs.

Os visitantes podem visualizar e baixar as plantas. A listagem usa a API pública do GitHub, sujeita aos limites de requisições. **Atualizar plantas** repete a consulta caso necessário. O envio real depende de um token válido com acesso de escrita e das regras de proteção da branch.

## Aparência

Terreno identificado como grama é verde. Coberturas identificadas pelo tipo/predefinição/nome usam cinza escuro com hachuras. Gradis, cercamentos e famílias identificadas como portões recebem acabamento preto. As demais cores partem dos materiais IFC.

## Verificação desta versão

- Arquitetura real: 106 elementos carregados.
- Federação: quatro IFCs sintéticos com coordenadas grandes e deslocamentos de 5 m mantiveram suas posições distintas no navegador.
- Envio PDF: criação, proteção contra sobrescrita, atualização com SHA, base64, erros de autorização, tamanho e assinatura PDF verificados com respostas simuladas; sem gravar arquivos de teste no GitHub.
- Os modelos reais de estrutura, hidráulica e esgoto ainda precisam ser publicados para validar seu alinhamento real. O primeiro envio pelo painel requer o token do administrador.
