## **Documento de Requisitos de Produto (PRD) Robusto: Criador AvaLIBRAS v2.0**

**Autor:** Flávio Jussiê
**Versão:** 1.1
**Data:** 20 de Setembro de 2025
**Última Atualização:** Dezembro de 2024

#### **1. Introdução e Visão Estratégica**

* **1.1 Problema:** Educadores e criadores de conteúdo enfrentam uma barreira técnica e de tempo significativa para produzir avaliações digitais acessíveis para a comunidade surda. Ferramentas de edição de vídeo convencionais são complexas, caras e não são projetadas para o fluxo de trabalho específico da criação de provas em Língua Brasileira de Sinais (LIBRAS), que envolve a sincronização precisa de alternativas com o vídeo. Isso resulta em uma escassez de materiais avaliativos de alta qualidade, aprofundando a desigualdade educacional.

* **1.2 Proposta de Solução / Visão do Produto:** O Criador AvaLIBRAS é uma aplicação de desktop gratuita e de código aberto, projetada para ser a ferramenta definitiva na criação de video-provas em LIBRAS. Ele simplifica o processo ao integrar um editor de vídeo com funcionalidades específicas para o contexto educacional, permitindo que professores, sem necessidade de conhecimento técnico avançado, criem, editem e distribuam avaliações acessíveis de forma rápida e eficiente.

* **1.3 Audiência Alvo:**
    * **Primária:** Professores de escolas inclusivas, intérpretes de LIBRAS e designers instrucionais que trabalham diretamente com a comunidade surda.
    * **Secundária:** Instituições de ensino (escolas, universidades) que buscam padronizar a criação de conteúdo acessível.

#### **2. Objetivos e Métricas de Sucesso**

* **2.1 Objetivos de Negócio:**
    * Tornar-se a ferramenta padrão para a criação de video-provas em LIBRAS no Brasil.
    * Promover a inclusão e a equidade no acesso à educação para estudantes surdos.
    * Construir uma comunidade ativa em torno da ferramenta para fomentar a colaboração e o aprimoramento contínuo.

* **2.2 Objetivos do Usuário:**
    * Criar uma prova completa em vídeo em menos de 60 minutos, assumindo que os vídeos já estão gravados.
    * Adicionar questões dinamicamente conforme necessário, com flexibilidade para ajustar o número durante o processo de criação (limite máximo de 90 questões).
    * Editar e refinar vídeos (cortar erros, adicionar imagens de apoio) de forma intuitiva, sem a necessidade de consultar tutoriais extensos.
    * Gerenciar múltiplos projetos de provas de forma organizada, podendo salvar o progresso e retomar a edição a qualquer momento.

* **2.3 Métricas de Sucesso (KPIs):**
    *   **Engajamento:** Número de projetos (`.avaprojet`) criados e salvos por mês.
    * **Adoção:** Número de provas finais (`.ava`) exportadas por mês.
    * **Qualidade/Usabilidade:** Taxa de conclusão do fluxo de criação de uma questão (do upload do vídeo ao salvamento).
    * **Feedback Qualitativo:** Avaliações e depoimentos de educadores da comunidade surda.

#### **3. Requisitos Detalhados: Épicos e Histórias de Usuário**

**Épico 1: Gerenciamento de Ciclo de Vida do Projeto**

* **História de Usuário 1.1 (Criar):** *Como um professor, quero criar um novo projeto de prova de múltipla escolha de forma simples e direta, definindo apenas o nome e o número de alternativas, para poder começar rapidamente e adicionar questões conforme necessário durante o processo de criação.*
    * **Requisitos Funcionais:**
        * Deve haver um item de menu "Arquivo > Novo Projeto" (`Ctrl+N`).
        * Um modal simples deve ser exibido, com título "Criar Novo Projeto", contendo campos para: Nome do Projeto (texto obrigatório) e Número de Alternativas (select: 4 ou 5 alternativas, padrão 5).
        * O tipo de prova é sempre "Múltipla Escolha" (não necessita seleção).
        * As questões devem ser criadas dinamicamente pelo usuário clicando no botão "+" (adicionar questão), permitindo até 90 questões por projeto.
        * Uma nota informativa deve indicar claramente: "💡 Questões serão adicionadas dinamicamente usando o botão '+' (máximo 90 questões)".
        * Ao confirmar, a interface principal deve refletir os metadados do projeto no cabeçalho com um contador dinâmico de questões.

