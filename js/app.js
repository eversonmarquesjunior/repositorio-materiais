/**
 * app.js — Lógica da página inicial (pesquisa de disciplinas)
 */

/* ── ESTADO ─────────────────────────────────────────────── */
const state = {
  query:    '',
  sort:     'nome',
  viewMode: 'list',   // 'list' | 'grid'
  results:  []
};

let searchTimeout = null;

/* ── REFS DOM ────────────────────────────────────────────── */
const searchInput    = document.getElementById('searchInput');
const searchForm     = document.getElementById('searchForm');
const clearBtn       = document.getElementById('clearBtn');
const resultsList    = document.getElementById('resultsList');
const resultsToolbar = document.getElementById('resultsToolbar');
const resultsCount   = document.getElementById('resultsCount');
const emptyState     = document.getElementById('emptyState');
const noResults      = document.getElementById('noResults');
const loadingState   = document.getElementById('loadingState');
const sortSelect     = document.getElementById('sortSelect');
const viewListBtn    = document.getElementById('viewList');
const viewGridBtn    = document.getElementById('viewGrid');
// quickFilters removed — repository search is name-only

/* ── INICIALIZAÇÃO ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await loadDisciplinas();
  restoreFromURL();
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  // Event listeners
  searchInput.addEventListener('input', onSearchInput);
  searchForm.addEventListener('submit', e => e.preventDefault());
  clearBtn.addEventListener('click', clearSearch);
  sortSelect.addEventListener('change', onSortChange);
  viewListBtn.addEventListener('click', () => setView('list'));
  viewGridBtn.addEventListener('click', () => setView('grid'));
});

/* ── TEMA ────────────────────────────────────────────────── */
function initTheme() {
  document.documentElement.setAttribute('data-theme', 'light');
  localStorage.removeItem('repo-theme');
}

/* ── FILTROS RÁPIDOS (ÁREA) ──────────────────────────────── */
// area filters removed — no quick filter buttons

/* ── BUSCA ───────────────────────────────────────────────── */
function onSearchInput() {
  state.query = searchInput.value.trim();
  clearBtn.style.display = state.query ? 'flex' : 'none';
  if (searchTimeout) clearTimeout(searchTimeout);

  // Only trigger instant search when user typed at least 2 chars.
  if (state.query && state.query.length >= 2) {
    searchTimeout = setTimeout(runSearch, 180);
  } else if (!state.query) {
    showEmpty();
  } else {
    // fewer than 2 chars — don't run search yet, keep results hidden
    hideAll();
  }
}

function clearSearch() {
  searchInput.value = '';
  state.query = '';
  clearBtn.style.display = 'none';
  if (searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
  }
  searchInput.focus();
  showEmpty();
}

function runSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
  }
  state.query = searchInput.value.trim();
  if (!state.query && !state.area) {
    showEmpty();
    return;
  }

  showLoading();

  // Simula latência de rede (remova ao integrar API real)
  setTimeout(() => {
    state.results = filterAndSort();
    renderResults();
    updateURL();
  }, 180);
}

/* ── FILTRO + ORDENAÇÃO ──────────────────────────────────── */
function filterAndSort() {
  const q = normalizeStr(state.query);

  let list = window.disciplinas.filter(d => {
    const matchArea = !state.area || d.modelo === state.area;
    const matchQuery = !q || normalizeStr(d.nome).includes(q);
    return matchArea && matchQuery;
  });

  return sortList(list, state.sort);
}

function sortList(list, by) {
  return [...list].sort((a, b) => {
    switch (by) {
      case 'nome':      return a.nome.localeCompare(b.nome, 'pt-BR');
      case 'nome_desc': return b.nome.localeCompare(a.nome, 'pt-BR');
      case 'link_moodle_wae': return (a.link_moodle_wae || '').localeCompare(b.link_moodle_wae || '', 'pt-BR');
      case 'modelo':    return (a.modelo || '').localeCompare(b.modelo || '', 'pt-BR');
      default:          return 0;
    }
  });
}

function onSortChange() {
  state.sort = sortSelect.value;
  if (state.results.length) {
    state.results = sortList(state.results, state.sort);
    renderResults();
  }
}

/* ── RENDERIZAÇÃO ────────────────────────────────────────── */
function renderResults() {
  hideAll();
  resultsToolbar.style.display = 'flex';
  resultsList.style.display = state.viewMode === 'grid' ? 'grid' : 'flex';

  resultsCount.textContent =
    state.results.length === 1
      ? '1 disciplina encontrada'
      : `${state.results.length} disciplinas encontradas`;

  if (state.results.length === 0) {
    resultsToolbar.style.display = 'none';
    noResults.style.display = 'flex';
    return;
  }

  resultsList.innerHTML = state.results.map(d => cardHTML(d)).join('');

  // animação de entrada escalonada
  requestAnimationFrame(() => {
    document.querySelectorAll('.disc-card').forEach((el, i) => {
      el.style.animationDelay = `${i * 55}ms`;
      el.classList.add('card-entering');
      el.addEventListener('animationend', () => {
        el.classList.remove('card-entering');
        el.style.animationDelay = '';
      }, { once: true });
    });
  });
}

