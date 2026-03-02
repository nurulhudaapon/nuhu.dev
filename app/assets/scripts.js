(function () {
    var cards = document.querySelectorAll('.project-card');
    var area = document.querySelector('.projects');
    var rect = area.getBoundingClientRect();
    var isMobile = rect.width <= 640;
    var gapX = 20, gapY = 20;
    var cardW = isMobile ? (rect.width - 32) : 340;
    var cardH = 200;
    var cols = Math.min(cards.length, Math.floor(rect.width / (cardW + gapX)) || 1);
    var startX;
    cols = Math.min(cols, 2);
    var totalW = cols * cardW + (cols - 1) * gapX;
    startX = (rect.width - totalW) / 2;
    var totalRows = Math.ceil(cards.length / cols);
    var areaHeight = totalRows * (cardH + gapY + 20) + 40;
    area.style.height = areaHeight + 'px';

    // ── Enabled effects (empty array = no effects) ──
    var enabledEffects = ['quake', 'slice'];

    // ── Shared state ──
    var effectType = sessionStorage.getItem('effectType');
    var effectState = sessionStorage.getItem('effectState');
    var triggered = false;

    if (effectState === 'reloaded_once') {
        sessionStorage.removeItem('effectState');
        sessionStorage.removeItem('effectType');
        sessionStorage.setItem('effectDone', '1');
        effectState = null;
        effectType = null;
    }

    var effectDone = sessionStorage.getItem('effectDone') === '1';

    var positions = [];
    cards.forEach(function (c, i) {
        var col = i % cols, row = Math.floor(i / cols);
        var x = startX + col * (cardW + gapX);
        var y = row * (cardH + gapY + 20) + 20;
        positions.push({ x: x, y: y });
        c.style.left = x + 'px';
        c.style.top = y + 'px';
        c.style.transform = 'rotate(0deg)';
        c.dataset.rot = '0';
        c.dataset.orgX = x;
        c.dataset.orgY = y;
    });

    var msgEl = document.createElement('div');
    msgEl.className = 'quake-msg';
    msgEl.style.display = 'none';
    area.parentNode.insertBefore(msgEl, area);

    var messages = {
        quake: {
            initial: '🫨 Oops! Your cursor caused an earthquake - drag the cards to put them back!',
            reload: '😏 Nice try! Reload once more to end the fun - or stay and play.',
            fixed: '✨ Nice work! Everything is back in order.'
        },
        slice: {
            initial: '✂️ Your cursor just sliced through the cards - drag the pieces back!',
            reload: '🔪 Still in pieces! One more reload to undo the damage - or fix it yourself.',
            fixed: '🧩 Perfectly reassembled! Good as new.'
        }
    };

    // ── Shared helpers ──

    function scatterCards(animate) {
        cards.forEach(function (c) {
            var maxX = rect.width - cardW;
            var maxY = parseFloat(area.style.height) - cardH;
            var rx = Math.random() * maxX;
            var ry = Math.random() * maxY;
            var rr = (Math.random() * 30 - 15);
            if (animate) {
                c.style.transition = 'left 0.5s cubic-bezier(0.22,1,0.36,1), top 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)';
                setTimeout(function() { c.style.transition = ''; }, 550);
            }
            c.style.left = rx + 'px';
            c.style.top = ry + 'px';
            c.style.transform = 'rotate(' + rr + 'deg)';
            c.dataset.rot = rr;
        });
    }

    function setSliceVisual(on) {
        cards.forEach(function (c) { c.classList[on ? 'add' : 'remove']('sliced'); });
    }

    function activate(type, animate) {
        triggered = true;
        effectType = type;
        sessionStorage.setItem('effectType', type);
        sessionStorage.setItem('effectState', 'triggered');
        msgEl.innerHTML = messages[type].initial;
        msgEl.style.display = 'block';
    }

    // ── Effect: Earthquake ──

    function earthquakeEffect() {
        if (triggered) return;
        activate('quake');
        area.classList.add('quake-shake');
        setTimeout(function () { area.classList.remove('quake-shake'); }, 600);
        scatterCards(true);
    }

    function earthquakeRestore() {
        scatterCards(false);
    }

    // ── Effect: Slice ──

    function sliceEffect() {
        if (triggered) return;
        activate('slice');
        area.classList.add('slash-sweep');
        setTimeout(function () { area.classList.remove('slash-sweep'); }, 800);
        setSliceVisual(true);
        setTimeout(function () { scatterCards(true); }, 200);
    }

    function sliceRestore() {
        setSliceVisual(true);
        scatterCards(false);
    }

    // ── Effect registry ──

    var effects = {
        quake: { trigger: earthquakeEffect, restore: earthquakeRestore, cleanup: function () {} },
        slice: { trigger: sliceEffect, restore: sliceRestore, cleanup: function () { setSliceVisual(false); } }
    };

    // ── Handle reload persistence ──

    if (effectState === 'triggered' && effectType && effects[effectType]) {
        sessionStorage.setItem('effectState', 'reloaded_once');
        triggered = true;
        msgEl.innerHTML = messages[effectType].reload;
        msgEl.style.display = 'block';
        effects[effectType].restore();
    }

    // ── Trigger random effect on hover ──

    function triggerRandomEffect() {
        if (triggered || enabledEffects.length === 0) return;
        var picked = enabledEffects[Math.floor(Math.random() * enabledEffects.length)];
        if (effects[picked]) effects[picked].trigger();
    }

    if (!effectDone && enabledEffects.length > 0) {
        area.addEventListener('mouseenter', triggerRandomEffect);
        area.addEventListener('touchstart', function () { triggerRandomEffect(); }, { passive: true, once: true });
    }

    // ── Check if cards are back in place ──

    function checkOrganized() {
        if (!triggered) return;
        var allGood = true;
        cards.forEach(function (c, i) {
            var cx = parseFloat(c.style.left);
            var cy = parseFloat(c.style.top);
            var dx = Math.abs(cx - positions[i].x);
            var dy = Math.abs(cy - positions[i].y);
            if (dx > 50 || dy > 50) allGood = false;
        });
        if (allGood) {
            sessionStorage.removeItem('effectState');
            sessionStorage.removeItem('effectType');
            sessionStorage.setItem('effectDone', '1');
            if (effectType && effects[effectType]) effects[effectType].cleanup();
            msgEl.innerHTML = messages[effectType || 'quake'].fixed;
            msgEl.classList.add('quake-msg-success');
            setTimeout(function () {
                msgEl.style.display = 'none';
                msgEl.classList.remove('quake-msg-success');
            }, 2500);
        }
    }

    // ── Drag handling ──

    var drag = null, offX, offY, moved;
    function onDown(e) {
        var c = e.target.closest('.project-card');
        if (!c) return;
        e.preventDefault();
        drag = c; moved = false;
        var t = e.touches ? e.touches[0] : e;
        var cr = c.getBoundingClientRect();
        offX = t.clientX - cr.left;
        offY = t.clientY - cr.top;
        c.classList.add('dragging');
        c.style.transform = 'rotate(0deg) scale(1.04)';
        c.style.zIndex = 100;
    }
    function onMove(e) {
        if (!drag) return;
        e.preventDefault();
        moved = true;
        var t = e.touches ? e.touches[0] : e;
        var ar = area.getBoundingClientRect();
        drag.style.left = (t.clientX - ar.left - offX) + 'px';
        drag.style.top = (t.clientY - ar.top - offY) + 'px';
    }
    function onUp(e) {
        if (!drag) return;
        drag.classList.remove('dragging');
        drag.style.transform = 'rotate(' + drag.dataset.rot + 'deg)';
        drag.style.zIndex = '';
        if (!moved) {
            var href = drag.getAttribute('href');
            if (href) window.open(href, '_blank');
        }
        drag = null;
        checkOrganized();
    }
    area.addEventListener('mousedown', onDown);
    area.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    area.addEventListener('touchstart', onDown, { passive: false });
    area.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
    cards.forEach(function (c) { c.addEventListener('click', function (e) { e.preventDefault(); }) });
})();