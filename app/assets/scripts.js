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
    cards.forEach(function (c, i) {
        var col = i % cols, row = Math.floor(i / cols);
        var x = startX + col * (cardW + gapX) + (Math.random() * 30 - 15);
        var y = row * (cardH + gapY + 20) + 20 + (Math.random() * 20 - 10);
        var rot = (Math.random() * 6 - 3);
        c.style.left = x + 'px';
        c.style.top = y + 'px';
        c.style.transform = 'rotate(' + rot + 'deg)';
        c.dataset.rot = rot;
    });
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
    }
    area.addEventListener('mousedown', onDown);
    area.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    area.addEventListener('touchstart', onDown, { passive: false });
    area.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
    cards.forEach(function (c) { c.addEventListener('click', function (e) { e.preventDefault(); }) });
})();