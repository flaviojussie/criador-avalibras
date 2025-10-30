# Criador AvaLIBRAS v2.0.0

**O Editor de Videoprovas Acessíveis em Língua Brasileira de Sinais (LIBRAS)**

[![Status do Projeto](https://img.shields.io/badge/status-funcional-success)](./docs/PROJECT_STATUS.md)
[![Versão](https://img.shields.io/badge/version-2.0.0-blue)](package.json)
[![Plataformas](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-lightgrey)](./docs/INSTALLATION_GUIDE.md)

O Criador AvaLIBRAS é uma aplicação de desktop gratuita e de código aberto, projetada para ser a ferramenta definitiva na criação de video-provas em LIBRAS. Ele simplifica o processo ao integrar um editor de vídeo com funcionalidades específicas para o contexto educacional, permitindo que professores, sem necessidade de conhecimento técnico avançado, criem, editem e distribuam avaliações acessíveis de forma rápida e eficiente.

Este projeto é parte central da dissertação de Mestrado Profissional em Tecnologia Educacional da Universidade Federal do Ceará (UFC).

---

##  STATUS DO SISTEMA AVALIBRAS

O ecossistema AvaLIBRAS é composto por duas aplicações:

1.  ✅ **Criador AvaLIBRAS (Este Repositório):** Software para professores e intérpretes criarem as videoprovas. **Status: Funcional e Implementado.**
2.  ⏳ **Aplicador AvaLIBRAS:** Software para estudantes realizarem as provas. **Status: Planejado para desenvolvimento futuro.**

---

## 🚀 Principais Funcionalidades

- **Gestão de Projetos:** Crie, salve (`.avaprojet`) e carregue projetos de provas.
- **Edição de Vídeo Intuitiva:**
    - **Corte de Trechos:** Remova partes indesejadas do vídeo com uma ferramenta de corte simples.
    - **Overlays de Imagem:** Adicione imagens (gráficos, diagramas) sobre o vídeo em momentos específicos.
- **Sincronização Precisa:** Marque o tempo exato do início de cada alternativa (A, B, C, D, E) diretamente na timeline.
- **Importação e Exportação:**
    - Exporte a prova completa como um arquivo único e portátil (`.ava`), com opção de proteção por senha.
    - Exporte e importe questões individuais (`.avaquest`) para reutilização e colaboração.
- **Organização Flexível:** Adicione, remova, duplique e reordene questões facilmente com uma interface de arrastar e soltar.
- **Integração Nativa:** Suporte a associação de arquivos, permitindo abrir projetos diretamente do explorador de arquivos.

---

## 🛠️ Tecnologias Utilizadas

- **Desktop Framework:** Electron
- **Frontend:** React com Vite e Tailwind CSS
- **Processamento de Vídeo:** FFmpeg (executado em worker threads para não travar a interface)
- **Linguagem:** JavaScript

---

## 📦 Instalação (Para Usuários)

Para instalar e usar o Criador AvaLIBRAS, por favor, siga as instruções detalhadas em nosso **[Guia de Instalação](./docs/INSTALLATION_GUIDE.md)**.

---

## 👨‍💻 Guia para Desenvolvedores

Interessado em contribuir? Ótimo! Siga os passos abaixo para configurar o ambiente de desenvolvimento.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v18.x ou superior)
- [Git](https://git-scm.com/)

### Configuração do Ambiente

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/avalibras-editor.git
    cd avalibras-editor
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Execute em modo de desenvolvimento:**
    Este comando iniciará o servidor de desenvolvimento do React e a aplicação Electron com hot-reload.
    ```bash
    npm run dev:electron
    ```

Para mais detalhes, consulte o **[Guia de Instalação para Desenvolvedores](./docs/INSTALLATION_GUIDE.md#2-para-desenvolvedores-ambiente-de-desenvolvimento)** e o **[Manual Técnico](./docs/MANUAL_TECNICO_AVALIBRAS.md)**.

---

## 📂 Formatos de Arquivo

- **`.avaprojet`**: O arquivo de projeto. Contém todos os metadados, configurações e caminhos para as mídias de sua prova. É com ele que você trabalha.
- **`.ava`**: A prova final, exportada e pronta para ser distribuída. É um pacote autocontido com todos os vídeos e recursos.
- **`.avaquest`**: Uma questão individual, que pode ser exportada e importada entre diferentes projetos.

---

## 🗺️ Roadmap

- [x] Implementação completa do **Criador AvaLIBRAS**.
- [ ] Correção de bugs e melhorias de performance.
- [ ] Implementação da suíte de testes automatizados.
- [ ] Desenvolvimento do **Aplicador AvaLIBRAS**.

---

## 📄 Licença

Este projeto é distribuído como software de código aberto.

---

## 🎓 Autor

**Flávio Jussiê Ribeiro Fernandes**
- **Orientador:** Prof. Dr. Leonardo Oliveira Moreira (UFC)
- **Coorientador:** Prof. Dr. Windson Viana de Carvalho (UFC)

*Programa de Pós-Graduação em Tecnologia Educacional (PPGTE) - Instituto Universidade Virtual - Universidade Federal do Ceará (UFC)*