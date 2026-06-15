/**
 * detalhe.js — Lógica da página de detalhes de disciplina
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  // Carrega disciplinas customizadas do localStorage
  loadCustomDisciplines();

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { showNotFound(); return; }

  const disc = (window.disciplinas || []).find(d => d.id === id);
  if (!disc) { showNotFound(); return; }

  renderDetail(disc);
  initCopyLink();
});

/* ── RENDERIZAÇÃO PRINCIPAL ──────────────────────────────── */
function renderDetail(d) {
  // Título da aba
  document.title = `${d.nome.toUpperCase()} — RepoDisciplinas`;

  // Breadcrumb
  document.getElementById('bcArea').textContent = d.area || '—';
  document.getElementById('bcNome').textContent = d.nome.toUpperCase();

  // Badges
  const statusMap = {
    ativo:      { cls: 'badge-status-ativo',   label: 'Ativo' },
    inativo:    { cls: 'badge-status-inativo', label: 'Inativo' },
    revisao:    { cls: 'badge-status-revisao', label: 'Em Revisão' },
    finalizada: { cls: 'badge-status-ativo',   label: 'Finalizada' },
    pendente:   { cls: 'badge-status-revisao', label: 'Pendente' },
    producao:   { cls: 'badge-status-inativo', label: 'Em Produção' }
  };
  const st = statusMap[d.status] || { cls: 'badge-status-inativo', label: d.status || '—' };
  document.getElementById('detailBadges').innerHTML = `
    <span class="badge badge-area">${esc(d.area)}</span>
    ${d.modulo
      ? `<span class="badge badge-periodo">${esc(d.modulo)}</span>`
      : (d.periodo ? `<span class="badge badge-periodo">${esc(d.periodo)}</span>` : '')}
    <span class="badge ${st.cls}">${st.label}</span>
  `;

  // Título e código
  document.getElementById('detailNome').textContent = d.nome.toUpperCase();

  // Botões de link (mesmos do card da página inicial)
  const linkSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
  const waeUrl = isUrl(d.codigo) ? d.codigo : (d.modulo && isUrl(d.periodo) ? d.periodo : '');
  const detailLinkDefs = [
    { label: 'Link Moodle WAE', url: waeUrl },
    { label: 'Link DP WAE',     url: isUrl(d.linkDPWAE)     ? d.linkDPWAE     : '' },
    { label: 'Link Moodle ERP', url: isUrl(d.linkMoodleERP) ? d.linkMoodleERP : '' },
    { label: 'Link DP ERP',     url: isUrl(d.linkDPERP)     ? d.linkDPERP     : '' }
  ].filter(l => l.url);
  document.getElementById('detailCodigo').innerHTML = detailLinkDefs.length
    ? `<div class="card-link-btns">${detailLinkDefs.map(l =>
        `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" class="card-moodle-btn">${linkSVG}${esc(l.label)}</a>`
      ).join('')}</div>`
    : '';

  // Meta row
  const metas = [
    { label: 'DROPBOX',   value: d.cargaHoraria, icon: 'dropbox' },
    { label: 'YOUTUBE',   value: d.periodo, icon: 'youtube' },
    { label: 'SOUNDCLOUD', value: d.professor, icon: 'soundcloud' }
  ].filter(m => m.value);

  document.getElementById('detailMetaRow').innerHTML = metas.map(m => `
    <div class="detail-meta-item">
      <a href="${esc(m.value)}" target="_blank" rel="noopener noreferrer" class="detail-meta-icon ${m.icon}" title="${esc(m.label)}">
        ${getIconSVG(m.icon)}
      </a>
    </div>
  `).join('');

  // Ementa
  showCard('cardEmenta', 'detailEmenta', d.ementa);
  // (Removed sections: Objetivos, Conteúdo Programático, Bibliografia, Observações)

  // Sidebar — Informações
  const infoItems = [
    { label: 'LINK MOODLE',   value: d.codigo, icon: 'moodle', isLink: true },
    { label: 'ÁREA',          value: d.area, isLink: false },
    { label: 'DROPBOX',       value: d.cargaHoraria, icon: 'dropbox', isLink: true },
    { label: 'YOUTUBE',       value: d.periodo, icon: 'youtube', isLink: true },
    { label: 'SOUNDCLOUD',    value: d.professor, icon: 'soundcloud', isLink: true },
    { label: 'STATUS',        value: statusLabel(d.status), isLink: false },
    { label: 'ATUALIZADO EM', value: formatDate(d.updatedAt), isLink: false }
  ].filter(i => i.value);

  document.getElementById('sidebarInfo').innerHTML = infoItems.map(i => `
    <div>
      <div class="sc-item-label">${esc(i.label)}</div>
      <div class="sc-item-value">
        ${i.isLink ? `<a href="${esc(i.value)}" target="_blank" rel="noopener noreferrer" class="sidebar-icon-link ${i.icon}" title="${esc(i.label)}">${getIconSVG(i.icon)}</a>` : esc(i.value)}
      </div>
    </div>
  `).join('');

  // Sidebar — Cursos Relacionados
  if (d.cursos && d.cursos.length) {
    document.getElementById('scCursos').style.display = '';
    document.getElementById('sidebarCursos').innerHTML =
      d.cursos.map(c => `<li><a href="#">${esc(c)}</a></li>`).join('');
  }
}

/* ── COPIAR LINK ─────────────────────────────────────────── */
function initCopyLink() {
  const btn = document.getElementById('copyLinkBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      const original = btn.innerHTML;
      btn.innerHTML = btn.innerHTML.replace('Copiar link', 'Link copiado!');
      setTimeout(() => { btn.innerHTML = original; }, 2000);
    } catch {
      prompt('Copie o link:', window.location.href);
    }
  });
}

/* ── NOT FOUND ───────────────────────────────────────────── */
function showNotFound() {
  document.title = 'Disciplina não encontrada — RepoDisciplinas';
  document.querySelector('main').innerHTML = `
    <div style="max-width:480px;margin:80px auto;text-align:center;padding:0 24px">
      <div class="empty-icon" style="margin:0 auto 16px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p class="empty-title">Disciplina não encontrada</p>
      <p class="empty-sub" style="margin-bottom:24px">O identificador informado não existe ou foi removido.</p>
      <a href="../index.html" style="display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:var(--accent);color:#fff;border-radius:8px;font-weight:600;font-size:14px;">
        ← Voltar à pesquisa
      </a>
    </div>
  `;
}

/* ── TEMA ────────────────────────────────────────────────── */
function initTheme() {
  const saved = localStorage.getItem('repo-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  const sun  = document.getElementById('iconSun');
  const moon = document.getElementById('iconMoon');
  if (saved === 'dark') { sun.style.display = 'none'; moon.style.display = 'block'; }

  document.getElementById('themeToggle').addEventListener('click', () => {
    const cur  = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('repo-theme', next);
    if (next === 'dark') { sun.style.display = 'none'; moon.style.display = 'block'; }
    else                 { sun.style.display = 'block'; moon.style.display = 'none'; }
  });
}

/* ── HELPERS ─────────────────────────────────────────────── */
function showCard(cardId, fieldId, text) {
  if (!text || !text.trim()) return;
  document.getElementById(cardId).style.display = '';
  document.getElementById(fieldId).textContent  = text;
}

function statusLabel(s) {
  return {
    ativo: 'Ativo', inativo: 'Inativo', revisao: 'Em Revisão',
    finalizada: 'Finalizada', pendente: 'Pendente', producao: 'Em Produção'
  }[s] || s;
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return iso; }
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isUrl(s) {
  return Boolean(s && (s.startsWith('http://') || s.startsWith('https://')));
}

/* ── ÍCONES SVG PARA LINKS ──────────────────────────────── */
function getIconSVG(type) {
  const icons = {
    youtube: `<svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>`,
    
    soundcloud: `<svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon">
      <path d="M1.175 12.225c-.051 0-.175.016-.175.175v1.2c0 .159.124.175.175.175.051 0 .175-.016.175-.175v-1.2c0-.159-.124-.175-.175-.175zm1.633 1.751h.35c.059 0 .175-.016.175-.175v-1.533c0-.159-.116-.175-.175-.175h-.35c-.058 0-.174.016-.174.175v1.533c0 .159.116.175.174.175zm1.35-1.751h-.35c-.058 0-.174.016-.174.175v1.2c0 .159.116.175.174.175h.35c.059 0 .175-.016.175-.175v-1.2c0-.159-.116-.175-.175-.175zm1.99 1.751h.35c.059 0 .175-.016.175-.175v-.875c0-.159-.116-.175-.175-.175h-.35c-.059 0-.175.016-.175.175v.875c0 .159.116.175.175.175zm1.35-1.751h-.35c-.059 0-.175.016-.175.175v1.2c0 .159.116.175.175.175h.35c.058 0 .174-.016.174-.175v-1.2c0-.159-.116-.175-.174-.175zm1.99 1.751h.35c.058 0 .174-.016.174-.175v-.525c0-.159-.116-.175-.175-.175h-.35c-.058 0-.174.016-.174.175v.525c0 .159.116.175.175.175zm1.35-1.751h-.35c-.059 0-.175.016-.175.175v1.2c0 .159.116.175.175.175h.35c.059 0 .175-.016.175-.175v-1.2c0-.159-.116-.175-.175-.175zm2.158 2.066c1.453-.607 2.515-2.068 2.515-3.766 0-2.262-1.884-4.105-4.205-4.105-.276 0-.554.025-.816.074-.165-2.565-2.4-4.609-5.135-4.609-2.858 0-5.197 2.287-5.197 5.141 0 .347.037.684.104 1.016C1.306 8.93 0 10.834 0 13.008c0 2.509 2.079 4.547 4.647 4.547h13.205c1.913 0 3.461-1.565 3.461-3.5 0-1.763-1.252-3.236-2.897-3.528z"/>
    </svg>`,
    
    dropbox: `<svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon">
      <path d="M6 2l6 4.5L6 11V2zm6 4.5l6-4.5v8.5l-6 4.5-6-4.5 6-4.5zm6-4.5v8.5l-6 4.5 6 4.5 6-4.5V2l-6 4.5zm-12 9l6 4.5v8.5l-6-4.5v-4.5zm6 4.5l6 4.5 6-4.5-6-4.5-6 4.5z"/>
    </svg>`,
    
    moodle: `<svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>`
  };
  return icons[type] || icons.moodle;
}


/* ── CARREGAR DISCIPLINAS CUSTOMIZADAS ──────────────────── */
function loadCustomDisciplines() {
  // Carrega disciplinas customizadas do localStorage
  const stored = localStorage.getItem('customDisciplines');
  if (stored) {
    try {
      const custom = JSON.parse(stored);
      // Remove duplicatas (evita adicionar as mesmas disciplinas customizadas 2x)
      custom.forEach(cd => {
        if (!window.disciplinas.some(d => d.id === cd.id)) {
          window.disciplinas.push(cd);
        }
      });
    } catch (e) {
      console.error('Erro ao carregar disciplinas customizadas:', e);
    }
  }
}
