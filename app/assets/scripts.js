(function () {
    var cards = document.querySelectorAll('.project-card');
    var area = document.querySelector('.projects');
    var rect = area.getBoundingClientRect();
    var isMobile = rect.width <= 640;
    var gapX = 20, gapY = 20;
    var cardW = isMobile ? 280 : 340;
    var cardH = 200;
    var cols = Math.min(cards.length, Math.floor(rect.width / (cardW + gapX)) || 1);
    var startX;
    cols = Math.min(cols, 2);
    var totalW = cols * cardW + (cols - 1) * gapX;
    startX = (rect.width - totalW) / 2;
    var totalRows = Math.ceil(cards.length / cols);
    var areaHeight = totalRows * (cardH + gapY + 20) + 40;
    area.style.height = areaHeight + 'px';

    // Earthquake persistence state
    var quakeState = sessionStorage.getItem('quakeState'); // null | 'quaked' | 'reloaded_once'

    // If second reload after earthquake, clear state and mark game as done
    if (quakeState === 'reloaded_once') {
        sessionStorage.removeItem('quakeState');
        sessionStorage.setItem('quakeDone', '1');
        quakeState = null;
    }

    var quakeDone = sessionStorage.getItem('quakeDone') === '1';

    // Store organized positions
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

    // Earthquake state
    var quaked = false;
    var quakeMsg = document.createElement('div');
    quakeMsg.className = 'quake-msg';
    quakeMsg.innerHTML = '🫨 Oops! Your cursor caused an earthquake — drag the cards to put them back!';
    quakeMsg.style.display = 'none';
    area.parentNode.insertBefore(quakeMsg, area);

    // Handle first reload after earthquake — show taunt message and re-scatter
    if (quakeState === 'quaked') {
        sessionStorage.setItem('quakeState', 'reloaded_once');
        quaked = true;
        quakeMsg.innerHTML = '😏 Nice try! Reload once more to end the fun — or stay and play.';
        quakeMsg.style.display = 'block';
        // Re-scatter cards immediately (no animation needed, just place them randomly)
        cards.forEach(function (c) {
            var maxX = rect.width - cardW;
            var maxY = parseFloat(area.style.height) - cardH;
            var rx = Math.random() * maxX;
            var ry = Math.random() * maxY;
            var rr = (Math.random() * 30 - 15);
            c.style.left = rx + 'px';
            c.style.top = ry + 'px';
            c.style.transform = 'rotate(' + rr + 'deg)';
            c.dataset.rot = rr;
        });
    }

    function triggerQuake() {
        if (quaked) return;
        quaked = true;
        sessionStorage.setItem('quakeState', 'quaked');
        quakeMsg.style.display = 'block';
        // Shake the area
        area.classList.add('quake-shake');
        setTimeout(function () { area.classList.remove('quake-shake'); }, 600);

        // Scatter cards to random positions with wild rotations
        cards.forEach(function (c) {
            var maxX = rect.width - cardW;
            var maxY = parseFloat(area.style.height) - cardH;
            var rx = Math.random() * maxX;
            var ry = Math.random() * maxY;
            var rr = (Math.random() * 30 - 15);
            c.style.transition = 'left 0.5s cubic-bezier(0.22,1,0.36,1), top 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)';
            c.style.left = rx + 'px';
            c.style.top = ry + 'px';
            c.style.transform = 'rotate(' + rr + 'deg)';
            c.dataset.rot = rr;
            setTimeout(function() { c.style.transition = ''; }, 550);
        });
    }

    if (!quakeDone) {
        area.addEventListener('mouseenter', triggerQuake);
        area.addEventListener('touchstart', function () { triggerQuake(); }, { passive: true, once: true });
    }

    // Check if all cards are roughly in their organized spots
    function checkOrganized() {
        if (!quaked) return;
        var allGood = true;
        cards.forEach(function (c, i) {
            var cx = parseFloat(c.style.left);
            var cy = parseFloat(c.style.top);
            var dx = Math.abs(cx - positions[i].x);
            var dy = Math.abs(cy - positions[i].y);
            if (dx > 50 || dy > 50) allGood = false;
        });
        if (allGood) {
            sessionStorage.removeItem('quakeState');
            sessionStorage.setItem('quakeDone', '1');
            quakeMsg.innerHTML = '✨ Nice work! Everything is back in order.';
            quakeMsg.classList.add('quake-msg-success');
            setTimeout(function () {
                quakeMsg.style.display = 'none';
                quakeMsg.classList.remove('quake-msg-success');
            }, 2500);
        }
    }

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