/* ============================================================
   animations.js — v2
   - Loader : 3 bandes blanches qui slident en escalier
   - Scroll reveal : fade + slide up, plus smooth
   ============================================================ */


/* ===== LOADER — 3 bandes en escalier ===== */
(function () {

    const overlay = document.createElement('div');
    overlay.id = 'loader-overlay';
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 9999;
        pointer-events: all;
        display: flex;
        flex-direction: column;
    `;

    /* Décalage en escalier : la bande du haut part en premier */
    const delays = [0, 0.18, 0.36];

    delays.forEach((delay) => {
        const band = document.createElement('div');
        band.style.cssText = `
            flex: 1;
            background: #fff;
            transform: translateX(0%);
            transition: transform 0.9s cubic-bezier(0.76, 0, 0.24, 1) ${delay}s;
            will-change: transform;
        `;
        overlay.appendChild(band);
    });

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    function triggerWipe() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.querySelectorAll('div').forEach(band => {
                    band.style.transform = 'translateX(105%)';
                });
            });
        });

        /* Durée totale : dernier délai (0.36) + durée transition (0.9) */
        const totalDuration = (0.36 + 0.9) * 1000;

        setTimeout(() => {
            overlay.style.pointerEvents = 'none';
            overlay.style.display = 'none';
            document.body.style.overflow = '';
            triggerHeroReveal();
        }, totalDuration);
    }

    if (document.readyState === 'complete') {
        setTimeout(triggerWipe, 120);
    } else {
        window.addEventListener('load', () => setTimeout(triggerWipe, 120));
        setTimeout(triggerWipe, 3500);
    }

})();


/* ===== HERO REVEAL — déclenché après la disparition des bandes ===== */
function triggerHeroReveal() {
    const heroEls = document.querySelectorAll('.hero-title, .hero-sub, .hero-btns');
    heroEls.forEach((el, i) => {
        el.style.transitionDelay = (i * 0.18) + 's';
        el.classList.add('is-visible');
    });
}


/* ===== SCROLL REVEAL ===== */
(function () {
    const targets = document.querySelectorAll('.reveal');
    if (!targets.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px 0px -32px 0px'
        }
    );

    targets.forEach(el => observer.observe(el));
})();