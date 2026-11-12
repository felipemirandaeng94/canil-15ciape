# Canil da 15ª Cia PE — Coordenação BIM

Repositório dos projetos do **Canil da 15ª Companhia de Polícia do Exército**, em Belém–PA. Reúne modelos BIM em formato IFC e pranchas de projeto em PDF, com consulta pelo site do projeto.

**[Acessar o projeto e o visualizador 3D](https://felipemirandaeng94.github.io/canil-15ciape/)**

## Modelos BIM disponíveis

| Disciplina | Arquivo IFC |
| --- | --- |
| Arquitetura | [`CANIL.ifc`](CANIL.ifc) |
| Estrutura | [`ESTRUTURAL.ifc`](ESTRUTURAL.ifc) |
| Instalações elétricas | [`ELETRICO.ifc`](ELETRICO.ifc) |
| Instalações hidrossanitárias | [`HIDRAULICA.ifc`](HIDRAULICA.ifc) |

Os quatro arquivos estão na raiz da branch `main`. O site permite consultar os modelos por disciplina e acessar as pranchas publicadas.

## Pranchas em PDF

As pranchas estão organizadas na pasta [`plantas/`](plantas/) e são listadas no site por meio do arquivo [`plantas/manifest.json`](plantas/manifest.json).

## Atualização do projeto

- **Modelos IFC:** substituir o arquivo correspondente na raiz da branch `main`, mantendo seu nome.
- **Pranchas PDF:** adicionar ou atualizar o PDF na pasta `plantas/` e manter o `plantas/manifest.json` atualizado.
- **Publicação:** o site utiliza GitHub Pages e pode levar algum tempo para refletir novas alterações.

Os modelos devem utilizar a mesma origem e orientação para preservar a compatibilização espacial no visualizador.