function isUrl(s) {
  return Boolean(s && (s.startsWith('http://') || s.startsWith('https://')));
}

function normalizeStr(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}


function cardIconSVG(type) {
  const icons = {
    moodle: `<svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
    soundcloud: `<svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon"><path d="M1.175 12.225c-.051 0-.175.016-.175.175v1.2c0 .159.124.175.175.175.051 0 .175-.016.175-.175v-1.2c0-.159-.116-.175-.175-.175zm1.633 1.751h.35c.059 0 .175-.016.175-.175v-1.533c0-.159-.116-.175-.175-.175h-.35c-.058 0-.174.016-.174.175v1.533c0 .159.116.175.174.175zm1.35-1.751h-.35c-.058 0-.174.016-.174.175v1.2c0 .159.116.175.174.175h.35c.059 0 .175-.016.175-.175v-1.2c0-.159-.116-.175-.175-.175zm1.99 1.751h.35c.059 0 .175-.016.175-.175v-.875c0-.159-.116-.175-.175-.175h-.35c-.059 0-.175.016-.175.175v.875c0 .159.116.175.175.175zm1.35-1.751h-.35c-.059 0-.175.016-.175.175v1.2c0 .159.116.175.175.175h.35c.058 0 .174-.016.174-.175v-1.2c0-.159-.116-.175-.174-.175zm1.99 1.751h.35c.058 0 .174-.016.174-.175v-.525c0-.159-.116-.175-.175-.175h-.35c-.058 0-.174.016-.174.175v.525c0 .159.116.175.175.175zm1.35-1.751h-.35c-.059 0-.175.016-.175.175v1.2c0 .159.116.175.175.175h.35c.059 0 .175-.016.175-.175v-1.2c0-.159-.116-.175-.175-.175zm2.158 2.066c1.453-.607 2.515-2.068 2.515-3.766 0-2.262-1.884-4.105-4.205-4.105-.276 0-.554.025-.816.074-.165-2.565-2.4-4.609-5.135-4.609-2.858 0-5.197 2.287-5.197 5.141 0 .347.037.684.104 1.016C1.306 8.93 0 10.834 0 13.008c0 2.509 2.079 4.547 4.647 4.547h13.205c1.913 0 3.461-1.565 3.461-3.5 0-1.763-1.252-3.236-2.897-3.528z"/></svg>`,
    dropbox: `<svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon"><path d="M6 2L11 6L6 10L1 6zM18 2L23 6L18 10L13 6zM12 8L17 12L12 16L7 12zM6 14L11 18L6 22L1 18zM18 14L23 18L18 22L13 18z"/></svg>`,
    googledrive: `<svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon"><path d="M7.5 3L1 14.5l3.25 5.5 6.5-11zm9 0H7.5l6.5 11h9zm-9.25 13L4 21.5h16l-3.25-5.5z"/></svg>`,
    sharepoint: `<svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm9.5 4c-1.8 0-2.8.8-2.8 2 0 1 .68 1.7 2.04 2.02l.96.24c.78.18 1.1.48 1.1.96 0 .6-.56 1-1.52 1-.98 0-1.58-.42-1.68-1.16H9.22c.1 1.38 1.14 2.2 3.06 2.2s3.04-.84 3.04-2.12c0-1.04-.66-1.7-2.08-2.04l-.86-.2c-.78-.2-1.1-.48-1.1-.94 0-.58.52-.96 1.36-.96s1.4.4 1.5 1.08h1.28C15.3 9.82 14.3 9 12.5 9z"/></svg>`,
    apostilahtml: `<svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>`
  };
  return icons[type] || icons.moodle;
}

function mesmoMaterialBadge(d) {
  const linkSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
  const all = window.disciplinas || [];

  if (d.disciplina_pai_id) {
    const pai = all.find(x => x.id === d.disciplina_pai_id);
    if (!pai) return '';
    return `<div class="badge-linked-row">${linkSVG}<span>Mesmo material de: <a href="pages/disciplina.html?id=${esc(pai.id)}" class="badge-linked-name" onclick="event.stopPropagation()">${esc(pai.nome)}</a></span></div>`;
  }

  const filhas = all.filter(x => x.disciplina_pai_id === d.id);
  if (!filhas.length) return '';
  const nomes = filhas.map(f =>
    `<a href="pages/disciplina.html?id=${esc(f.id)}" class="badge-linked-name" onclick="event.stopPropagation()">${esc(f.nome)}</a>`
  ).join(', ');
  return `<div class="badge-linked-row">${linkSVG}<span>Mesmo material de: ${nomes}</span></div>`;
}

