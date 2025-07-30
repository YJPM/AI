(function () {
    'use-strict';

    // Function to dynamically load a script as a module
    function loadModule(src) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = `/scripts/extensions/third-party/AI/${src}?t=${Date.now()}`; // Add timestamp to prevent caching issues
        document.head.appendChild(script);
    }

    // Loader function to wait for SillyTavern to be ready
    function waitForSillyTavern() {
        let retries = 0;
        const maxRetries = 100;
        const interval = setInterval(() => {
            const isReady = window.jQuery && typeof TavernHelper !== 'undefined' && document.getElementById('extensions_settings');
            if (isReady) {
                clearInterval(interval);
                console.log('[AI导演 Loader] SillyTavern is ready. Loading modules...');
                // Load the main module that initializes everything
                loadModule('js/typing_indicator.js');
            } else if (++retries > maxRetries) {
                clearInterval(interval);
                console.error('[AI导演 Loader] Timed out waiting for SillyTavern to be ready.');
            }
        }, 200);
    }

    waitForSillyTavern();

})();