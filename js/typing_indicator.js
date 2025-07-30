import { getSettings } from './common.js';
import { populateAIDirectorTab, initAIDirector } from './ai_director.js';
import { saveSettingsDebounced, eventSource, event_types, name2, isStreamingEnabled, selected_group } from '../../../../script.js';

// ... (All the functions for Typing Indicator logic: applyTheme, injectGlobalStyles, showTypingIndicator, hideTypingIndicator)

function addExtensionSettings(settings) {
    // ... (This is the full, refactored function that creates the tabs)
    // It will create the main drawer, the tab buttons, and the content panes.
    
    // It will then populate the Typing Indicator tab with its own settings.
    
    // Crucially, it will call the imported function to populate the other tab:
    populateAIDirectorTab(directorContent, settings);

    // It will also contain the "Check for Updates" button and logic.
}

export function initTypingIndicator() {
    // This function will be called by the loader
    injectGlobalStyles();
    const settings = getSettings();
    addExtensionSettings(settings);
    applyTheme(settings.ti_activeTheme);

    const showIndicatorEvents = [ event_types.GENERATION_AFTER_COMMANDS ];
    const hideIndicatorEvents = [ event_types.GENERATION_STOPPED, event_types.GENERATION_ENDED, event_types.CHAT_CHANGED ];

    showIndicatorEvents.forEach(e => eventSource.on(e, showTypingIndicator));
    hideIndicatorEvents.forEach(e => eventSource.on(e, hideTypingIndicator));
    
    // Also trigger the AI Director initialization check
    initAIDirector();
} 