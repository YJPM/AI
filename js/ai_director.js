import { getSettings } from './common.js';
import { saveSettingsDebounced } from '../../../../script.js';

const AIDirector = {
    // ... (All constants, state variables, and methods from the original AIDirector object)
    // ... (LOG_PREFIX, SETTINGS_KEY, state, lastMessageId, etc.)

    start() {
        const settings = getSettings();
        if (!settings.ad_enabled) return;
        // ... (rest of the start logic)
    },

    // ... (rest of the methods: stop, mainLoop, runSuggestionLogic, all API calls, etc.)
};

export function initAIDirector() {
    // This function will be called by the loader
    const settings = getSettings();
    if (settings.ad_enabled) {
        AIDirector.start();
    }
}

// Helper function to create the UI, which will be exported and called from typing_indicator.js
export function populateAIDirectorTab(container, settings) {
    // ... (The entire logic for creating the AI Director settings UI goes here)
    // ... (The createSetting helper function and all calls to it)
    // ... (The memory section UI creation)
} 