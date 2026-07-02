/**
 * bg-particles.js — Textura de fundo em estrelas, repelidas pelo cursor do mouse.
 * Usado no hero azul e na results-section.
 */
(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function createStarField(canvas, opts) {
    if (!canvas) return;
    const section = canvas.parentElement;
    const ctx = canvas.getContext('2d');

    const SPACING        = opts.spacing;
    const STAR_SIZE       = opts.starSize;
    const COLOR           = opts.color;
    const ALPHA           = opts.alpha;
    const REPEL_RADIUS    = opts.repelRadius;
    const REPEL_STRENGTH  = opts.repelStrength;
    const EASE            = opts.ease;

    let dpr = window.devicePixelRatio || 1;
    let width = 0, height = 0;
    let stars = [];
    let mouse = { x: -9999, y: -9999 };

    function buildStars() {
      stars = [];
      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const offset = (r % 2) * (SPACING / 2);
          const ox = c * SPACING + offset;
          const oy = r * SPACING;
          stars.push({ ox, oy, x: ox, y: oy });
        }
      }
    }

    function resize() {
      const rect = section.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    }

    function drawStar(x, y, r) {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i;
        const radius = i % 2 === 0 ? r : r * 0.42;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = `rgba(${COLOR}, ${ALPHA})`;

      for (const s of stars) {
        const dx = s.ox - mouse.x;
        const dy = s.oy - mouse.y;
        const dist = Math.hypot(dx, dy);

        let targetX = s.ox;
        let targetY = s.oy;
        if (dist < REPEL_RADIUS) {
          const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
          const angle = Math.atan2(dy, dx);
          targetX = s.ox + Math.cos(angle) * force;
          targetY = s.oy + Math.sin(angle) * force;
        }

        s.x += (targetX - s.x) * EASE;
        s.y += (targetY - s.y) * EASE;

        drawStar(s.x, s.y, STAR_SIZE);
      }

      requestAnimationFrame(tick);
    }

    const IGNORE_SELECTOR = opts.ignoreSelector ||
      '.disc-card, .stat-card, .book-anim-wrap, .card-moodle-btn, button, a, input, select, label, .badge';

    function onMouseMove(e) {
      const rect = section.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) {
        mouse.x = -9999;
        mouse.y = -9999;
        return;
      }

      const target = document.elementFromPoint(e.clientX, e.clientY);
      const overContent = target && target.closest && target.closest(IGNORE_SELECTOR);
      if (overContent) {
        mouse.x = -9999;
        mouse.y = -9999;
      } else {
        mouse.x = localX;
        mouse.y = localY;
      }
    }
    function onMouseLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', onMouseMove);
    section.addEventListener('mouseleave', onMouseLeave);

    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(section);
    }

    resize();
    if (!prefersReducedMotion) {
      tick();
    } else {
      ctx.fillStyle = `rgba(${COLOR}, ${ALPHA})`;
      stars.forEach(s => drawStar(s.x, s.y, STAR_SIZE));
    }
  }

  createStarField(document.getElementById('bgParticles'), {
    spacing: 42,
    starSize: 5,
    color: '59, 91, 219',   // --accent
    alpha: 0.28,
    repelRadius: 90,
    repelStrength: 34,
    ease: 0.14,
  });
})();
