# Guia de Instalação e Configuração do Criador AvaLIBRAS (Versão Beta)

Este guia oferece instruções detalhadas para instalar e configurar o **Criador AvaLIBRAS** (editor de videoprovas) tanto para usuários finais quanto para desenvolvedores que desejam contribuir com o projeto.

**⚠️ IMPORTANTE**: Apenas o **Criador AvaLIBRAS** está disponível nesta versão. O **Aplicador AvaLIBRAS** (player para estudantes) ainda não foi implementado.

## 1. Para Usuários Finais (Instalação da Aplicação)

### Requisitos de Sistema

#### **Mínimos:**
*   **Sistema Operacional**: Windows 10 ou superior / Linux (Ubuntu 20.04+, Fedora 35+, openSUSE 15.4+)
*   **Processador**: Dual core 1.5 GHz ou superior
*   **Memória RAM**: 4 GB (recomendado 8 GB)
*   **Espaço em Disco**: 500 MB para instalação + espaço para projetos
*   **Placa de Vídeo**: Com suporte a OpenGL 2.0+

#### **Recomendados:**
*   **Sistema Operacional**: Windows 11 / Linux recente
*   **Processador**: Quad core 2.0 GHz ou superior
*   **Memória RAM**: 8 GB ou superior
*   **Espaço em Disco**: 2 GB para instalação + projetos
*   **Placa de Vídeo**: Com aceleração de hardware

### Softwares Opcionais
*   **FFmpeg**: Necessário para processamento avançado de vídeo (já incluído na aplicação)
*   **Codecs de Vídeo**: Para suporte a formatos adicionais

### 1.1. Instalação no Windows

#### **Método 1: Instalador Oficial (Recomendado)**

1.  **Download**:
    *   Baixe o instalador `Avalibras-Setup-Beta.exe` da página de lançamentos oficial
    *   Verifique a integridade do arquivo usando o checksum fornecido

2.  **Executar o Instalador**:
    *   Clique com o botão direito no arquivo executável
    *   Selecione "Executar como administrador" (pode ser necessário)
    *   Clique em "Sim" no diálogo de Controle de Conta de Usuário (UAC)

3.  **Assistente de Instalação**:
    *   **Bem-vindo**: Clique em "Avançar"
    *   **Contrato de Licença**: Leia e aceite os termos
    *   **Diretório de Instalação**: Mantenha o padrão ou escolha outro local
    *   **Atalhos**: Escolha se deseja criar atalhos no Menu Iniciar e Área de Trabalho
    *   **Associação de Arquivos**: Mantenha marcado para associar arquivos `.avaprojet`
    *   **Pronto para Instalar**: Clique em "Instalar"

4.  **Conclusão**:
    *   Aguarde a instalação ser concluída
    *   Clique em "Concluir" para fechar o assistente
    *   Se marcada, a aplicação será iniciada automaticamente

#### **Método 2: Portátil (Sem Instalação)**

1.  **Download**: Baixe o arquivo `Avalibras-Beta-win32-x64.zip`
2.  **Extração**: Extraia o conteúdo para uma pasta de sua escolha
3.  **Execução**: Execute `Avalibras.exe` diretamente da pasta extraída

### 1.2. Instalação no Linux

#### **Método 1: AppImage (Recomendado)**

1.  **Download**:
    ```bash
    wget https://github.com/flaviojussie/criador-avalibras/releases/download/Avalibras-Beta.AppImage
    ```

2.  **Permissões de Execução**:
    ```bash
    chmod +x Avalibras-Beta.AppImage
    ```

3.  **Execução**:
    ```bash
    Avalibras-Beta.AppImage
    ```

4.  **Integração com o Sistema (Opcional)**:
    ```bash
    # Criar link simbólico em /usr/local/bin
    sudo ln -s $(pwd)/Avalibras-Beta.AppImage /usr/local/bin/avalibras

    # Criar entrada no menu de aplicativos
    sudo cp avalibras.desktop /usr/share/applications/
    ```

#### **Método 2: Gerenciador de Pacotes (Ubuntu/Debian)**

1.  **Adicionar Repositório**:
    ```bash
    sudo add-apt-repository ppa:avalibras/ppa
    sudo apt update
    ```

2.  **Instalar**:
    ```bash
    sudo apt install avalibras
    ```

#### **Método 3: Compilação a partir do Código Fonte**

Veja a seção de desenvolvedores abaixo.

### 1.3. Primeira Execução

#### **Windows**:
1.  Localize o AvaLIBRAS no Menu Iniciar ou através do atalho na área de trabalho
2.  Clique para iniciar a aplicação
3.  **Firewall**: O Windows pode solicitar permissão de rede - clique em "Permitir acesso"

#### **Linux**:
1.  Execute o AppImage ou o comando `avalibras` no terminal
2.  **Permissões**: Pode ser solicitado para acessar arquivos e pastas - conceda as permissões necessárias

### 1.4. Verificação da Instalação

Após a instalação, verifique se a aplicação está funcionando corretamente:

1.  **Início Rápido**: A aplicação deve iniciar em menos de 10 segundos
2.  **Interface**: Todos os menus e botões devem estar visíveis
3.  **Funcionalidades**: Teste criar um novo projeto e adicionar uma questão
*   **Associação**: Clique duplo em um arquivo `.avaprojet` para testar a associação

## 2. Para Desenvolvedores (Ambiente de Desenvolvimento)

### 2.1. Pré-requisitos

#### **Ferramentas Essenciais**:
*   **Node.js**: Versão 18.x ou superior
    ```bash
    # Verificar versão
    node --version  # deve ser v18.x ou superior
    npm --version   # deve ser 9.x ou superior
    ```
*   **Git**: Para controle de versão
    ```bash
    git --version
    ```

#### **Ferramentas Opcionais (Recomendadas)**:
*   **Visual Studio Code**: Editor de código com extensões para React e Electron
*   **Chrome DevTools**: Para depuração do processo de renderização
*   **Postman**: Para testar APIs (se desenvolvendo backend adicional)

### 2.2. Configuração do Ambiente de Desenvolvimento

#### **Passo 1: Clonar o Repositório**

```bash
# Clonar o repositório
git clone https://github.com/flaviojussie/criador-avalibras.git
cd avalibras

# Verificar a branch correta
git checkout main
git pull origin main
```

#### **Passo 2: Instalar Dependências**

```bash
# Instalar dependências do projeto
npm install

# Verificar se tudo foi instalado corretamente
npm ls --depth=0
```

#### **Passo 3: Variáveis de Ambiente**

Crie um arquivo `.env` na raiz do projeto (opcional):

```env
# Desenvolvimento
ELECTRON_IS_DEV=true
NODE_ENV=development

# Configurações (opcional)
AVALIBRAS_DEV_TOOLS=true
AVALIBRAS_LOG_LEVEL=debug
```

#### **Passo 4: Executar em Modo de Desenvolvimento**

```bash
# Iniciar servidor de desenvolvimento React e Electron
npm run dev:electron

# Ou separadamente:
npm run dev          # Inicia servidor React (porta 3000)
npm run electron-dev # Inicia Electron em modo dev
```

#### **Passo 5: Verificar Configuração**

A aplicação deve iniciar com:
*   **Hot Reload**: Mudanças no código refletem automaticamente
*   **DevTools**: Ferramentas de desenvolvedor disponíveis (F12)
*   **Console**: Logs detalhados no terminal e DevTools
*   **Recarregamento**: Ctrl+R para recarregar a aplicação

### 2.3. Comandos de Build e Desenvolvimento

#### **Desenvolvimento**:
```bash
npm run dev              # Apenas servidor React
npm run dev:electron      # React + Electron com hot reload
npm run electron-dev      # Apenas Electron (requer build prévio)
```

#### **Build**:
```bash
npm run build             # Build do React para produção
npm run build-electron    # Empacota aplicação Electron
npm run pack              # Cria pacote sem instalador
```

#### **Qualidade de Código**:
```bash
npm run lint              # Verificação de linting
npm run lint:fix          # Correção automática de linting
npm run format            # Formatação com Prettier
npm run format:check      # Verificação de formatação
```

#### **Testes**:
```bash
npm test                  # Executar todos os testes
npm run test:unit         # Testes unitários
npm run test:integration  # Testes de integração
npm run test:coverage     # Testes com coverage
```

### 2.4. Estrutura de Diretórios

```
avalibras/
├── docs/                  # Documentação do projeto
├── electron/              # Código do processo principal Electron
│   ├── main.js           # Janela principal e handlers IPC
│   ├── preload.js        # Ponte segura entre processos
│   └── worker.js         # Worker threads para FFmpeg
├── public/                # Arquivos estáticos
│   ├── index.html        # Template HTML principal
│   └── source/           # Recursos (ícones, imagens)
├── src/                   # Código-fonte React
│   ├── components/       # Componentes React
│   ├── hooks/           # Hooks personalizados
│   ├── utils/           # Utilitários e serviços
│   └── index.js         # Ponto de entrada React
├── build/                 # Build de produção
├── dist/                  # Distribuição Electron
├── assets/                # Recursos para build
├── package.json           # Dependências e scripts
└── README.md             # Documentação do projeto
```

### 2.5. Configuração do Ambiente de Desenvolvimento Avançado

#### **VS Code - Extensões Recomendadas**:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "ms-vscode.debugger-for-chrome",
    "ms-vscode.vscode-node-debug2"
  ]
}
```

#### **VS Code - Settings.json**:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "files.associations": {
    "*.jsx": "javascriptreact"
  }
}
```

