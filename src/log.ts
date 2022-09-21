export type LOG_LEVEL = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const levelFunctionMapping = {
    TRACE: console.trace,
    DEBUG: console.debug,
    INFO: console.info,
    WARN: console.warn,
    ERROR: console.error
}

function log(message: string, level: LOG_LEVEL) {
    levelFunctionMapping[level](`[${new Date().toISOString()}] [${level}] ${message}`);
}

export default {
    trace: (message: string) => log(message, 'TRACE'),
    debug: (message: string) => log(message, 'DEBUG'),
    info: (message: string) => log(message, 'INFO'),
    warn: (message: string) => log(message, 'WARN'),
    error: (message: string) => log(message, 'ERROR')
};
