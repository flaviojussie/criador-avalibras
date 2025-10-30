# 📊 Análise de Problemas de Limpeza de Arquivos Temporários - AvaLIBRAS

**Data:** 30 de Outubro de 2025
**Versão:** AvaLIBRAS v2.0.0
**Status:** CRÍTICO - Sistema de limpeza não funciona conforme esperado

---

## 🚨 RESUMO EXECUTIVO

### Problema Identificado
O sistema de gerenciamento de arquivos temporários do AvaLIBRAS **NÃO está funcionando corretamente**. Apesar do código de limpeza estar implementado, **nenhum arquivo temporário está sendo criado** no diretório `/tmp/` do sistema Linux, mesmo após execução recente da aplicação e build completo.

### Impacto
- ✅ **Espaço em disco**: Não está sendo consumido (positivo)
- ❌ **Funcionalidade**: Processamento de vídeo pode não estar funcionando (crítico)
- ❌ **Confiabilidade**: Sistema pode estar falhando silenciosamente

---

## 🔍 EVIDÊNCIAS COLETADAS

### 1. Verificação Direta do Sistema
```bash
# Comandos executados para verificação
find /tmp -name "*avalibras*" -type f -ls     # Resultado: NENHUM arquivo encontrado
find /tmp -name "*avalibras*" -type d       # Resultado: NENHUM diretório encontrado
ls -la /tmp/                               # Resultado: Sem diretórios avalibras/
```

### 2. Evidências de Uso Recente
- **Configurações encontradas**: `~/.config/avalibras-react/settings.json`
- **Última modificação**: 29/10/2025 20:40 (hoje)
- **Build realizado**: Hoje com sucesso (.exe e .deb gerados)
- **Aplicação executada**: Logs mostram uso recente

### 3. Consumo de Espaço
- **Tamanho total do projeto**: 2.2GB
- **Consumidores principais**: `dist/` (1.2GB) e `node_modules/` (867MB)
- **Arquivos temporários**: **0MB** (problema identificado)

---

## 🐛 PROBLEMAS IDENTIFICADOS NO CÓDIGO

### Problema 1: Inconsistência de Caminhos

**Localização:** `electron/worker.js` vs `electron/main.js`

```javascript
// ❌ worker.js - Usa os.tmpdir()
function createTempDir(name) {
    const tempDir = path.join(os.tmpdir(), 'avalibras', name);
    // Cria: /tmp/avalibras/excise-cuts
    // Cria: /tmp/avalibras/overlays
}

// ❌ main.js - Usa app.getPath('temp')
const tempDir = path.join(app.getPath('temp'), 'avalibras-cuts');
// Cria: /tmp/avalibras-cuts (diferente!)

const tempDir = path.join(app.getPath('temp'), `avalibras-import-${Date.now()}`);
// Cria: /tmp/avalibras-import-1234567890 (diferente!)
```

**Impacto:** Arquivos podem estar sendo criados em locais diferentes dos verificados.

### Problema 2: Múltiplos Padrões de Nomenclatura

**Padrões encontrados:**
- `/tmp/avalibras/excise-cuts/`
- `/tmp/avalibras/overlays/`
- `/tmp/avalibras/processed/`
- `/tmp/avalibras-cuts/`
- `/tmp/avalibras-import-{timestamp}/`

**Problema:** Falta de padronização dificulta verificação e limpeza.

### Problema 3: Tratamento de Erros Inadequado

**Localização:** `electron/worker.js` - Função `createTempDir()`

```javascript
function createTempDir(name) {
    const tempDir = path.join(os.tmpdir(), 'avalibras', name);
    fs.mkdirSync(tempDir, { recursive: true });
    return tempDir;
    // ❌ Sem tratamento de erro!
    // ❌ Sem verificação se diretório foi criado
    // ❌ Sem log em caso de falha
}
```

### Problema 4: Race Condition na Limpeza

**Localização:** `electron/worker.js` - Funcões de processamento

