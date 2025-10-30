import React, { useState, useEffect } from 'react';
import apiService from '../utils/apiService';
import Icon, {
    faFile,
    faVideo,
    faQuestionCircle,
    faLayerGroup,
    faMemory,
    faMicrochip,
    faClock,
    faEdit,
    faCheck
} from './Icon';

const StatusbarItem = ({ icon, label, value }) => (
    <div className="flex items-center gap-1.5">
        <Icon icon={icon} className="statusbar-icon w-3 h-3" />
        {label && <span className="font-medium">{label}:</span>}
        <span className="font-mono opacity-90">{value}</span>
    </div>
);

const Statusbar = ({ questionCount, totalQuestions, currentProject, overlayCount }) => {
    const [time, setTime] = useState(new Date());
    const [systemInfo, setSystemInfo] = useState({ memory: '0 MB', cpu: 'Calculando...' });

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    // Get system info if available
    useEffect(() => {
        const fetchSystemInfo = async () => {
            try {
                // Usar o serviço centralizado de API
                const info = await apiService.getSystemInfo();
                if (info && info.totalMemory && info.freeMemory) {
                    const memoryUsage = Math.round((info.totalMemory - info.freeMemory) / 1024 / 1024 / 1024 * 10) / 10;
                    setSystemInfo(prev => ({
                        ...prev,
                        memory: `${memoryUsage} GB`
                    }));
                } else {
                    setSystemInfo(prev => ({ ...prev, memory: 'N/A' }));
                }
            } catch (error) {
                console.log('Statusbar: Could not fetch system info:', error.message);
                setSystemInfo(prev => ({ ...prev, memory: 'N/A' }));
            }
        };

        fetchSystemInfo();
        // Update memory info every 10 seconds (reduzido para menos spam)
        const memoryInterval = setInterval(fetchSystemInfo, 10000);
        return () => clearInterval(memoryInterval);
    }, []);

    // Get CPU info
    useEffect(() => {
        const fetchCpuInfo = async () => {
            try {
                // Usar o serviço de API para obter o uso da CPU
                const cpuUsage = await apiService.getCpuUsage();
                setSystemInfo(prev => ({
                    ...prev,
                    cpu: cpuUsage
                }));
            } catch (error) {
                console.log('Statusbar: Could not fetch CPU info:', error.message);
                setSystemInfo(prev => ({ ...prev, cpu: 'N/A' }));
            }
        };

        // Busca inicial e depois a cada 3 segundos
        fetchCpuInfo();
        const cpuInterval = setInterval(fetchCpuInfo, 3000);
        return () => clearInterval(cpuInterval);
    }, []);

    const projectStatus = currentProject?.isDirty ? 'Modificado' : 'Salvo';
    const projectName = currentProject?.name || 'Projeto sem Título';

    return (
        <footer className="h-7 bg-[var(--statusbar-bg)] text-white flex items-center justify-between px-3.5 text-xs border-t-2 border-[var(--statusbar-border)] shadow-[0_-1px_3px_rgba(0,0,0,0.2)] flex-shrink-0">
            <div className="flex items-center gap-3">
                <StatusbarItem icon={faFile} label="Projeto" value={projectName} />
                <div className="w-px h-4 bg-white/20"></div>
                <StatusbarItem icon={faVideo} label="Vídeo" value={currentProject?.questions.length > 0 ? 'Carregado' : 'Nenhum'} />
                <div className="w-px h-4 bg-white/20"></div>
                <StatusbarItem icon={faQuestionCircle} label="Questões" value={`${questionCount}/${totalQuestions}`} />
                <div className="w-px h-4 bg-white/20"></div>
                <StatusbarItem icon={faLayerGroup} label="Overlays" value={overlayCount} />
            </div>
            <div className="flex items-center gap-3">
                 <StatusbarItem icon={faMemory} value={systemInfo.memory} />
                <div className="w-px h-4 bg-white/20"></div>
                <StatusbarItem icon={faMicrochip} value={systemInfo.cpu} />
                <div className="w-px h-4 bg-white/20"></div>
                <StatusbarItem icon={faClock} value={time.toLocaleTimeString()} />
                <div className="w-px h-4 bg-white/20"></div>
                 <div className="flex items-center gap-1.5">
                    <i className={`fas fa-${currentProject?.isDirty ? 'edit' : 'check'} w-4 h-4 opacity-80`}></i>
                    <span className="font-medium">{projectStatus}</span>
                </div>
            </div>
        </footer>
    );
};

export default Statusbar;