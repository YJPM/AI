(function () {
    'use-strict';

    // Get the container for extension settings
    const settingsContainer = document.getElementById('extensions_settings');
    if (!settingsContainer) {
        console.warn('[AI导演 Loader] Could not find extensions_settings container.');
        return;
    }

    // --- Create the basic UI shell immediately ---
    const inlineDrawer = document.createElement('div');
    inlineDrawer.classList.add('inline-drawer');
    settingsContainer.append(inlineDrawer);

    const inlineDrawerToggle = document.createElement('div');
    inlineDrawerToggle.classList.add('inline-drawer-toggle', 'inline-drawer-header');
    const extensionName = document.createElement('b');
    extensionName.textContent = 'AI导演'; // The name that appears in the settings panel
    const inlineDrawerIcon = document.createElement('div');
    inlineDrawerIcon.classList.add('inline-drawer-icon', 'fa-solid', 'fa-circle-chevron-down', 'down');
    inlineDrawerToggle.append(extensionName, inlineDrawerIcon);

    const inlineDrawerContent = document.createElement('div');
    inlineDrawerContent.classList.add('inline-drawer-content');
    inlineDrawerContent.id = 'ai-director-content-container'; // Add an ID to find it later
    inlineDrawer.append(inlineDrawerToggle, inlineDrawerContent);
    
    // Function to dynamically load a script as a module
    function loadModule(src) {
        const script = document.createElement('script');
        script.type = 'module';
        // Pass the container to the module via a global or other mechanism if needed,
        // but for now the module can just find it by ID.
        script.src = `/scripts/extensions/third-party/AI/${src}?t=${Date.now()}`;
        document.head.appendChild(script);
    }

    // --- Wait for SillyTavern's full load, then populate the content ---
    function waitForSillyTavern() {
        let retries = 0;
        const maxRetries = 100;
        const interval = setInterval(() => {
            const isReady = window.jQuery && typeof TavernHelper !== 'undefined';
            if (isReady) {
                clearInterval(interval);
                console.log('[AI导演 Loader] Populating settings panel...');
                loadModule('js/main.js'); // We'll create a new main module
            } else if (++retries > maxRetries) {
                clearInterval(interval);
                console.error('[AI导演 Loader] Timed out waiting for SillyTavern.');
            }
        }, 200);
    }
    
    // We can create the menu item immediately, but let's wait for the menu to exist
    const menuInterval = setInterval(() => {
        const extensionsMenu = document.getElementById('extensionsMenu');
        if (extensionsMenu) {
            clearInterval(menuInterval);
            const menuItem = document.createElement('div');
            menuItem.id = 'ai-director-menu-item';
            menuItem.classList.add('list-group-item', 'flex-container', 'flexGap5', 'interactable');
            menuItem.innerHTML = `<i class="fa-solid fa-lightbulb"></i><span>AI导演</span>`;
            extensionsMenu.append(menuItem);
        }
    }, 100);

    waitForSillyTavern();

})();