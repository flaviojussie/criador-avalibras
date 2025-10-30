# Registros de Decisões de Arquitetura (ADR) - AvaLIBRAS

Este documento serve como um repositório para registrar decisões arquiteturais significativas tomadas durante o desenvolvimento do AvaLIBRAS. Cada ADR deve descrever o contexto da decisão, as opções consideradas, a decisão tomada e as consequências (positivas e negativas).

## O que é um ADR?

Um Architecture Decision Record (ADR) é um documento curto que captura uma decisão arquitetural importante, juntamente com seu contexto e consequências. O objetivo é fornecer um histórico das decisões que moldaram a arquitetura do sistema, facilitando a compreensão e a manutenção a longo prazo.

## Template de ADR

```markdown
# [Número do ADR] [Título da Decisão]

## Status

[Proposto | Aceito | Obsoleto | Substituído por ADR-XXX]

## Contexto

Descreva o problema ou a questão arquitetural que precisa ser resolvida. Inclua o cenário atual, as forças que impulsionam a decisão e os requisitos relevantes.

## Opções Consideradas

Liste as diferentes abordagens ou soluções que foram avaliadas para resolver o problema. Para cada opção, mencione brevemente seus prós e contras.

## Decisão

Declare claramente a decisão tomada. Explique por que essa opção foi escolhida em detrimento das outras, referenciando os prós e contras e como ela se alinha aos objetivos do projeto.

## Consequências

Liste as consequências da decisão, tanto as positivas (benefícios, ganhos) quanto as negativas (custos, riscos, trade-offs, complexidade adicionada). Inclua impactos em outras partes do sistema, no desenvolvimento, na manutenção e na operação.

## Data

[YYYY-MM-DD]

## Autores

[Nome(s) do(s) autor(es)]
```

## ADRs Registrados

---

### ADR-001 Escolha da Arquitetura Híbrida Electron + React

## Status

Aceito

## Contexto

O projeto AvaLIBRAS requer uma aplicação desktop que possa interagir com o sistema de arquivos local (para carregar e salvar vídeos/projetos), realizar processamento de vídeo intensivo (FFmpeg) e oferecer uma interface de usuário rica e interativa. A necessidade de ser multiplataforma (Windows e Linux inicialmente) e a expertise da equipe em desenvolvimento web (React) foram fatores cruciais.

## Opções Consideradas

1.  **Aplicação Desktop Nativa (e.g., C++/Qt, Java/Swing/JavaFX):**
    *   **Prós:** Melhor desempenho nativo, controle total sobre o sistema.
    *   **Contras:** Curva de aprendizado acentuada para a equipe, desenvolvimento multiplataforma mais complexo e demorado, UI menos flexível e moderna sem bibliotecas adicionais.

2.  **Aplicação Web (PWA):**
    *   **Prós:** Fácil distribuição, familiaridade da equipe com tecnologias web.
    *   **Contras:** Acesso limitado ao sistema de arquivos, impossibilidade de executar FFmpeg localmente de forma eficiente e segura, desafios de segurança para operações de arquivo, dependência de navegador.

3.  **Arquitetura Híbrida Electron + React:**
    *   **Prós:** Reutilização da expertise em React para o frontend, acesso a APIs nativas do sistema via Electron, desenvolvimento multiplataforma simplificado, UI moderna e flexível, capacidade de empacotar FFmpeg e executar em worker threads.
    *   **Contras:** Maior consumo de recursos (memória/CPU) em comparação com aplicações nativas, tamanho maior do executável, necessidade de gerenciar a comunicação entre processos (IPC).

## Decisão

A decisão foi adotar a arquitetura híbrida **Electron + React**. Esta escolha permite alavancar a experiência da equipe em desenvolvimento web para construir uma interface de usuário moderna e responsiva com React, enquanto o Electron fornece o acesso necessário às APIs do sistema operacional e a capacidade de empacotar e executar ferramentas como o FFmpeg localmente. A capacidade multiplataforma do Electron atende aos requisitos iniciais de Windows e Linux de forma eficiente.