function cardHTML(d) {
  const statusBadges = {
    ativo:        '<span class="badge badge-status-ativo">Ativo</span>',
    inativo:      '<span class="badge badge-status-inativo">Inativo</span>',
    revisao:      '<span class="badge badge-status-revisao">Em Revisão</span>',
    finalizada:   '<span class="badge badge-status-ativo">Finalizada</span>',
    pendente:     '<span class="badge badge-status-revisao">Pendente</span>',
    producao:     '<span class="badge badge-status-inativo">Em Produção</span>',
    padronizada:  '<span class="badge badge-status-ativo">Disciplina Padronizada</span>',
    atualizacao:  '<span class="badge badge-status-revisao">Atualização do Zero</span>',
    paliativa:    '<span class="badge badge-status-revisao">Disciplina Paliativa</span>',
    antiga:       '<span class="badge badge-status-inativo">Disciplina Antiga</span>',
  };
  const statusLabel = statusBadges[d.status]
    || (d.status ? `<span class="badge badge-status-inativo">${d.status}</span>` : '');

  // Badges direita do nome: área/modelo, módulo, status
  const moduloBadge = d.modulo
    ? `<span class="badge badge-periodo">${esc(d.modulo)}</span>`
    : '';

  // Botões de link: WAE e ERP
  const linkSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
  const waeUrl = isUrl(d.link_moodle_wae) ? d.link_moodle_wae : (d.modulo && isUrl(d.youtube) ? d.youtube : '');
  const linkDefs = [
    { label: 'Link Moodle WAE', url: waeUrl },
    { label: 'Link DP WAE',     url: isUrl(d.link_dp_wae)     ? d.link_dp_wae     : '' },
    { label: 'Link Moodle ERP', url: isUrl(d.link_moodle_erp) ? d.link_moodle_erp : '' },
    { label: 'Link DP ERP',     url: isUrl(d.link_dp_erp)     ? d.link_dp_erp     : '' },
    { label: 'Link Moodle Pós', url: isUrl(d.link_moodle_pos) ? d.link_moodle_pos : '' },
    { label: 'Link Inova',      url: isUrl(d.link_inova)      ? d.link_inova      : '' }
  ].filter(l => l.url);
  const linkBtns = linkDefs.length
    ? `<div class="card-link-btns">${linkDefs.map(l =>
        `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" class="card-moodle-btn" onclick="event.stopPropagation()">${linkSVG}${esc(l.label)}</a>`
      ).join('')}</div>`
    : '';

  // Ícones circulares: Dropbox, Google Drive, YouTube, Soundcloud
  const iconLinks = [
    { value: d.dropbox,      cls: 'dropbox',      title: 'Dropbox' },
    { value: d.google_drive,  cls: 'googledrive',  title: 'Google Drive' },
    { value: d.sharepoint,    cls: 'sharepoint',   title: 'SharePoint' },
    { value: d.apostila_html, cls: 'apostilahtml', title: 'Apostila HTML' },
    { value: d.youtube,      cls: 'youtube',      title: 'YouTube' },
    { value: d.soundcloud,   cls: 'soundcloud',   title: 'Soundcloud' }
  ]
    .filter(l => isUrl(l.value))
    .map(l => `<a href="${esc(l.value)}" target="_blank" rel="noopener noreferrer" class="detail-meta-icon ${l.cls}" title="${l.title}" onclick="event.stopPropagation()">${cardIconSVG(l.cls)}</a>`)
    .join('');

  const cardUrl = `pages/disciplina.html?id=${esc(d.id)}`;

  return `
    <div class="disc-card">
      <div class="card-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
      </div>
      <div class="card-body">
        <span class="card-nome">${esc(d.nome)}</span>
        ${linkBtns}
        <div class="card-footer">
          ${iconLinks}
        </div>
      </div>
      <div class="card-right">
        <div class="card-badges">
          ${d.modelo ? `<span class="badge badge-area">${esc(d.modelo)}</span>` : ''}
          ${moduloBadge}
          ${statusLabel}
        </div>
        ${mesmoMaterialBadge(d)}
      </div>
      <a href="${cardUrl}" target="_blank" rel="noopener noreferrer" class="card-moodle-btn card-info-btn" onclick="event.stopPropagation()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Informações da Disciplina
      </a>
    </div>
  `;
}

/* ── VIEW MODE ───────────────────────────────────────────── */
function setView(mode) {
  state.viewMode = mode;
  if (mode === 'list') {
    viewListBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
    resultsList.className = 'results-list';
  } else {
    viewGridBtn.classList.add('active');
    viewListBtn.classList.remove('active');
    resultsList.className = 'results-list grid-view';
  }
}

/* ── ESTADOS DA UI ───────────────────────────────────────── */
function hideAll() {
  emptyState.style.display   = 'none';
  noResults.style.display    = 'none';
  loadingState.style.display = 'none';
  resultsList.innerHTML      = '';
  resultsList.style.display  = 'none';
  resultsToolbar.style.display = 'none';
}
function showEmpty()   { hideAll(); emptyState.style.display = 'flex'; }
function showLoading() { hideAll(); loadingState.style.display = 'flex'; }

/* ── URL STATE ───────────────────────────────────────────── */
function updateURL() {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  history.replaceState({}, '', '?' + params.toString());
}

function restoreFromURL() {
  const params = new URLSearchParams(window.location.search);
  const q    = params.get('q')    || '';
  if (q) {
    searchInput.value = q;
    state.query = q;
    clearBtn.style.display = 'flex';
  }
  if (q) runSearch();
}


/* ── UTIL ────────────────────────────────────────────────── */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
