
AvaLIBRAS: Sistema de Videoprovas em Libras para a Educação Básica
Conteúdo

    Sobre o Projeto
    O Sistema de Videoprovas
        Software de Criação
        Software de Aplicação
    Contribuições e Impacto
    Autor

Sobre o Projeto

Este projeto de produto educacional, atualmente em fase final de desenvolvimento e como parte central da dissertação de Mestrado Profissional em Tecnologia Educacional da Universidade Federal do Ceará (UFC), aborda a busca por uma avaliação justa e inclusiva para estudantes surdos na educação básica. A pesquisa se concentra na escassez de ferramentas avaliativas que respeitem a Língua Brasileira de Sinais (Libras), a língua natural desses estudantes.

O objetivo principal é desenvolver e avaliar um sistema de videoprovas que ofereça acesso às questões tanto na versão escrita tradicional quanto em Libras, promovendo acessibilidade, inclusão e equidade na avaliação da aprendizagem. A investigação explora o contexto histórico e legal da educação de surdos, a importância da Libras e o potencial das tecnologias assistivas. Espera-se que este trabalho contribua com subsídios teóricos e práticos para políticas e práticas pedagógicas inclusivas, resultando em um software acessível e eficaz para a avaliação em Libras.
Palavras-chave: Avaliação educacional Estudantes surdos Libras Videoprovas Inclusão
O Sistema de Videoprovas em Libras

O projeto resultou no desenvolvimento de um sistema composto por dois softwares principais: um para a criação de videoprovas e outro para a aplicação dessas provas aos estudantes. Esta inovação visa promover a equidade na avaliação, empoderando professores, intérpretes e, principalmente, os estudantes surdos.
1. Criador AvaLIBRAS (Software de Criação de Videoprovas)

O "Criador AvaLIBRAS" é uma aplicação desktop desenvolvida para empoderar professores e intérpretes na elaboração de videoprovas em Libras. Ele oferece um ambiente completo para gerenciar projetos de provas, adicionar questões, manipular vídeos, adicionar overlays de imagem e definir os marcadores temporais para as alternativas, culminando na exportação de provas prontas para aplicação.
Principais Características e Funcionalidades:

    Gerenciamento de Projetos de Prova: Nomeação, salvar/importar projeto (`.avaprojet`), exportar prova final (`.ava`) com opção de proteção por senha e nível de compressão configurável.
    Gerenciamento de Questões: Adicionar, editar, excluir, reordenar (arrastar e soltar), visualizar, importar e exportar questões individualmente, com menu de contexto para ações rápidas.
    Manuseio de Vídeo por Questão: Upload (MP4), gravação via webcam, player integrado com controles avançados.
    Marcação Temporal Precisa: Definição de marcadores temporais para alternativas (A-E) com tooltips e feedback visual automático da seção (Enunciado, Item A, etc.) durante a marcação.
    Edição de Vídeo Destrutiva (com FFmpeg):
        Remoção precisa de trechos indesejados do vídeo.
    Recursos de Overlay de Imagem (Não Destrutivo via Canvas):
        Adicionar imagens (PNG, JPG, etc.) sobrepostas ao vídeo da questão.
        Configurar tempo de início, duração, posição (superior, inferior, centro, etc.), tamanho (relativo à largura do vídeo) e opacidade do overlay.
        Preview da imagem selecionada e ajustes em tempo real no editor.
        Overlays são aplicados de forma não destrutiva, preservando o vídeo original durante a edição, com qualidade de vídeo configurável na exportação.
    Interface e Usabilidade: Interface gráfica intuitiva, notificações visuais para feedback ao usuário, diálogos de progresso para operações longas (exportação, extração), atalhos de teclado.
    Registro de Erros: Sistema interno para registrar erros e facilitar a depuração.

Utilização do Criador AvaLIBRAS:

    Iniciar um Novo Projeto: Abrir o software, nomear a prova e aplicar.
    Adicionar Questões:
        Carregar um vídeo existente (MP4) ou gravar um novo vídeo utilizando a webcam.
        Definir os marcadores temporais para o enunciado (início do vídeo) e para cada alternativa (A, B, C, D, E) utilizando o player.
        Opcionalmente, adicionar e configurar um overlay de imagem sobre o vídeo, ajustando sua aparência e tempo de exibição.
        Opcionalmente, realizar edições destrutivas no vídeo, como remover trechos indesejados.
        Adicionar a questão configurada ao projeto da prova.
    Gerenciar Questões: Visualizar as questões adicionadas na lista lateral. Selecionar uma questão para visualização, ou realizar um duplo clique para entrar no modo de edição (permitindo alterar vídeo, marcadores e overlay). Reordenar as questões arrastando-as na lista.
    Salvar e Exportar:
        Salvar o projeto atual no formato `.avaprojet` a qualquer momento para continuar a edição posteriormente.
        Exportar a prova finalizada no formato `.ava`. Durante a exportação, é possível definir uma senha para proteger o arquivo da prova e configurar o nível de compressão.

Criador AvaLIBRAS - Software Funcional

O software de criação está funcional e com suas funcionalidades principais implementadas.
2. Aplicador AvaLIBRAS (Software de Aplicação de Videoprovas)

