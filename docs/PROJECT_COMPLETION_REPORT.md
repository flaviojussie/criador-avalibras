# Roadmap Pós-Beta e Melhorias Planejadas

## Visão Geral

Com o lançamento da **Versão Beta** do Criador AvaLIBRAS, o projeto entra em uma fase de testes com o público final. Este documento delineia as tarefas e melhorias planejadas para evoluir da versão Beta para a versão 1.0 (estável) e além, com base no feedback da comunidade e nos objetivos de longo prazo.

## 1. Itens para a Versão 1.0 (Estável)

Estas são as prioridades para garantir que a primeira versão estável seja robusta, confiável e completa.

*   **Integração Final das Configurações:**
    *   **Tarefa:** Conectar as opções do `SettingsModal` (frontend) à lógica do backend.
    *   **Detalhes:**
        *   Utilizar o `defaultSavePath` nos diálogos de salvamento.
        *   Fazer com que a verificação de atualizações (`autoUpdateCheck`) obedeça à escolha do usuário.
        *   Aplicar as configurações de qualidade de vídeo (`draft`, `balanced`, `high`) aos comandos do FFmpeg durante a exportação e processamento de overlays.

*   **Estabilização e Correção de Bugs:**
    *   **Tarefa:** Priorizar e corrigir os bugs reportados pela comunidade durante a fase Beta.
    *   **Detalhes:**
        *   Garantir a estabilidade do sistema de arquivos temporários, que foi recentemente corrigido.
        *   Melhorar o feedback visual na reordenação de questões (arrastar e soltar).

*   **Implementação de Testes Automatizados:**
    *   **Tarefa:** Desenvolver uma suíte de testes abrangente para garantir a qualidade e prevenir regressões.
    *   **Detalhes:**
        *   **Testes de Unidade:** Aumentar a cobertura de código dos hooks e utilitários.
        *   **Testes de Integração:** Validar a comunicação entre o frontend (React) e o backend (Electron IPC).
        *   **Testes End-to-End (E2E):** Simular fluxos de usuário completos, como criar um projeto do zero e exportá-lo.

*   **Polimento da Experiência do Usuário (UI/UX):**
    *   **Tarefa:** Refinar a interface com base no feedback dos usuários.
    * **Detalhes:**
        *   Melhorar as barras de progresso para operações demoradas (corte, exportação), fornecendo feedback mais claro.
        *   Revisar textos, ícones e consistência visual da aplicação.

## 2. Planejado para Versões Futuras (Pós 1.0)

Após o lançamento da versão estável, o foco se voltará para a expansão do ecossistema AvaLIBRAS.

*   **Desenvolvimento do Aplicador AvaLIBRAS:**
    *   **Tarefa:** Iniciar o projeto do software de aplicação de provas.
    *   **Status:** Atualmente em fase de planejamento.

*   **Melhorias de Acessibilidade:**
    *   **Tarefa:** Realizar uma auditoria completa de acessibilidade (WCAG 2.1 AA) e implementar as melhorias necessárias.

*   **Otimização de Performance:**
    *   **Tarefa:** Investigar e otimizar o desempenho com projetos muito grandes (muitas questões ou vídeos de alta resolução).

---
*Este documento serve como um guia para o desenvolvimento contínuo do AvaLIBRAS. As prioridades podem ser ajustadas com base no feedback da comunidade.*

*Última atualização: Outubro 2025*
*Status: Roteiro Pós-Beta*