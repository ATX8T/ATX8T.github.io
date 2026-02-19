// cache-manager.js
/**
 * Clears all types of caches including localStorage, sessionStorage, cookies,
 * service workers, and forces a browser cache refresh.
 */
function clearAllCaches() {
    // Clear local storage
    localStorage.clear();
    console.log('Local storage cleared.');

    // Clear session storage
    sessionStorage.clear();
    console.log('Session storage cleared.');

    // Clear cookies
    document.cookie.split(';').forEach(function (c) { 
        document.cookie = c.replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`); 
    });
    console.log('Cookies cleared.');

    // Clear service workers
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
            registrations.forEach(function (registration) {
                registration.unregister();
                console.log('Service worker unregistered.');
            });
        });
    }

    // Force browser cache refresh
    window.location.reload(true);
    console.log('Browser cache refreshed.');
}

// Call the function to clear caches when needed
clearAllCaches();