* **História de Usuário 1.2 (Salvar/Abrir):** *Como um educador, quero salvar meu projeto em andamento e reabri-lo depois, para poder trabalhar em provas complexas em várias sessões.*
    * **Requisitos Funcionais:**
        *   O menu "Arquivo > Salvar Projeto" (`Ctrl+S`) deve acionar um diálogo para salvar um arquivo `.avaprojet`.
        *   O arquivo `.avaprojet` deve ser um JSON contendo o estado completo da aplicação, incluindo referências aos caminhos de mídia locais.
        *   O menu "Arquivo > Abrir Projeto" (`Ctrl+O`) deve permitir a seleção de um arquivo `.avaprojet` e restaurar a sessão de edição.
        * Um submenu "Projetos Recentes" deve ser exibido no menu "Arquivo", listando os últimos projetos abertos (sem a extensão) para acesso rápido.

* **História de Usuário 1.3 (Exportar):** *Como criador de conteúdo, quero exportar minha prova finalizada como um único arquivo autocontido, para que eu possa distribuí-la facilmente em qualquer plataforma.*
    * **Requisitos Funcionais:**
        *   O menu "Arquivo > Exportar Prova" (`Ctrl+E`) deve acionar um diálogo para salvar um arquivo `.ava`.
        *   O arquivo `.ava` deve ser um pacote ZIP contendo todos os vídeos, imagens e o `videos.js` com os metadados.
        *   O processo de exportação deve exibir um feedback visual de progresso, pois pode ser demorado, e permitir configurações de compressão.

**Épico 2: Criação e Edição Dinâmica de Questões**

* **História de Usuário 2.0 (Gerenciamento Dinâmico de Questões):** *Como um professor, quero adicionar questões conforme desenvolvo minha prova, clicando no botão "+" quando necessário, para ter flexibilidade total no processo de criação sem limitações predefinidas.*
    * **Requisitos Funcionais:**
        * Interface deve iniciar com projeto vazio, sem questões pré-criadas.
        * Botão "+" (adicionar questão) deve estar sempre visível e permitir adicionar questões dinamicamente.
        * Limite máximo de 90 questões por projeto, com validação e feedback visual.
        * Contador de questões deve atualizar automaticamente conforme questões são adicionadas ou removidas.
        * Deve ser possível remover questões individualmente sem afetar as demais.

* **História de Usuário 2.1 (Edição de Vídeo):** *Como um professor, quero poder fazer edições simples no meu vídeo, como remover trechos com erros de gravação, diretamente na ferramenta, para não precisar usar um software de edição de vídeo separado.*
    * **Requisitos Funcionais:**
        * A interface deve ter uma ferramenta de "Corte" (`cutButton`).
        * O usuário deve poder selecionar um trecho na linha do tempo arrastando o mouse.
        * A remoção do trecho deve ser processada em segundo plano usando FFmpeg, e o vídeo no player deve ser atualizado com a versão editada.

* **História de Usuário 2.2 (Sincronização):** *Como um intérprete de LIBRAS, quero marcar visualmente o início exato de cada alternativa na linha do tempo do vídeo, para garantir uma sincronização perfeita entre a prova e a sinalização.*
    * **Requisitos Funcionais:**
        * Botões (`A`, `B`, `C`, `D`, `E`) devem estar disponíveis próximos à linha do tempo.
        * Ao clicar em um botão, um marcador visual persistente deve ser adicionado na posição atual do "playhead" na timeline.
        * Os tempos exatos dos marcadores devem ser salvos nos metadados da questão.

