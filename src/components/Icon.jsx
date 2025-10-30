import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    // Video Controls
    faPlay,
    faPause,
    faBackward,
    faForward,
    faChevronLeft,
    faChevronRight,
    faCut,
    faSave,
    faImage,
    faEye,
    faCheck,
    faEdit,

    // Window Controls
    faTimes,
    faWindowMinimize,
    faWindowMaximize,
    faWindowRestore,

    // File & Project
    faFile,
    faFileImport,
    faVideo,
    faQuestionCircle,
    faMemory,
    faMicrochip,
    faClock,
    faLayerGroup,
    faCogs,

    // General
    faExclamationTriangle,
    faPlus,
    faFolder,
    faDownload,
    faUpload
} from '@fortawesome/free-solid-svg-icons';

// Icon component that wraps FontAwesome for consistency
const Icon = ({ icon, size = '1x', className = '', ...props }) => {
    return (
        <FontAwesomeIcon
            icon={icon}
            size={size}
            className={className}
            {...props}
        />
    );
};

export {
    Icon,
    FontAwesomeIcon,
    // Re-export commonly used icons for convenience
    faPlay,
    faPause,
    faBackward,
    faForward,
    faChevronLeft,
    faChevronRight,
    faCut,
    faSave,
    faImage,
    faEye,
    faCheck,
    faEdit,
    faTimes,
    faWindowMinimize,
    faWindowMaximize,
    faWindowRestore,
    faFile,
    faFileImport,
    faVideo,
    faQuestionCircle,
    faMemory,
    faMicrochip,
    faClock,
    faLayerGroup,
    faCogs,
    faExclamationTriangle,
    faPlus,
    faFolder,
    faDownload,
    faUpload
};

export default Icon;