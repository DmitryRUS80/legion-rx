(function () {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./sw.js").catch(error => {
                console.error("Service Worker не зарегистрирован", error);
            });
        });
    }

    window.addEventListener("load", () => {
        const help = document.getElementById("installHelp");
        if (!help || isStandalone) return;

        if (isIos) {
            help.classList.remove("hidden");
            help.innerHTML = `
                <strong>Установить на iPhone:</strong>
                откройте меню <b>Поделиться</b> в Safari → <b>На экран «Домой»</b> → <b>Добавить</b>.
            `;
        }
    });
})();