## Consequências

*   **Positivas:**
    *   **Desenvolvimento Acelerado:** A equipe pode desenvolver o frontend rapidamente usando React.
    *   **UI Rica e Flexível:** Facilidade na criação de uma interface de usuário complexa e interativa.
    *   **Acesso a Recursos Nativos:** Interação com o sistema de arquivos, execução de processos externos (FFmpeg).
    *   **Multiplataforma:** Suporte nativo para Windows e Linux com uma única base de código.
    *   **Ecossistema:** Acesso a um vasto ecossistema de bibliotecas e ferramentas JavaScript/Node.js.

*   **Negativas:**
    *   **Consumo de Recursos:** Aplicações Electron tendem a consumir mais memória e CPU do que aplicações nativas equivalentes.
    *   **Tamanho do Executável:** O pacote final da aplicação é maior devido à inclusão do Chromium e Node.js.
    *   **Complexidade de Comunicação:** A necessidade de gerenciar a comunicação IPC entre o processo principal e o processo de renderização adiciona uma camada de complexidade.
    *   **Segurança:** Requer atenção cuidadosa à segurança, especialmente na configuração do `preload.js`, `contextBridge` e Content Security Policy (CSP), para evitar vulnerabilidades e garantir o isolamento de contexto.

## Data

2024-03-15

## Autores

Flávio Jussiê

---

### ADR-002 Utilização de FFmpeg em Worker Threads para Processamento de Vídeo

## Status

Aceito

## Contexto

O AvaLIBRAS exige operações intensivas de processamento de vídeo, como corte e aplicação de overlays, que podem ser demoradas e bloquear a thread principal da UI, resultando em uma experiência de usuário ruim (aplicação travada). A ferramenta escolhida para o processamento de vídeo é o FFmpeg, que é uma ferramenta de linha de comando externa.

## Opções Consideradas

1.  **Executar FFmpeg diretamente na thread principal do Electron:**
    *   **Prós:** Simplicidade de implementação inicial.
    *   **Contras:** Bloqueia a UI durante o processamento, causando travamentos e uma experiência de usuário inaceitável para operações longas.

2.  **Executar FFmpeg em um processo filho separado (child_process):**
    *   **Prós:** Não bloqueia a UI, permite processamento em segundo plano.
    *   **Contras:** Gerenciamento de múltiplos processos filhos pode ser complexo, comunicação entre o processo principal e os filhos pode ser ineficiente para grandes volumes de dados ou feedback de progresso contínuo.

3.  **Executar FFmpeg em Worker Threads (Node.js Worker Threads):**
    *   **Prós:** Não bloqueia a UI, permite processamento em segundo plano, comunicação eficiente com o processo principal via mensagens, melhor gerenciamento de recursos e estado em comparação com múltiplos processos filhos independentes.
    *   **Contras:** Adiciona uma camada de complexidade na arquitetura (gerenciamento de workers, fila de tarefas), requer serialização/desserialização de dados para comunicação.

## Decisão

A decisão foi utilizar **Worker Threads do Node.js** para executar as operações do FFmpeg. Esta abordagem oferece o melhor equilíbrio entre não bloquear a interface do usuário, gerenciar eficientemente as tarefas de processamento de vídeo em segundo plano e manter uma comunicação controlada com o processo principal. Isso garante que a aplicação permaneça responsiva mesmo durante operações de vídeo demoradas.

## Consequências

*   **Positivas:**
    *   **UI Responsiva:** A interface do usuário permanece fluida e responsiva durante operações de vídeo intensivas.
    *   **Processamento em Segundo Plano:** Permite que o usuário continue interagindo com outras partes da aplicação enquanto o vídeo é processado.
    *   **Gerenciamento de Fila:** Facilita a implementação de um sistema de fila para processar tarefas de FFmpeg sequencialmente, evitando sobrecarga do sistema.