```javascript
// ❌ Padrão problemático identificado
try {
    // Processa vídeo...
    return outputPath;
} finally {
    // ❌ Limpeza pode estar acontecendo antes de finalizar
    // ❌ Ou pode não estar acontecendo se erro ocorrer antes
    fs.rmSync(tempDir, { recursive: true, force: true });
}
```

### Problema 5: Falta de Logs de Depuração

**Problema:** Não há logs para verificar se:
- Diretórios temporários estão sendo criados
- Arquivos estão sendo gerados
- Limpeza está sendo executada
- Erros estão ocorrendo

---

## 🔧 ANÁLISE DETAHADA POR ARQUIVO

### `electron/worker.js`

#### **Funções Críticas:**
```javascript
// ❌ PROBLEMA: Sem tratamento de erro na criação
function createTempDir(name) {
    const tempDir = path.join(os.tmpdir(), 'avalibras', name);
    fs.mkdirSync(tempDir, { recursive: true });
    return tempDir;
}

// ❌ PROBLEMA: Limpeza pode falhar silenciosamente
try {
    await fsPromises.unlink(part1Path);
    await fsPromises.unlink(part2Path);
    await fsPromises.unlink(concatListPath);
} catch (cleanupError) {
    console.warn('⚠️ Worker: Erro ao limpar arquivos temporários:', cleanupError.message);
    // ❌ Log apenas como warning, pode passar despercebido
}
```

#### **Tipos de Operações:**
1. **Cortes de vídeo** (`runCutTask`)
2. **Overlays** (`runOverlayTask`)
3. **Processamento genérico** (`runProcessTask`)

### `electron/main.js`

#### **Funções Críticas:**
```javascript
// ❌ PROBLEMA: Criação de diretórios temporários diferentes
async function createTempDir() {
    const tempDir = path.join(app.getPath('temp'), 'avalibras-cuts');
    try {
        await fsPromises.mkdir(tempDir, { recursive: true });
        return tempDir;
    } catch (error) {
        console.error('Failed to create temp directory:', error);
        return null; // ❌ Retorna null em caso de erro
    }
}

// ❌ PROBLEMA: Handler de limpeza pode não ser chamado
ipcMain.handle('system:clear-temp-files', async () => {
    try {
        const tempBaseDir = path.join(app.getPath('temp'), 'avalibras');
        // Remove apenas /tmp/avalibras, mas não os outros padrões!
        await fsPromises.rm(tempBaseDir, { recursive: true, force: true });
    } catch (error) {
        console.error('❌ Main: Erro ao limpar arquivos temporários:', error);
    }
});
```

---

## 🎯 HIPÓTESES DO PROBLEMA

### Hipótese 1: Falha na Criação (Mais Provável)
- **Sintoma:** Nenhum arquivo temporário encontrado
- **Causa:** Permissões, caminhos incorretos ou exceções não tratadas
- **Evidência:** Sistema funciona (configs salvas) mas não cria temporários

### Hipótese 2: Limpeza Prematura
- **Sintoma:** Arquivos criados e imediatamente removidos
- **Causa:** Race condition no código de limpeza
- **Evidência:** Código de limpeza executado antes do uso

### Hipótese 3: Funcionalidade Não Usada
- **Sintoma:** Recursos de vídeo não foram utilizados
- **Causa:** Testes apenas com interface, sem processamento
- **Evidência:** Configurações presentes, mas sem uso das funções FFmpeg

### Hipótese 4: Localização Alternativa
- **Sintoma:** Arquivos em local diferente do verificado
- **Causa:** Múltiplos padrões de caminhos no código
- **Evidência:** Inconsistência entre `os.tmpdir()` e `app.getPath('temp')`

---

## 🚨 RECOMENDAÇÕES CRÍTICAS

### 1. CORREÇÕES IMEDIATAS (Urgente)