#### **Debug Configuration (.vscode/launch.json)**:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
      },
      "args": ["."],
      "outputCapture": "std"
    },
    {
      "name": "Debug Renderer Process",
      "type": "chrome",
      "request": "attach",
      "port": 9222,
      "webRoot": "${workspaceFolder}/src",
      "timeout": 30000
    }
  ]
}
```

## 3. Solução de Problemas

### 3.1. Problemas Comuns de Instalação

#### **Windows - "O aplicativo não pode ser executado"**
*   **Causa**: Windows Defender bloqueando a execução
*   **Solução**:
    1.  Clique com o botão direito no arquivo
    2.  Propriedades > Geral
    3.  Marque "Desbloquear" > Aplicar > OK
    4.  Execute novamente

#### **Linux - "Permissão negada"**
*   **Causa**: Arquivo não tem permissão de execução
*   **Solução**:
    ```bash
    chmod +x Avalibras-*.AppImage
    ```

#### **Linux - "Biblioteca não encontrada"**
*   **Causa**: Dependências do sistema faltando
*   **Solução**:
    ```bash
    # Ubuntu/Debian
    sudo apt install libgtk-3-0 libnotify4 libnss3 libxss1 libxtst6 xdg-utils libatspi2.0-0 libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxkbcommon0 libasound2

    # Fedora
    sudo dnf install gtk3 libnotify nss libXss libXtst xdg-utils atk libdrm libXcomposite libXdamage libXrandr libgbm libxkbcommon alsa-lib
    ```

### 3.2. Problemas de Desenvolvimento

#### **"electron não encontrado"**
```bash
# Reinstalar dependências
npm install
npm install --save-dev electron

# Limpar cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### **Porta 3000 já em uso**
```bash
# Encontrar processo usando a porta
lsof -ti:3000
# Matar processo
kill -9 $(lsof -ti:3000)

# Ou usar outra porta
PORT=3001 npm run dev
```

#### **"Module not found"**
```bash
# Verificar se módulo está instalado
npm ls nome-do-modulo

# Instalar módulo faltante
npm install nome-do-modulo
```

#### **Problemas de Hot Reload**
1.  Verifique se o servidor React está rodando
2.  Reinicie o processo de desenvolvimento
3.  Limpe o cache do navegador (Ctrl+Shift+Del)

### 3.3. Performance

#### **Aplicação lenta ao iniciar**
*   **Verificar**: Uso de CPU e disco durante inicialização
*   **Solução**: Fechar outras aplicações pesadas
*   **Prevenção**: Usar SSD em vez de HDD

#### **Vídeo não carrega**
*   **Verificar**: Formato do vídeo (MP4 recomendado)
*   **Verificar**: Codec (H.264 recomendado)
*   **Solução**: Converter vídeo usando HandBrake ou FFmpeg

### 3.4. Logs e Diagnóstico

#### **Obter Logs no Windows**:
1.  Pressione Win+R e digite `%APPDATA%\avalibras\logs`
2.  Abra o arquivo mais recente em um editor de texto

#### **Obter Logs no Linux**:
```bash
# Logs da aplicação
~/.config/avalibras/logs/

# Logs do sistema
journalctl -u avalibras
```

#### **Ativar Debug Mode**:
```bash
# Windows
set ELECTRON_IS_DEV=true
set AVALIBRAS_LOG_LEVEL=debug
npm run dev:electron

# Linux/macOS
ELECTRON_IS_DEV=true AVALIBRAS_LOG_LEVEL=debug npm run dev:electron
```

## 4. Atualizações e Manutenção

### 4.1. Atualização da Aplicação

#### **Automático (Windows)**:
1.  A aplicação verifica automaticamente por atualizações
2.  Uma notificação aparecerá quando houver uma atualização
3.  Clique na notificação para baixar e instalar

#### **Manual**:
1.  Baixe a versão mais recente do site oficial
2.  Desinstale a versão anterior
3.  Instale a nova versão seguindo o guia acima

### 4.2. Backup de Projetos

**Localização dos Projetos**:
*   **Windows**: `%USERPROFILE%\Documents\AvaLIBRAS\Projects\`
*   **Linux**: `~/Documents/AvaLIBRAS/Projects/`

**Backup Automático**:
```bash
# Script de backup simples
#!/bin/bash
BACKUP_DIR="$HOME/avalibras-backup-$(date +%Y%m%d)"
PROJECTS_DIR="$HOME/Documents/AvaLIBRAS/Projects"

mkdir -p "$BACKUP_DIR"
cp -r "$PROJECTS_DIR" "$BACKUP_DIR"
echo "Backup concluído: $BACKUP_DIR"
```

### 4.3. Desinstalação

#### **Windows**:
1.  Painel de Controle > Programas e Recursos
2.  Encontre "AvaLIBRAS" na lista
3.  Clique em "Desinstalar"
4.  Siga o assistente de desinstalação

#### **Linux**:
```bash
# Se instalado via AppImage
# Simplesmente delete o arquivo

# Se instalado via repositório
sudo apt remove avalibras
sudo apt autoremove
```

---

## 5. Suporte e Comunidade

### 5.1. Canais de Suporte

*   **Documentação**: Verifique a pasta `docs/` do projeto
*   **Issues**: Reporte problemas no GitHub Issues
*   **Wiki**: Documentação adicional e tutoriais
*   **Discord**: Comunidade para suporte em tempo real (se disponível)

### 5.2. Contribuição

Veja `CONTRIBUTING.md` no repositório para detalhes sobre como contribuir com o projeto.

---

*Versão: Beta*
*Última atualização: Outubro 2025*
*Aplicação: AvaLIBRAS*