*   **Negativas:**
    *   **Complexidade Adicional:** A arquitetura se torna mais complexa com a introdução de workers, a comunicação assíncrona e o gerenciamento e limpeza de arquivos temporários.
    *   **Overhead de Comunicação:** A passagem de dados entre o processo principal e os workers requer serialização, o que pode introduzir um pequeno overhead.
    *   **Depuração:** A depuração de código executado em worker threads pode ser ligeiramente mais complexa do que na thread principal.

## Data

2024-04-01

## Autores

Flávio Jussiê

---

### ADR-003 Centralized State Management with Custom Hooks

## Status

Aceito

## Contexto

A aplicação precisa gerenciar um estado complexo, incluindo a lista de questões, o estado do editor de vídeo, e a gestão de overlays. A passagem de estado e funções via props (prop drilling) através de múltiplos níveis de componentes se tornaria rapidamente insustentável, complexa e propensa a erros.

## Opções Consideradas

1.  **Context API do React:**
    *   **Prós:** Solução nativa do React, sem dependências externas.
    *   **Contras:** Pode levar a re-renderizações desnecessárias em componentes consumidores se não for cuidadosamente otimizado com `useMemo` e `useCallback`. Para estados muito complexos e com atualizações frequentes, a performance pode ser um problema.

2.  **Bibliotecas de Gerenciamento de Estado (Redux, MobX):**
    *   **Prós:** Soluções robustas e escaláveis, com ferramentas de desenvolvimento maduras.
    *   **Contras:** Aumentam a complexidade do projeto e o tamanho do bundle. Para a escala atual do AvaLIBRAS, a introdução de uma biblioteca como o Redux seria um exagero.

3.  **Custom Hooks (Hooks Personalizados):**
    *   **Prós:** Permite o encapsulamento da lógica de estado, tornando-a reutilizável e fácil de testar. Mantém a reatividade do React de forma idiomática. Evita o prop drilling sem a necessidade de uma biblioteca externa.
    *   **Contras:** Para estados globais que precisam ser compartilhados entre árvores de componentes muito distantes, pode ser necessário combinar com a Context API.

## Decisão

A decisão foi adotar o uso de **Custom Hooks** para o gerenciamento de estado. Foram criados os hooks `useQuestions`, `useVideoEditor`, e `useOverlay`, cada um responsável por uma parte específica do estado da aplicação. Esta abordagem permite uma separação clara de responsabilidades e um código mais limpo e organizado.

## Consequências

*   **Positivas:**
    *   **Código Organizado:** A lógica de estado é isolada em hooks específicos, facilitando a manutenção.
    *   **Reutilização:** A lógica pode ser facilmente reutilizada em diferentes partes da aplicação.
    *   **Testabilidade:** Hooks são funções JavaScript, o que os torna fáceis de testar isoladamente.
    *   **Performance:** Evita re-renderizações desnecessárias, pois apenas os componentes que usam um hook específico são atualizados quando o estado desse hook muda.

*   **Negativas:**
    *   **Complexidade Inicial:** A criação de hooks personalizados pode ter uma curva de aprendizado um pouco maior para desenvolvedores menos experientes em React.
    *   **Gerenciamento de Dependências:** É preciso ter cuidado com o array de dependências em `useEffect` e `useCallback` dentro dos hooks para evitar loops infinitos ou comportamentos inesperados.

## Autores

Flávio Jussiê

---

### ADR-004 Project and Question Import/Export using adm-zip and archiver

## Status

Aceito

## Contexto

A aplicação precisa de uma forma de exportar e importar projetos e questões, incluindo todos os arquivos de mídia associados (vídeos, imagens de overlay). O formato de arquivo resultante deve ser um único arquivo, fácil de compartilhar e armazenar.

## Opções Consideradas