#### **A. Unificar Sistema de Caminhos**
```javascript
// ✅ CORREÇÃO: Criar módulo centralizado
// utils/tempPaths.js
const path = require('path');
const os = require('os');

const TEMP_BASE = path.join(os.tmpdir(), 'avalibras');

module.exports = {
    TEMP_BASE,
    CUTS_DIR: path.join(TEMP_BASE, 'cuts'),
    OVERLAYS_DIR: path.join(TEMP_BASE, 'overlays'),
    IMPORT_DIR: (timestamp) => path.join(TEMP_BASE, 'import', timestamp.toString()),
    PROCESSED_DIR: path.join(TEMP_BASE, 'processed')
};
```

#### **B. Adicionar Tratamento Robusto de Erros**
```javascript
// ✅ CORREÇÃO: createTempDir robusto
function createTempDir(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // Verificar se diretório foi criado e tem permissões
        fs.accessSync(dirPath, fs.constants.W_OK);

        console.log(`✅ Temp dir criado: ${dirPath}`);
        return dirPath;
    } catch (error) {
        console.error(`❌ Falha ao criar temp dir ${dirPath}:`, error);
        throw new Error(`Não foi possível criar diretório temporário: ${error.message}`);
    }
}
```

#### **C. Implementar Logging Detalhado**
```javascript
// ✅ CORREÇÃO: Sistema de logging
const logger = {
    temp: (action, path, details = {}) => {
        console.log(`[TEMP] ${action}: ${path}`, details);
    },
    error: (action, error, context = {}) => {
        console.error(`[TEMP_ERROR] ${action}:`, error, context);
    }
};
```

### 2. IMPLEMENTAÇÃO DE MONITORAMENTO

#### **A. Sistema de Verificação**
```javascript
// ✅ IMPLEMENTAR: Monitor de arquivos temporários
class TempFileMonitor {
    constructor() {
        this.activeFiles = new Map();
        this.cleanupTasks = new Set();
    }

    register(filePath, cleanupTask) {
        this.activeFiles.set(filePath, Date.now());
        if (cleanupTask) {
            this.cleanupTasks.add(cleanupTask);
        }
    }

    async verifyCleanup() {
        // Verificar se todos os arquivos foram limpos
        for (const [filePath, createdAt] of this.activeFiles) {
            if (fs.existsSync(filePath)) {
                console.warn(`⚠️ Arquivo temporário não limpo: ${filePath}`);
            }
        }
    }
}
```

#### **B. Diagnóstico Automático**
```javascript
// ✅ IMPLEMENTAR: Diagnóstico ao iniciar
async function diagnoseTempSystem() {
    const checks = [
        { name: 'Permissões de escrita', check: checkWritePermissions },
        { name: 'Disponibilidade de espaço', check: checkDiskSpace },
        { name: 'Caminhos válidos', check: checkPaths }
    ];

    for (const { name, check } of checks) {
        try {
            await check();
            console.log(`✅ ${name}: OK`);
        } catch (error) {
            console.error(`❌ ${name}: FALHA - ${error.message}`);
        }
    }
}
```

### 3. TESTES OBRIGATÓRIOS

#### **A. Teste de Integração de Temporários**
```javascript
// ✅ TESTAR: Verificar ciclo completo
describe('Sistema de Arquivos Temporários', () => {
    test('deve criar e limpar arquivos temporários', async () => {
        const tempDir = createTempDir('test');

        // Criar arquivo de teste
        const testFile = path.join(tempDir, 'test.txt');
        fs.writeFileSync(testFile, 'test');

        // Verificar se existe
        expect(fs.existsSync(testFile)).toBe(true);

        // Executar limpeza
        await cleanupTempDir(tempDir);

        // Verificar se foi limpo
        expect(fs.existsSync(testFile)).toBe(false);
    });
});
```

