import React, { useState, useEffect, useRef } from 'react';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

/**
 * Dashboard para monitoramento de performance do editor de vídeo
 */
const PerformanceDashboard = ({ visible = false, onToggle }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const monitor = usePerformanceMonitor();
    const updateInterval = useRef(null);

    // Auto-update quando dashboard está visível
    useEffect(() => {
        if (visible) {
            updateInterval.current = setInterval(() => {
                // Força atualização das métricas
                monitor.saveMetricsSnapshot('dashboard_update');
            }, 2000);
        } else {
            if (updateInterval.current) {
                clearInterval(updateInterval.current);
            }
        }

        return () => {
            if (updateInterval.current) {
                clearInterval(updateInterval.current);
            }
        };
    }, [visible, monitor]);

    if (!visible) return null;

    const stats = monitor.getDetailedStats();
    const report = monitor.generateReport();
    const memory = monitor.getMemoryMetrics();

    const formatDuration = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    };

    const formatBytes = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    };

    const getPerformanceColor = (value, thresholds = { good: 100, warning: 300 }) => {
        if (value <= thresholds.good) return 'text-green-600';
        if (value <= thresholds.warning) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getSuccessRateColor = (rate) => {
        if (rate >= 95) return 'text-green-600';
        if (rate >= 85) return 'text-yellow-600';
        return 'text-red-600';
    };

    const tabs = [
        { id: 'overview', label: 'Visão Geral', icon: '📊' },
        { id: 'performance', label: 'Performance', icon: '⚡' },
        { id: 'operations', label: 'Operações', icon: '🎯' },
        { id: 'memory', label: 'Memória', icon: '💾' }
    ];

    const renderOverview = () => (
        <div className="space-y-4">
            {/* KPIs Principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-blue-600">
                        {stats.totalOperations}
                    </div>
                    <div className="text-sm text-gray-600">Operações</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className={`text-2xl font-bold ${getSuccessRateColor(stats.successRate)}`}>
                        {stats.successRate}%
                    </div>
                    <div className="text-sm text-gray-600">Taxa de Sucesso</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className={`text-2xl font-bold ${getPerformanceColor(stats.averageResponseTime)}`}>
                        {stats.averageResponseTime.toFixed(1)}ms
                    </div>
                    <div className="text-sm text-gray-600">Tempo Médio</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-purple-600">
                        {stats.operationsPerMinute}
                    </div>
                    <div className="text-sm text-gray-600">Ops/Minuto</div>
                </div>
            </div>

            {/* Status de Recursos */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold mb-3">Recursos do Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Event Listeners</span>
                            <span className="font-medium">{stats.eventListenersCount}</span>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Animações Ativas</span>
                            <span className="font-medium">{stats.activeAnimations}</span>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Erros</span>
                            <span className={`font-medium ${stats.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {stats.errorCount}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sessão */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold mb-3">Informações da Sessão</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <span className="text-sm text-gray-600">Duração da Sessão:</span>
                        <div className="font-medium">{formatDuration(stats.sessionDuration)}</div>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Tempo Ocioso:</span>
                        <div className="font-medium">{formatDuration(stats.idleTime)}</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPerformance = () => (
        <div className="space-y-4">
            {/* Tempos de Resposta */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold mb-3">Tempos de Resposta</h3>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Médio</span>
                            <span className={`font-medium ${getPerformanceColor(stats.averageResponseTime)}`}>
                                {stats.averageResponseTime.toFixed(2)}ms
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Mínimo</span>
                            <span className="font-medium text-green-600">
                                {stats.minResponseTime === Infinity ? 'N/A' : stats.minResponseTime.toFixed(2)}ms
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Máximo</span>
                            <span className={`font-medium ${getPerformanceColor(stats.maxResponseTime, { good: 200, warning: 500 })}`}>
                                {stats.maxResponseTime.toFixed(2)}ms
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Percentis */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold mb-3">Percentis</h3>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">P50 (Mediana)</span>
                            <span className={`font-medium ${getPerformanceColor(stats.percentiles.p50)}`}>
                                {stats.percentiles.p50.toFixed(2)}ms
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">P90</span>
                            <span className={`font-medium ${getPerformanceColor(stats.percentiles.p90)}`}>
                                {stats.percentiles.p90.toFixed(2)}ms
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">P95</span>
                            <span className={`font-medium ${getPerformanceColor(stats.percentiles.p95)}`}>
                                {stats.percentiles.p95.toFixed(2)}ms
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">P99</span>
                            <span className={`font-medium ${getPerformanceColor(stats.percentiles.p99)}`}>
                                {stats.percentiles.p99.toFixed(2)}ms
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alertas de Performance */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h3 className="text-lg font-semibold mb-3 text-yellow-800">⚠️ Alertas de Performance</h3>
                <div className="space-y-2">
                    {stats.averageResponseTime > 300 && (
                        <div className="text-sm text-yellow-700">
                            • Tempo médio de resposta acima do recomendado (&gt;300ms)
                        </div>
                    )}
                    {stats.successRate < 90 && (
                        <div className="text-sm text-yellow-700">
                            • Taxa de sucesso abaixo do recomendado (&lt;90%)
                        </div>
                    )}
                    {stats.errorCount > 5 && (
                        <div className="text-sm text-yellow-700">
                            • Número elevado de erros detectados
                        </div>
                    )}
                    {memory && parseFloat(memory.usagePercentage) > 80 && (
                        <div className="text-sm text-yellow-700">
                            • Uso de memória acima de 80%
                        </div>
                    )}
                    {stats.averageResponseTime <= 300 && stats.successRate >= 90 && stats.errorCount <= 5 && (!memory || parseFloat(memory.usagePercentage) <= 80) && (
                        <div className="text-sm text-green-700">
                            ✓ Performance dentro dos parâmetros esperados
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderOperations = () => (
        <div className="space-y-4">
            {/* Estatísticas de Operações */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold mb-3">Estatísticas de Operações</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-md font-medium text-gray-700 mb-2">Seleções</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Criadas:</span>
                                <span className="font-medium">{stats.selectionsCreated}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Concluídas:</span>
                                <span className="font-medium">{stats.selectionsCompleted}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Taxa de Conclusão:</span>
                                <span className={`font-medium ${getSuccessRateColor(stats.selectionsCreated > 0 ? (stats.selectionsCompleted / stats.selectionsCreated * 100) : 100)}`}>
                                    {stats.selectionsCreated > 0 ? (stats.selectionsCompleted / stats.selectionsCreated * 100).toFixed(1) : 100}%
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-md font-medium text-gray-700 mb-2">Cortes de Vídeo</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Executados:</span>
                                <span className="font-medium">{stats.cutsExecuted}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Bem-sucedidos:</span>
                                <span className="font-medium text-green-600">{stats.cutsSuccessful}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Falharam:</span>
                                <span className="font-medium text-red-600">{stats.cutsFailed}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Taxa de Sucesso:</span>
                                <span className={`font-medium ${getSuccessRateColor(stats.cutSuccessRate)}`}>
                                    {stats.cutSuccessRate}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Outras Operações */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold mb-3">Outras Operações</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Transições de Estado:</span>
                        <span className="font-medium">{stats.stateTransitions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Gestos Detectados:</span>
                        <span className="font-medium">{stats.gestureDetections}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMemory = () => (
        <div className="space-y-4">
            {memory ? (
                <>
                    {/* Uso de Memória */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h3 className="text-lg font-semibold mb-3">Uso de Memória</h3>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-600">Heap Usado</span>
                                    <span className="font-medium">{memory.usagePercentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${
                                            parseFloat(memory.usagePercentage) > 80
                                                ? 'bg-red-500'
                                                : parseFloat(memory.usagePercentage) > 60
                                                ? 'bg-yellow-500'
                                                : 'bg-green-500'
                                        }`}
                                        style={{ width: `${memory.usagePercentage}%` }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Usado:</span>
                                    <div className="font-medium">{formatBytes(memory.usedJSHeapSize)}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Total:</span>
                                    <div className="font-medium">{formatBytes(memory.totalJSHeapSize)}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Limite:</span>
                                    <div className="font-medium">{formatBytes(memory.jsHeapSizeLimit)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-center text-gray-500">
                        📊 Métricas de memória não disponíveis neste navegador
                    </div>
                </div>
            )}

            {/* Informações do Sistema */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold mb-3">Informações do Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">User Agent:</span>
                        <div className="font-medium break-all">{navigator.userAgent}</div>
                    </div>
                    <div>
                        <span className="text-gray-600">Plataforma:</span>
                        <div className="font-medium">{navigator.platform}</div>
                    </div>
                    <div>
                        <span className="text-gray-600">Linguagem:</span>
                        <div className="font-medium">{navigator.language}</div>
                    </div>
                    <div>
                        <span className="text-gray-600">Online:</span>
                        <div className="font-medium">{navigator.onLine ? 'Sim' : 'Não'}</div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-xl border border-gray-200 max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold">📊 Performance</span>
                    <span className={`w-2 h-2 rounded-full ${monitor.isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title={isExpanded ? "Recolher" : "Expandir"}
                    >
                        {isExpanded ? '📉' : '📈'}
                    </button>
                    <button
                        onClick={onToggle}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Fechar"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? 'border-blue-500 text-blue-600 bg-blue-50'
                                : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                    >
                        <span className="mr-1">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className={`p-4 ${isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-64 overflow-y-auto'}`}>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'performance' && renderPerformance()}
                {activeTab === 'operations' && renderOperations()}
                {activeTab === 'memory' && renderMemory()}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex space-x-2">
                    <button
                        onClick={() => monitor.saveMetricsSnapshot('manual')}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        💾 Salvar Snapshot
                    </button>
                    <button
                        onClick={() => {
                            const report = monitor.generateReport();
                            console.log('Performance Report:', report);
                            alert('Relatório salvo no console (F12)');
                        }}
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        📋 Gerar Relatório
                    </button>
                </div>
                <button
                    onClick={() => monitor.resetMetrics()}
                    className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                    🔄 Resetar
                </button>
            </div>
        </div>
    );
};

export default PerformanceDashboard;