/* ============ boot ============ */
lifeMigrate();
homeMigrate();
weddingMigrate();
hobbyMigrate();
applyLang();
render();
syncNative();
document.addEventListener('visibilitychange', () => { if (!document.hidden){ if (nav.tab === 'today') render(); syncNative(); } });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