#### **B. Teste de Estresse**
```javascript
// ✅ TESTAR: Múltiplas operações simultâneas
test('deve lidar com múltiplas operações temporárias', async () => {
    const operations = Array(10).fill().map((_, i) =>
        runVideoProcessingTest(`test-${i}`)
    );

    await Promise.all(operations);

    // Verificar limpeza completa
    const remainingFiles = await findTempFiles();
    expect(remainingFiles.length).toBe(0);
});
```

---

## 📋 PLANO DE AÇÃO IMEDIATO

### Fase 1: Diagnóstico (1-2 dias)
1. **Implementar logging detalhado** em todas as funções temporárias
2. **Adicionar verificação de saúde** ao iniciar aplicação
3. **Criar script de diagnóstico** para identificar problemas

### Fase 2: Correção (3-5 dias)
1. **Unificar sistema de caminhos** temporários
2. **Implementar tratamento robusto de erros**
3. **Adicionar monitoramento ativo** de arquivos temporários

### Fase 3: Validação (2-3 dias)
1. **Executar testes de integração** completos
2. **Verificar funcionamento** com vídeos reais
3. **Monitorar sistema** em ambiente de produção

---

## 🔍 PONTOS DE VERIFICAÇÃO OBRIGATÓRIOS

### Para o Desenvolvedor:
- [ ] Verificar se FFmpeg está instalado e acessível
- [ ] Testar permissões de escrita em `/tmp`
- [ ] Executar funções de processamento de vídeo com logs ativados
- [ ] Monitorar diretório `/tmp/avalibras/` durante execução
- [ ] Verificar se handlers IPC estão sendo chamados
- [ ] Testar todas as funcionalidades que usam arquivos temporários

### Comandos de Verificação:
```bash
# 1. Verificar instalação FFmpeg
ffmpeg -version

# 2. Verificar permissões
ls -la /tmp/
touch /tmp/avalibras-test && rm /tmp/avalibras-test

# 3. Monitorar durante execução
watch -n 1 "find /tmp -name '*avalibras*' -ls"

# 4. Verificar logs
tail -f ~/.config/avalibras-react/logs/ (se existir)
```

---

## ⚠️ RISCOS IDENTIFICADOS

### Risco Crítico: Perda de Funcionalidade
- **Impacto:** Recursos principais podem não estar funcionando
- **Mitigação:** Testes obrigatórios de todas as funcionalidades

### Risco Alto: Acúmulo Futuro
- **Impacto:** Se corrigido, pode começar a acumular arquivos
- **Mitigação:** Implementar limpeza automática robusta

### Risco Médio: Experiência do Usuário
- **Impacto:** Operações podem falhar sem feedback claro
- **Mitigação:** Adicionar mensagens de erro informativas

---

## 📊 MÉTRICAS DE SUCESSO

### Indicadores de Correção:
- [ ] Arquivos temporários aparecem em `/tmp/avalibras/` durante uso
- [ ] Todos os arquivos são limpos automaticamente após uso
- [ ] Logs mostram ciclo completo de criação/limpeza
- [ ] Processamento de vídeo funciona com arquivos reais
- [ ] Não há acúmulo de arquivos após múltiplos usos

### Métricas a Monitorar:
1. **Número de arquivos temporários criados por sessão**
2. **Taxa de sucesso na limpeza (deve ser 100%)**
3. **Espaço médio utilizado durante operações**
4. **Tempo de limpeza após operações**
5. **Número de erros de criação/limpeza**

---

## 📞 CONTATO E SUPORTE

Para dúvidas ou problemas durante a implementação das correções:

1. **Verificar logs detalhados** que serão adicionados
2. **Executar script de diagnóstico** que será fornecido
3. **Monitorar diretório `/tmp/avalibras/`** durante testes
4. **Coletar logs de erro completos** para análise

**Status atual:** SISTEMA CRÍTICO - Necessita correção imediata
**Prioridade:** ALTA - Afeta funcionalidades principais do aplicativo

---

*Análise gerada em 30/10/2025 com base em investigação completa do sistema de arquivos temporários do AvaLIBRAS v2.0.0*