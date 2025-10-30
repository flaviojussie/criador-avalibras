# 📖 Manual do Usuário - Criador AvaLIBRAS (Versão Beta)

Bem-vindo ao **Criador AvaLIBRAS**, a ferramenta definitiva para professores e intérpretes criarem videoprovas acessíveis em Língua Brasileira de Sinais (LIBRAS). Este manual irá guiá-lo através de todas as funcionalidades da aplicação, desde a instalação até a exportação de suas provas.

---

## 1. Introdução ao AvaLIBRAS

### 1.1. O que é o Criador AvaLIBRAS?
O Criador AvaLIBRAS é uma aplicação desktop gratuita e de código aberto, desenvolvida para simplificar a criação de avaliações em vídeo. Ele integra um editor de vídeo com funcionalidades específicas para o contexto educacional, permitindo que você crie, edite e distribua provas acessíveis de forma rápida e eficiente.

### 1.2. Para quem se destina?
Professores de escolas inclusivas, intérpretes de LIBRAS e designers instrucionais que trabalham diretamente com a comunidade surda.

### 1.3. Principais Funcionalidades
*   **Gestão de Projetos:** Crie, salve, carregue e gerencie suas videoprovas.
*   **Edição de Vídeo:** Corte trechos indesejados e adicione overlays de imagem.
*   **Marcação de Alternativas:** Sincronize precisamente as alternativas da questão com o vídeo.
*   **Gabarito:** Defina a resposta correta para cada questão.
*   **Importação/Exportação:** Compartilhe questões individuais ou exporte a prova completa.
*   **Criptografia:** Proteja suas provas exportadas com senha.
*   **Interface Intuitiva:** Desenvolvida para ser fácil de usar, mesmo sem conhecimento técnico avançado em edição de vídeo.

---

## 2. Instalação e Primeiro Uso

Para instruções detalhadas sobre como instalar o Criador AvaLIBRAS em seu sistema operacional, por favor, consulte o **[Guia de Instalação e Configuração](INSTALLATION_GUIDE.md)**.

### 2.1. Abrindo a Aplicação
Após a instalação, inicie o AvaLIBRAS. Na primeira execução, um modal de "Novo Projeto" será exibido automaticamente.

### 2.2. Visão Geral da Interface
A interface principal do AvaLIBRAS é dividida em três áreas principais:

*   **Barra de Título (Superior):** Contém os menus de Arquivo, Questão, Configurações e Ajuda.
*   **Barra Lateral (Esquerda):** Exibe a lista de questões do seu projeto e os detalhes da questão selecionada.
*   **Área de Edição (Central):** Onde o player de vídeo, a timeline e as ferramentas de edição estão localizados.
*   **Barra de Status (Inferior):** Mostra informações do projeto e do sistema.

---

## 3. Gerenciamento de Projetos

O AvaLIBRAS organiza seu trabalho em projetos, que contêm todas as questões e seus vídeos associados.

### 3.1. Criar Novo Projeto
1.  Vá em `Arquivo > Novo Projeto` no menu superior, ou use o atalho `Ctrl+N`.
2.  Um modal será exibido. Digite o **Nome do Projeto** e selecione o **Número de Alternativas** (4 ou 5).
3.  Clique em `Criar`. A interface principal será carregada com um projeto vazio.

### 3.2. Abrir Projeto Existente
1.  Vá em `Arquivo > Abrir...` no menu superior, ou use o atalho `Ctrl+O`.
2.  Selecione um arquivo `.avaprojet` no diálogo que aparecer.
3.  O projeto será carregado com todas as suas questões.

### 3.3. Salvar Projeto
1.  Vá em `Arquivo > Salvar` no menu superior, ou use o atalho `Ctrl+S`.
2.  Se for a primeira vez que você salva o projeto, um diálogo de salvamento será exibido para você escolher o nome e o local do arquivo `.avaprojet`.
3.  Para projetos já salvos, a aplicação salvará automaticamente as alterações no arquivo existente.

### 3.4. Salvar Projeto Como...
1.  Vá em `Arquivo > Salvar Como...` no menu superior, ou use o atalho `Ctrl+Shift+S`.
2.  Um diálogo de salvamento será exibido, permitindo que você salve o projeto com um novo nome ou em um novo local.

### 3.5. Projetos Recentes
O menu `Arquivo` exibe uma lista dos projetos acessados recentemente para facilitar o acesso rápido.

---

## 4. Trabalhando com Questões

