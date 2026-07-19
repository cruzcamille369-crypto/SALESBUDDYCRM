/**
 * Module: ErrorLogger | File: /public/error-logger.js
 * 
 * Captures uncaught runtime errors and unhandled promise rejections
 * and outputs them cleanly to the console for tracking.
 */
window.addEventListener('error', (event) => {
    console.error('[Browser Uncaught Error]', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('[Browser Unhandled Rejection]', event.reason);
});