1.  **Formato de Arquivo Personalizado:**
    *   **Prós:** Controle total sobre a estrutura do arquivo.
    *   **Contras:** Requer a implementação de um parser e um serializador do zero, o que é complexo e propenso a erros.

2.  **Uso de Bibliotecas de Compressão (ZIP):**
    *   **Prós:** Formato de arquivo padrão e amplamente suportado. Bibliotecas maduras e bem testadas disponíveis para Node.js. Simplifica o processo de empacotar e desempacotar arquivos.
    *   **Contras:** A estrutura interna do arquivo ZIP precisa ser bem definida e documentada.

## Decisão

A decisão foi usar o formato **ZIP** para exportação e importação de projetos e questões. As bibliotecas `archiver` e `adm-zip` foram escolhidas para criar e extrair os arquivos ZIP, respectivamente. O arquivo de projeto (`.avaprojet` ou `.avaquest`) contém um arquivo `videos.js` (JSON com os metadados do projeto/questão) e todos os arquivos de mídia associados.

## Consequências

*   **Positivas:**
    *   **Simplicidade:** A criação e extração de arquivos ZIP é simplificada pelo uso de bibliotecas existentes.
    *   **Portabilidade:** Arquivos ZIP são facilmente compartilháveis e podem ser inspecionados com qualquer ferramenta de descompressão.
    *   **Robustez:** As bibliotecas `archiver` e `adm-zip` são amplamente utilizadas e bem mantidas.

*   **Negativas:**
    *   **Dependências:** Adiciona duas novas dependências ao projeto.
    *   **Gerenciamento de Caminhos:** É necessário um cuidado especial para gerenciar os caminhos dos arquivos de mídia ao importar e exportar projetos para garantir que os links não sejam quebrados.

## Data

2024-10-29

## Autores

Flávio Jussiê

---

### ADR-005 Project Encryption using crypto module

## Status

Aceito

## Contexto

Para proteger o conteúdo intelectual dos projetos e provas criados com o AvaLIBRAS, é necessário oferecer uma opção de criptografia ao exportar um projeto. A criptografia deve ser forte o suficiente para proteger o conteúdo, mas também performática o suficiente para não impactar negativamente a experiência do usuário.

## Opções Consideradas

1.  **Criptografia Simétrica com Senha:**
    *   **Prós:** Simples de implementar e usar. A mesma senha é usada para criptografar e descriptografar.
    *   **Contras:** A segurança depende da força da senha escolhida pelo usuário.

2.  **Criptografia Assimétrica (Chave Pública/Privada):**
    *   **Prós:** Mais seguro, pois a chave de descriptografia não é compartilhada.
    *   **Contras:** Mais complexo de implementar e gerenciar. Requer que o usuário gerencie um par de chaves, o que pode ser confuso para usuários não técnicos.

## Decisão

A decisão foi implementar a **criptografia simétrica com senha** usando o módulo `crypto` nativo do Node.js. O algoritmo escolhido foi o `aes-256-cbc`, que é um padrão da indústria e oferece um bom equilíbrio entre segurança e performance. A senha fornecida pelo usuário é usada para derivar uma chave de criptografia usando `crypto.scryptSync`, que é uma função de derivação de chave baseada em senha que ajuda a proteger contra ataques de força bruta.

## Consequências

*   **Positivas:**
    *   **Segurança:** O conteúdo do projeto é protegido por uma criptografia forte.
    *   **Simplicidade:** A interface para o usuário é simples, exigindo apenas uma senha.
    *   **Sem Dependências Externas:** Utiliza o módulo `crypto` nativo do Node.js.

*   **Negativas:**
    *   **Performance:** A criptografia e descriptografia de projetos grandes pode levar algum tempo, embora o impacto seja minimizado pelo uso de funções síncronas eficientes.
    *   **Recuperação de Senha:** Não há como recuperar o conteúdo de um projeto se a senha for perdida.

## Data

2024-10-29

## Autores

Flávio Jussiê
