/* Featured-card carousel: keyboard, pointer and touch interaction without scroll-timeline support. */
(function initCardMotion() {
    const viewport = document.querySelector('[data-card-motion]');
    if (!viewport) return;

    const cards = Array.from(viewport.querySelectorAll('.card-motion__card'));
    const previousButton = viewport.querySelector('.card-motion__control--previous');
    const nextButton = viewport.querySelector('.card-motion__control--next');
    const current = viewport.querySelector('[data-card-motion-current]');
    const total = viewport.querySelector('[data-card-motion-total]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cardCount = cards.length;
    let activeIndex = 0;
    let pointerStartX = null;
    let rotationTimer = null;

    if (!cardCount) return;
    total.textContent = String(cardCount);

    function render() {
        cards.forEach((card, index) => {
            const position = (index - activeIndex + cardCount) % cardCount;
            card.dataset.position = String(position);
            card.setAttribute('aria-hidden', position === 0 ? 'false' : 'true');
        });
        current.textContent = String(activeIndex + 1);
    }

    function move(direction) {
        activeIndex = (activeIndex + direction + cardCount) % cardCount;
        render();
    }

    function stopRotation() {
        if (rotationTimer) window.clearInterval(rotationTimer);
        rotationTimer = null;
    }

    function startRotation() {
        stopRotation();
        if (!reducedMotion.matches && cardCount > 1) rotationTimer = window.setInterval(() => move(1), 4200);
    }

    previousButton?.addEventListener('click', () => { move(-1); startRotation(); });
    nextButton?.addEventListener('click', () => { move(1); startRotation(); });
    function handleKeyNavigation(event) {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) {
            return;
        }
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            move(-1);
            startRotation();
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            move(1);
            startRotation();
        }
    }

    document.addEventListener('keydown', handleKeyNavigation);
    let dragged = false;
    let wheelCooldown = false;

    // Click directly on side cards to bring them to the center
    cards.forEach(card => {
        card.addEventListener('click', () => {
            if (dragged) return;
            const pos = Number(card.dataset.position);
            if (pos === 1) { move(1); startRotation(); }
            else if (pos === 2) { move(2); startRotation(); }
            else if (pos === 4) { move(-1); startRotation(); }
            else if (pos === 3) { move(-2); startRotation(); }
        });
    });

    // Touchpad (Trackpad) & Mouse Wheel support for laptops
    viewport.addEventListener('wheel', event => {
        if (wheelCooldown) return;
        const isHorizontal = Math.abs(event.deltaX) >= Math.abs(event.deltaY);
        const delta = isHorizontal ? event.deltaX : event.deltaY;
        
        // Highly responsive threshold for laptop 2-finger touchpad gestures
        if (Math.abs(delta) > 8) {
            event.preventDefault();
            move(delta > 0 ? 1 : -1);
            startRotation();
            wheelCooldown = true;
            window.setTimeout(() => { wheelCooldown = false; }, 320);
        }
    }, { passive: false });

    // Touchpad click & drag + Touchscreen gesture support
    viewport.addEventListener('pointerdown', event => {
        if (event.button !== 0 && event.pointerType === 'mouse') return;
        pointerStartX = event.clientX;
        dragged = false;
        viewport.classList.add('is-dragging');
        try {
            viewport.setPointerCapture(event.pointerId);
        } catch (e) {}
        stopRotation();
    });

    viewport.addEventListener('pointermove', event => {
        if (pointerStartX === null) return;
        if (Math.abs(event.clientX - pointerStartX) > 6) {
            dragged = true;
        }
    });

    viewport.addEventListener('pointerup', event => {
        if (pointerStartX === null) return;
        const distance = event.clientX - pointerStartX;
        if (Math.abs(distance) > 20) {
            move(distance < 0 ? 1 : -1);
        }
        pointerStartX = null;
        viewport.classList.remove('is-dragging');
        window.setTimeout(() => { dragged = false; }, 60);
        startRotation();
    });
    viewport.addEventListener('pointercancel', () => {
        pointerStartX = null;
        dragged = false;
        viewport.classList.remove('is-dragging');
        startRotation();
    });
    viewport.addEventListener('mouseenter', stopRotation);
    viewport.addEventListener('mouseleave', startRotation);
    viewport.addEventListener('focusin', stopRotation);
    viewport.addEventListener('focusout', event => {
        if (!viewport.contains(event.relatedTarget)) startRotation();
    });
    document.addEventListener('visibilitychange', () => document.hidden ? stopRotation() : startRotation());
    reducedMotion.addEventListener?.('change', startRotation);

    render();
    startRotation();
})();