As questões são o coração da sua videoprova. Você pode adicionar, editar, remover e organizar suas questões.

### 4.1. Adicionar Nova Questão
1.  Clique no botão `+` na barra lateral esquerda, ou vá em `Questão > Adicionar Nova` no menu superior, ou use o atalho `Alt+N`.
2.  Um diálogo de abertura de arquivo será exibido. Selecione o arquivo de vídeo (MP4, WebM, AVI, MOV, MKV) para a sua questão.
3.  A questão será adicionada à lista na barra lateral e carregada no editor.

### 4.2. Duplicar Questão
1.  Selecione a questão que deseja duplicar na barra lateral.
2.  Use o atalho `Ctrl+D`. Uma cópia exata da questão será adicionada à lista.

### 4.3. Remover Questão
1.  Selecione a questão que deseja remover na barra lateral.
2.  Use a tecla `Delete`. A questão será removida do projeto.
3.  Para remover todas as questões, vá em `Questão > Remover Todas as Questões` no menu superior. Uma confirmação será solicitada.

### 4.4. Importar Questão
1.  Vá em `Questão > Importar...` no menu superior.
2.  Selecione um arquivo `.avaquest` no diálogo que aparecer.
3.  A questão importada (incluindo vídeo e overlays) será adicionada ao seu projeto atual.

### 4.5. Exportar Questão
1.  Selecione a questão que deseja exportar na barra lateral.
2.  Vá em `Questão > Exportar Questão...` no menu superior.
3.  Um diálogo de salvamento será exibido. Escolha o nome e o local para o arquivo `.avaquest`.
4.  A questão será exportada como um arquivo autocontido, incluindo seu vídeo e overlays.

### 4.6. Reordenar Questões (Arrastar e Soltar)
Você pode reorganizar a ordem das questões na barra lateral simplesmente arrastando e soltando-as para a posição desejada.

---

## 5. Edição de Vídeos

O AvaLIBRAS oferece ferramentas de edição de vídeo integradas para refinar suas questões.

### 5.1. Importar Vídeos
Ao adicionar uma nova questão, você será solicitado a selecionar um arquivo de vídeo. Formatos suportados incluem MP4, WebM, AVI, MOV, MKV.

### 5.2. Cortar Seções de Vídeo (Excise Cuts)
Esta ferramenta permite remover trechos indesejados do seu vídeo.
1.  Selecione a questão cujo vídeo você deseja cortar.
2.  Clique no botão de tesoura (✂️) na barra de ferramentas do editor, ou use o atalho `C`.
3.  Na timeline, clique e arraste para selecionar o trecho que deseja **remover**. A área selecionada será destacada.
4.  Confirme o corte através da interface. O vídeo será processado em segundo plano e atualizado no player.

### 5.3. Adicionar Overlays (Imagens sobre o vídeo)
Overlays são imagens que aparecem sobre o vídeo em momentos específicos.
1.  Selecione a questão.
2.  Pause o vídeo no ponto onde você deseja que o overlay apareça.
3.  Clique no botão de imagem (🖼️) na barra de ferramentas do editor, ou use o atalho `I`.
4.  Um modal de "Configurar Overlay" será exibido.
    *   **Imagem:** Selecione o arquivo de imagem (PNG, JPG, etc.).
    *   **Tempo de Início:** O tempo atual do vídeo será preenchido automaticamente.
    *   **Duração:** Defina por quanto tempo o overlay ficará visível.
    *   **Posição:** Escolha a posição na tela (Centro, Superior Esquerdo, etc.) ou personalize.
    *   **Tamanho:** Ajuste o tamanho relativo à largura do vídeo.
    *   **Opacidade:** Defina a transparência do overlay.
5.  Clique em `OK` para adicionar o overlay. Você pode arrastar e redimensionar overlays diretamente no player.

### 5.4. Marcação Temporal de Alternativas
Para sincronizar as alternativas da questão com o vídeo:
1.  Reproduza o vídeo e pause-o no início da resposta para a alternativa `A`.
2.  Pressione a tecla `A` no teclado. Um marcador visual será adicionado na timeline.
3.  Repita para as alternativas `B`, `C`, `D` e `E` (se aplicável).
4.  Você pode ajustar os marcadores arrastando-os na timeline ou clicando neles para edição manual.

---

## 6. Configurações da Aplicação

Acesse as configurações da aplicação clicando no menu `Configurações` na barra de título.