* **História de Usuário 2.3 (Enriquecimento Visual):** *Como designer instrucional, quero sobrepor imagens (gráficos, diagramas) ao vídeo em momentos específicos, para fornecer contexto visual adicional à questão em LIBRAS.*
    * **Requisitos Funcionais:**
        * A ferramenta "Adicionar Imagem" (`overlayButton`) deve abrir um modal (`overlayModal`).
        * O modal deve permitir ao usuário fazer o upload de uma imagem e configurar: Tempo de Início, Duração, Posição na tela, Tamanho (%) e Opacidade (%).
        * A imagem deve ser exibida sobre o vídeo durante a reprodução no intervalo de tempo configurado.

* **História de Usuário 2.4 (Reutilização e Colaboração):** *Como um professor que colabora com colegas, quero poder importar uma questão completa que recebi de outra pessoa para dentro do meu projeto atual, para agilizar a criação de provas e reutilizar conteúdo.*
    * **Requisitos Funcionais:**
        * Deve haver uma opção de menu "Questão > Importar...".
        * A ação deve abrir um diálogo para selecionar um arquivo `.avaquest`.
        * Ao selecionar o arquivo, a questão contida nele (incluindo vídeo e overlays) deve ser adicionada ao projeto atual.
        * A mídia da questão importada deve ser copiada para a pasta de mídias do projeto atual para garantir que o projeto permaneça autocontido.

#### **4. Requisitos Não-Funcionais**

* **4.1 Performance:**
    * O carregamento de vídeos deve ser rápido, com metadados (`duration`) lidos primeiro para renderizar a timeline imediatamente.
    * Operações pesadas (corte, exportação) devem ser assíncronas, com feedback de progresso, e não devem bloquear a interface do usuário.
    * O uso de memória deve ser gerenciado eficientemente, especialmente ao lidar com múltiplos vídeos grandes.

* **4.2 Usabilidade e Acessibilidade:**
    * A aplicação deve ter um fluxo de trabalho lógico e intuitivo, minimizando o número de cliques para tarefas comuns.
    * Todos os recursos devem ser acessíveis por atalhos de teclado, que devem ser exibidos nos menus.
    * A interface deve seguir diretrizes de acessibilidade (contraste, tamanho de fonte), conforme os arquivos CSS dedicados (`accessibility.css`).

*   **4.3 Segurança:**

    *   A aplicação deve implementar uma Política de Segurança de Conteúdo (CSP) rigorosa e configurada para mitigar riscos de cross-site scripting (XSS) no ambiente Electron.

    *   A interação com o sistema de arquivos (leitura/escrita) deve ser gerenciada com segurança pelo processo principal do Electron, nunca diretamente pelo renderer.

* **4.4 Compatibilidade:**
    * A aplicação deve ser compilada e funcional para Windows (via instalador NSIS) e Linux (via AppImage).
    * Deve haver compatibilidade com os formatos de vídeo mais comuns (MP4, WebM, AVI, MOV).

#### **5. Escopo e Versões Futuras**

* **5.1 Fora do Escopo para a v1.0:**
    * Suporte oficial para macOS.
    * Funcionalidades de edição de vídeo avançadas (transições, efeitos, correção de cor).
    * Colaboração em tempo real ou sincronização com a nuvem.
    * Criptografia de projetos ou provas exportadas.
    * Localização para outros idiomas além do Português (Brasil).

* **5.2 Possíveis Melhorias Futuras:**
    * Implementar uma biblioteca de mídia interna para reutilizar vídeos e imagens entre projetos.
    * Integrar ferramentas de legendagem para adicionar legendas em Português sincronizadas.
    * Desenvolver um player web para as provas `.ava`, facilitando a distribuição e aplicação online.