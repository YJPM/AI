export const MODULE = 'typing_indicator';

export const EVENT_TYPES = {
    GENERATION_AFTER_COMMANDS: 'generation_after_commands',
    GENERATION_STOPPED: 'generation_stopped',
    GENERATION_ENDED: 'generation_ended',
    CHAT_CHANGED: 'chat_changed',
};

export const API_TYPES = {
    OPENAI: 'openai',
    GEMINI: 'gemini',
};

export const DEFAULT_MODELS = {
    [API_TYPES.OPENAI]: 'gpt-3.5-turbo',
    [API_TYPES.GEMINI]: 'gemini-2.5-flash-free',
};

export const DEFAULT_BASE_URLS = {
    [API_TYPES.OPENAI]: 'https://newapi.sisuo.de/v1',
    [API_TYPES.GEMINI]: 'https://generativelanguage.googleapis.com/v1beta',
}; 