### 6.1. Configurações Gerais
*   **Caminho Padrão para Salvar:** Defina o diretório padrão onde seus projetos serão salvos.
*   **Verificar Atualizações Automaticamente:** Ative ou desative a verificação automática de novas versões.

### 6.2. Qualidade de Vídeo
*   **Qualidade de Exportação:** Escolha a qualidade de vídeo para exportação de provas (Rascunho, Balanceado, Alta). Isso afeta o tamanho do arquivo e o tempo de processamento.

### 6.3. Limpeza de Arquivos Temporários
O AvaLIBRAS utiliza arquivos temporários para o processamento de vídeo.
*   **Limpeza Automática:** Os arquivos temporários são limpos automaticamente ao fechar a aplicação.
*   **Limpeza Manual:** Você pode acionar a limpeza manual de arquivos temporários através das configurações.

---

## 7. Exportação de Provas

Após criar e configurar suas questões, você pode exportar a prova completa.

### 7.1. Exportar Prova Completa
1.  Vá em `Arquivo > Exportar Prova...` no menu superior, ou use o atalho `Ctrl+E`.
2.  Um modal de criptografia será exibido. Você pode optar por proteger sua prova com uma senha.
3.  Um diálogo de salvamento será exibido. Escolha o nome e o local para o arquivo `.ava`.
4.  A prova será exportada como um único arquivo `.ava` (formato ZIP), contendo todos os vídeos, imagens e metadados. Um feedback de progresso será exibido durante a exportação.

### 7.2. Proteção por Senha
Ao exportar uma prova, você pode definir uma senha. Isso criptografará o conteúdo do projeto dentro do arquivo `.ava`, protegendo seu conteúdo intelectual. **Lembre-se: se você perder a senha, não será possível recuperar o conteúdo da prova.**

---

## 8. Associações de Arquivos

O Criador AvaLIBRAS associa-se a três tipos de arquivos:

*   **`.avaprojet` (Projeto AvaLIBRAS):** Contém o estado completo de um projeto em edição.
*   **`.ava` (Prova AvaLIBRAS):** O arquivo final exportado, pronto para ser aplicado.
*   **`.avaquest` (Questão AvaLIBRAS):** Um arquivo de questão individual exportado.

Ao instalar o AvaLIBRAS, essas associações são registradas em seu sistema operacional. Isso permite que você:
*   **Abra arquivos diretamente:** Dê um duplo clique em um arquivo `.avaprojet`, `.ava` ou `.avaquest` para abri-lo no AvaLIBRAS.
*   **Use o menu de contexto:** Clique com o botão direito em um desses arquivos e selecione "Abrir com AvaLIBRAS" (ou similar).

---

## 9. Solução de Problemas Comuns

### 9.1. Vídeo não carrega ou processa
*   **Verifique o formato:** Certifique-se de que o vídeo está em um formato suportado (MP4 com codec H.264 é o mais recomendado).
*   **Arquivo corrompido:** Tente abrir o vídeo em outro player para verificar se não está corrompido.
*   **Permissões:** Verifique se o AvaLIBRAS tem permissão para acessar o arquivo de vídeo.

### 9.2. Arquivos temporários acumulando
*   O AvaLIBRAS limpa automaticamente os arquivos temporários ao fechar. Se você notar acúmulo, verifique as configurações para limpeza manual.

### 9.3. Aplicação lenta
*   **Recursos do sistema:** Verifique o uso de CPU e memória do seu computador. Feche outras aplicações pesadas.
*   **Qualidade de vídeo:** Para edições, usar vídeos de menor resolução ou qualidade "Rascunho" pode melhorar o desempenho.

---

## 10. Suporte e Ajuda

### 10.1. Documentação Online
Para acessar a documentação mais recente e outros recursos, vá em `Ajuda > Documentação Online` no menu superior. Isso abrirá a página de documentação no GitHub em seu navegador padrão.

### 10.2. Reportar Problema
Se você encontrar um bug ou tiver uma sugestão, vá em `Ajuda > Reportar Problema` no menu superior. Isso abrirá a página de Issues do GitHub em seu navegador padrão.

### 10.3. Sobre o AvaLIBRAS
Para informações sobre a versão da aplicação e créditos, vá em `Ajuda > Sobre o AvaLIBRAS` no menu superior.

---

*Obrigado por usar o Criador AvaLIBRAS! Esperamos que esta ferramenta o ajude a criar avaliações mais acessíveis e inclusivas.*
