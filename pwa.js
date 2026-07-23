(function () {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    let reloading = false;

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js?v=3.4', {
                    updateViaCache: 'none'
                });
                await registration.update();

                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (reloading) return;
                    reloading = true;
                    window.location.reload();
                });
            } catch (error) {
                console.error('Service Worker не зарегистрирован', error);
            }
        });
    }

    window.addEventListener('load', () => {
        const help = document.getElementById('installHelp');
        if (!help || isStandalone) return;

        if (isIos) {
            help.classList.remove('hidden');
            help.innerHTML = `
                <strong>Установить на iPhone:</strong>
                откройте меню <b>Поделиться</b> в Safari → <b>На экран «Домой»</b> → <b>Добавить</b>.
            `;
        }
    });
})();