Este software, denominado "Aplicador AvaLIBRAS" ou "Plataforma AvaLIBRAS - Módulo de Aplicação", é a interface utilizada pelos estudantes para realizar as videoprovas. Ele foi projetado com foco na acessibilidade e usabilidade para estudantes surdos, permitindo que interajam com as questões da prova de forma intuitiva e segura.
Principais Características e Funcionalidades:

    Interface Dedicada e Segura: Aplicação desktop (Electron) para um ambiente focado na avaliação, minimizando distrações.
    Importação de Provas: Carrega provas no formato `.ava`.
        Suporte para arquivos de prova protegidos por senha, solicitando a senha ao usuário quando necessário.
        Exibição de diálogos de progresso durante a extração e carregamento dos arquivos da prova.
    Visualização Integrada e Acessível:
        Vídeo em Libras em destaque centralizado na tela.
        Menu lateral para navegação clara entre as questões da prova.
        Exibição de overlays de imagem sobre o vídeo, conforme configurados pelo professor/intérprete no Criador AvaLIBRAS, para fornecer contexto visual adicional.
    Controles de Vídeo Acessíveis: Player de vídeo customizado com funcionalidades essenciais:
        Play/Pause, barra de progresso, exibição de tempo atual e duração total.
        Controle de volume e opção de tela cheia.
        Botões de navegação específicos da questão: "INÍCIO" (para o enunciado) e botões para cada "ALTERNATIVA" (A-E), permitindo ao estudante pular diretamente para os trechos relevantes do vídeo.
        Controle de velocidade de reprodução (0.5x, 1x, 2x) para adaptar ao ritmo do estudante.
    Feedback Visual em Tempo Real:
        Notificações visuais na tela indicam a seção atual do vídeo que está sendo reproduzida (ex: "ENUNCIADO", "ITEM A").
        Feedback visual da velocidade de reprodução selecionada.
    Navegação Intuitiva entre Questões: Seleção direta da questão desejada através do menu lateral.
    Atalhos de Teclado: Comandos via teclado para controle do aplicativo e do player de vídeo, facilitando a interação.
    Gerenciamento de Arquivos Temporários: Limpeza automática dos arquivos temporários da prova após o uso, garantindo a privacidade e o bom funcionamento do sistema.
    Notificações ao Usuário: Mensagens e alertas informativos sobre o status da aplicação e possíveis erros.

Utilização do Aplicador AvaLIBRAS:

    Abrir o Software: Iniciar o aplicativo "Aplicador AvaLIBRAS".
    Importar Prova: Clicar no botão "IMPORTAR PROVA" e selecionar o arquivo `.ava` desejado. Se a prova estiver protegida por senha, uma caixa de diálogo solicitará que o usuário a insira para continuar. Um diálogo de progresso será exibido durante o carregamento.
    Navegar pelas Questões: Utilizar o menu lateral para selecionar a questão que deseja visualizar ou responder.
    Assistir ao Vídeo da Questão: O vídeo correspondente à questão selecionada será reproduzido automaticamente. Quaisquer imagens de overlay configuradas pelo criador da prova serão exibidas no momento apropriado sobre o vídeo.
    Utilizar Controles de Vídeo:
        Pausar ou retomar a reprodução do vídeo.
        Ajustar o volume ou silenciar o áudio.
        Expandir o vídeo para tela cheia para melhor visualização.
        Utilizar os botões "INÍCIO" ou "ALTERNATIVAS" (A-E) para navegar rapidamente para partes específicas do vídeo da questão.
        Ajustar a "VELOCIDADE" de reprodução do vídeo (lento, normal, rápido) conforme a necessidade.
    Observar Feedback Visual: Prestar atenção às notificações na tela que indicam qual parte da questão está sendo exibida (enunciado ou alternativas) e a velocidade de reprodução atual.

Aplicador AvaLIBRAS - Planejado

O software de aplicação está em fase de planejamento e será desenvolvido futuramente.
Contribuições e Impacto Esperado

Espera-se que o sistema de videoprovas não apenas promova a equidade na avaliação, mas também empodere os estudantes surdos, oferecendo-lhes a oportunidade de se destacarem em sua própria língua. Além disso, esta pesquisa pretende fornecer subsídios teóricos e práticos para a formulação de políticas e práticas pedagógicas verdadeiramente inclusivas. O resultado deste trabalho será um software acessível e eficaz, que abrirá novos horizontes para a avaliação em Libras e contribuirá para a construção de uma educação mais justa e igualitária.
Autor

Flávio Jussiê Ribeiro Fernandes
Orientação:

    Orientador: Prof. Dr. Leonardo Oliveira Moreira (UFC)
    Coorientador: Prof. Dr. Windson Viana de Carvalho (UFC)

Programa:

Programa de Pós-Graduação em Tecnologia Educacional (PPGTE)

Instituto Universidade Virtual

Universidade Federal do Ceará (UFC)

Ano de Defesa (previsto): 2025

© 2025 AvaLIBRAS - Projeto de Mestrado (Prof. Flávio Jussiê) - Versão 1.0

Desenvolvido com base na pesquisa de mestrado de Flávio Jussiê Ribeiro Fernandes, incorporando conceitos e funcionalidades do Criador AvaLIBRAS e Aplicador AvaLIBRAS.

