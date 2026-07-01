/**
 * mascot.js — Mascote que aparece de tempos em tempos, "fuça" perto de
 * elementos da tela por um instante e some — só descontração, sem função.
 */
(function () {
  const SIZE = 48;

  const mascot = document.createElement('div');
  mascot.id = 'siteMascot';
  mascot.innerHTML = `
    <svg viewBox="0 0 64 64" width="${SIZE}" height="${SIZE}">
      <defs>
        <linearGradient id="mascotGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#22d3ee"/>
          <stop offset="100%" stop-color="#0891b2"/>
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="58" rx="14" ry="4" fill="rgba(0,0,0,0.15)"/>
      <ellipse cx="14" cy="46" rx="4.5" ry="5.5" fill="url(#mascotGrad)"/>
      <ellipse cx="50" cy="46" rx="4.5" ry="5.5" fill="url(#mascotGrad)"/>
      <path d="M32 8c14 0 22 10 22 24 0 12-8 20-22 20S10 44 10 32C10 18 18 8 32 8z" fill="url(#mascotGrad)"/>
      <ellipse cx="22" cy="30" rx="6.5" ry="7.5" fill="#fff"/>
      <ellipse cx="42" cy="30" rx="6.5" ry="7.5" fill="#fff"/>
      <circle class="mascot-pupil" cx="23" cy="31" r="2.8" fill="#0f172a"/>
      <circle class="mascot-pupil" cx="43" cy="31" r="2.8" fill="#0f172a"/>
      <circle cx="21.3" cy="29.3" r="0.9" fill="#fff"/>
      <circle cx="41.3" cy="29.3" r="0.9" fill="#fff"/>
      <path d="M24 42q8 6 16 0" stroke="#0f172a" stroke-width="2" fill="none" stroke-linecap="round"/>
      <g transform="translate(36 42) rotate(-14)">
        <rect x="0" y="0" width="15" height="11" rx="1.5" fill="#fff" stroke="#0891b2" stroke-width="1.5"/>
        <line x1="7.5" y1="0" x2="7.5" y2="11" stroke="#0891b2" stroke-width="1.2"/>
      </g>
    </svg>
  `;
  document.body.appendChild(mascot);
  mascot.style.opacity = '0';

  /* ── REAÇÃO AO CLIQUE (desativado — ideia futura: usar o mascote como
     ponto de entrada de um assistente IA) ────────────────────────────
  const PHRASES = [
    'Já estudou hoje?',
    'Procurando alguma disciplina?',
    'Psst... tem plano de ensino pra revisar!',
    'Bora organizar essas ementas?',
  ];

  mascot.style.pointerEvents = 'auto';
  mascot.style.cursor = 'pointer';

  const bubble = document.createElement('div');
  bubble.id = 'mascotBubble';
  document.body.appendChild(bubble);

  mascot.addEventListener('click', () => {
    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    bubble.textContent = phrase;
    bubble.style.left = mascot.style.transform ? `${x}px` : '0px';
    bubble.style.top = `${y - SIZE}px`;
    bubble.classList.add('mascot-bubble--show');
    clearTimeout(bubble._hideTimeout);
    bubble._hideTimeout = setTimeout(() => bubble.classList.remove('mascot-bubble--show'), 2200);
  });
  */

  let x = 0, y = 0, targetX = 0, targetY = 0;
  let facingLeft = false;
  let visible = false;

  function randomSpot() {
    const candidates = Array.from(
      document.querySelectorAll('.disc-card, .stat-card, .export-btn, .nav-link, .book')
    ).filter(el => el.offsetParent !== null);

    if (candidates.length) {
      const el = candidates[Math.floor(Math.random() * candidates.length)];
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width * Math.random(), y: r.top + r.height * Math.random() };
    }
    return {
      x: 60 + Math.random() * (window.innerWidth - 120),
      y: 120 + Math.random() * (window.innerHeight - 240),
    };
  }

  function moveLoop() {
    const dx = targetX - x;
    const dy = targetY - y;
    if (Math.abs(dx) > 1) facingLeft = dx < 0;
    x += dx * 0.06;
    y += dy * 0.06;
    mascot.style.transform = `translate(${x - SIZE / 2}px, ${y - SIZE / 2}px) scaleX(${facingLeft ? -1 : 1})`;
    requestAnimationFrame(moveLoop);
  }
  requestAnimationFrame(moveLoop);

  function appear() {
    if (visible) return;
    visible = true;

    const first = randomSpot();
    const fromLeft = first.x > window.innerWidth / 2;
    x = fromLeft ? window.innerWidth + SIZE : -SIZE;
    y = first.y;
    targetX = x;
    targetY = y;

    mascot.style.opacity = '1';
    requestAnimationFrame(() => { targetX = first.x; targetY = first.y; });

    const stops = 2 + Math.floor(Math.random() * 2);
    let i = 0;
    function nextStop() {
      i++;
      if (i >= stops) { setTimeout(leave, 1600); return; }
      const p = randomSpot();
      targetX = p.x;
      targetY = p.y;
      setTimeout(nextStop, 1800 + Math.random() * 1400);
    }
    setTimeout(nextStop, 1800 + Math.random() * 1400);
  }

  function leave() {
    targetX = facingLeft ? -SIZE : window.innerWidth + SIZE;
    setTimeout(() => {
      mascot.style.opacity = '0';
      visible = false;
      scheduleNext();
    }, 1200);
  }

  function scheduleNext() {
    const delay = 15000 + Math.random() * 25000; // 15–40s
    setTimeout(appear, delay);
  }

  // Mascote em stand-by: descomente a linha abaixo para reativá-lo.
  // scheduleNext();
})();
