const path = require('path');
const os = require('os');
const fs = require('fs');

// Unify temporary path management
const TEMP_BASE = path.join(os.tmpdir(), 'avalibras');

const TEMP_PATHS = {
    BASE: TEMP_BASE,
    CUTS: path.join(TEMP_BASE, 'cuts'),
    OVERLAYS: path.join(TEMP_BASE, 'overlays'),
    IMPORTS: path.join(TEMP_BASE, 'imports'),
    PROCESSED: path.join(TEMP_BASE, 'processed'),
};

// Implement detailed logging
const logger = {
    temp: (action, path, details = {}) => {
        console.log(`[TEMP] ${action}: ${path}`, details);
    },
    error: (action, error, context = {}) => {
        console.error(`[TEMP_ERROR] ${action}:`, error, context);
    }
};

// Implement robust error handling for directory creation
function createTempDir(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        fs.accessSync(dirPath, fs.constants.W_OK);
        logger.temp('Created', dirPath);
        return dirPath;
    } catch (error) {
        logger.error('Create Dir', error, { dirPath });
        throw new Error(`Failed to create temporary directory: ${error.message}`);
    }
}

module.exports = {
    TEMP_PATHS,
    logger,
    createTempDir,
};
