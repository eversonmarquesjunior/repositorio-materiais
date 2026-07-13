/**
 * app.js — Lógica da página inicial (pesquisa de disciplinas)
 */

/* ── ESTADO ─────────────────────────────────────────────── */
const PAGE_SIZE = 10;

const state = {
  query:         '',
  sort:          'nome',
  viewMode:      'list',
  results:       [],
  visibleCount:  PAGE_SIZE,
  filterModelo:  [],
  filterTipo:    [],
  filterStatus:  [],
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
const loadMoreWrap   = document.getElementById('loadMoreWrap');
const loadMoreBtn    = document.getElementById('loadMoreBtn');

/* ── INICIALIZAÇÃO ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await loadDisciplinas();
  renderEmptyStats();
  restoreFromURL();
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  // Event listeners
  searchInput.addEventListener('input', onSearchInput);
  searchForm.addEventListener('submit', e => e.preventDefault());
  clearBtn.addEventListener('click', clearSearch);
  sortSelect.addEventListener('change', onSortChange);
  viewListBtn.addEventListener('click', () => setView('list'));
  viewGridBtn.addEventListener('click', () => setView('grid'));
  document.getElementById('clearFiltersBtn')?.addEventListener('click', clearAllFilters);
  document.getElementById('clearAllFiltersBtn')?.addEventListener('click', clearAllFilters);
  loadMoreBtn?.addEventListener('click', loadMoreResults);
  initMultiFilters();
  initQuickChips();
});

/* ── CHIPS "POPULARES" (atalho para filtro de Modelo) ───── */
function initQuickChips() {
  document.querySelectorAll('.qf-btn[data-modelo]').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.modelo;
      const panel = document.getElementById('msModeloPanel');
      const cb = panel && Array.from(panel.querySelectorAll('input[type="checkbox"]')).find(c => c.value === val);
      if (!cb) return;
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event('change'));
      chip.classList.toggle('active', cb.checked);
    });
  });
}

/* ── FILTROS MULTI-SELECT ────────────────────────────────── */
function hasActiveFilters() {
  return !!(state.filterModelo.length || state.filterTipo.length || state.filterStatus.length);
}

function initMultiFilters() {
  initMultiSelect('msModeloBtn', 'msModeloPanel', 'msModeloLabel', 'Modelo',           'filterModelo');
  initMultiSelect('msTipoBtn',   'msTipoPanel',   'msTipoLabel',   'Tipo de Disciplina','filterTipo');
  initMultiSelect('msStatusBtn', 'msStatusPanel', 'msStatusLabel', 'Status',            'filterStatus');

  document.addEventListener('click', () => closeAllMultiSelects());
}

function initMultiSelect(btnId, panelId, labelId, placeholder, stateKey) {
  const btn   = document.getElementById(btnId);
  const panel = document.getElementById(panelId);
  const label = document.getElementById(labelId);
  if (!btn || !panel) return;

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = panel.classList.contains('ms-open');
    closeAllMultiSelects();
    if (!isOpen) { panel.classList.add('ms-open'); btn.classList.add('ms-open'); }
  });

  panel.addEventListener('click', e => e.stopPropagation());

  panel.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const vals = Array.from(panel.querySelectorAll('input:checked')).map(c => c.value);
      state[stateKey] = vals;
      if (!vals.length) {
        label.textContent = placeholder;
      } else if (vals.length === 1) {
        label.textContent = cb.closest('.ms-option').textContent.trim();
      } else {
        label.textContent = `${placeholder} (${vals.length})`;
      }
      btn.classList.toggle('filter-active', vals.length > 0);
      if (state.query.length >= 2 || hasActiveFilters()) runSearch();
      else showEmpty();
    });
  });
}

function closeAllMultiSelects() {
  document.querySelectorAll('.ms-panel').forEach(p => p.classList.remove('ms-open'));
  document.querySelectorAll('.ms-btn').forEach(b => b.classList.remove('ms-open'));
}

/* ── BUSCA ───────────────────────────────────────────────── */
function onSearchInput() {
  state.query = searchInput.value.trim();
  clearBtn.style.display = state.query ? 'flex' : 'none';
  if (searchTimeout) clearTimeout(searchTimeout);

  if (state.query.length >= 2 || hasActiveFilters()) {
    searchTimeout = setTimeout(runSearch, 180);
  } else if (!state.query && !hasActiveFilters()) {
    showEmpty();
  } else {
    hideAll();
  }
}

function clearSearch() {
  searchInput.value = '';
  state.query = '';
  clearBtn.style.display = 'none';
  if (searchTimeout) { clearTimeout(searchTimeout); searchTimeout = null; }
  searchInput.focus();
  if (hasActiveFilters()) runSearch();
  else showEmpty();
}

function clearAllFilters() {
  state.query = '';
  state.filterModelo = [];
  state.filterTipo = [];
  state.filterStatus = [];
  if (searchTimeout) { clearTimeout(searchTimeout); searchTimeout = null; }
  searchInput.value = '';
  clearBtn.style.display = 'none';

  document.querySelectorAll('.ms-panel input[type="checkbox"]').forEach(cb => { cb.checked = false; });
  document.getElementById('msModeloLabel').textContent = 'Modelo';
  document.getElementById('msTipoLabel').textContent = 'Tipo de Disciplina';
  document.getElementById('msStatusLabel').textContent = 'Status';
  document.querySelectorAll('.ms-btn').forEach(b => b.classList.remove('filter-active'));
  document.querySelectorAll('.qf-btn[data-modelo]').forEach(b => b.classList.remove('active'));

  showEmpty();
  updateURL();
}

function runSearch() {
  if (searchTimeout) { clearTimeout(searchTimeout); searchTimeout = null; }
  state.query = searchInput.value.trim();
  if (!state.query && !hasActiveFilters()) {
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
function matchesStatus(dbStatus, filterVal) {
  if (!dbStatus) return false;
  if (dbStatus === filterVal) return true;
  if (filterVal === 'antiga' && (dbStatus.startsWith('Disciplina Origem') || dbStatus.startsWith('Disciplina Antiga'))) return true;
  return false;
}

function filterAndSort() {
  const q = normalizeStr(state.query);

  let list = window.disciplinas.filter(d => {
    const matchModelo = !state.filterModelo.length || state.filterModelo.some(f => d.modelo && d.modelo.split(',').map(s => s.trim()).includes(f));
    const matchTipo   = !state.filterTipo.length   || state.filterTipo.includes(d.tipo_disciplina);
    const matchStatus = !state.filterStatus.length  || state.filterStatus.some(f => matchesStatus(d.status, f));
    const matchQuery  = !q || normalizeStr(d.nome).includes(q);
    return matchModelo && matchTipo && matchStatus && matchQuery;
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

  state.visibleCount = Math.min(PAGE_SIZE, state.results.length);
  resultsList.innerHTML = state.results.slice(0, state.visibleCount).map(d => cardHTML(d)).join('');
  animateCardsIn(document.querySelectorAll('.disc-card'));
  updateLoadMoreButton();
}

function loadMoreResults() {
  const nextBatch = state.results.slice(state.visibleCount, state.visibleCount + PAGE_SIZE);
  if (!nextBatch.length) return;

  state.visibleCount += nextBatch.length;
  resultsList.insertAdjacentHTML('beforeend', nextBatch.map(d => cardHTML(d)).join(''));

  const allCards = document.querySelectorAll('.disc-card');
  animateCardsIn(Array.from(allCards).slice(-nextBatch.length));
  updateLoadMoreButton();
}

function updateLoadMoreButton() {
  loadMoreWrap.style.display = state.visibleCount < state.results.length ? 'flex' : 'none';
}

// animação de entrada escalonada
function animateCardsIn(cards) {
  requestAnimationFrame(() => {
    cards.forEach((el, i) => {
      el.style.animationDelay = `${i * 55}ms`;
      el.classList.add('card-entering');
      el.addEventListener('animationend', () => {
        el.classList.remove('card-entering');
        el.style.animationDelay = '';
      }, { once: true });
    });
  });
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
    comum:        '<span class="badge badge-status-ativo">Disciplina Comum</span>',
    atualizacao:  '<span class="badge badge-status-revisao">Atualização do Zero</span>',
    paliativa:    '<span class="badge badge-status-revisao">Disciplina Paliativa</span>',
    antiga:       '<span class="badge badge-status-inativo">Disciplina Origem Grad.</span>',
  };
  const statusLabel = statusBadges[d.status]
    || (d.status ? `<span class="badge badge-status-inativo">${esc(d.status)}</span>` : '');

  const tipoMap = {
    ace:                 'Ace',
    estagio:             'Estágio',
    padrao_unificada:    'Padrão Unificada',
    projeto_integrador:  'Projeto Integrador',
    pratica_conectada:   'Prática Conectada',
    introducao_ao_curso: 'Introdução ao Curso',
    pap:                 'Proj. em Amb. Prof.',
    outro:               'Outro',
  };
  const tipoBadge = tipoMap[d.tipo_disciplina]
    ? `<span class="badge badge-periodo">${esc(tipoMap[d.tipo_disciplina])}</span>`
    : (d.tipo_disciplina ? `<span class="badge badge-periodo">${esc(d.tipo_disciplina)}</span>` : '');

  // Seta usada no botão "Informações da Disciplina"
  const pillArrow = `<svg viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg" class="link-pill__icon-svg" width="10"><path d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z" fill="currentColor"/></svg><svg viewBox="0 0 14 15" fill="none" width="10" xmlns="http://www.w3.org/2000/svg" class="link-pill__icon-svg link-pill__icon-svg--copy"><path d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z" fill="currentColor"/></svg>`;

  const cardUrl = d._isTest ? null : `pages/disciplina.html?id=${esc(d.id)}`;

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
        ${!d._isTest ? `<a href="${cardUrl}" target="_blank" rel="noopener noreferrer" class="card-moodle-btn card-info-btn" onclick="event.stopPropagation()"><span class="link-pill__icon-wrapper">${pillArrow}</span>Informações da Disciplina</a>` : ''}
      </div>
      <div class="card-right">
        <div class="card-badges">
          ${d.modelo ? d.modelo.split(',').map(m => { const v = m.trim(); return v === 'Graduação & Pós' ? `<span class="badge badge-area-grad-pos"><span class="badge-grad-text">${esc(v)}</span></span>` : `<span class="badge badge-area">${esc(v)}</span>`; }).join('') : ''}
          ${tipoBadge}
          ${statusLabel}
          ${d._isTest ? '<span class="badge badge-test">TESTE</span>' : ''}
          ${d.plano_ensino_url ? `<span class="badge-plano-row"><span class="badge badge-plano-ensino">Plano de Ensino<svg class="badge-plano-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="10" height="10"><path d="M20 6L9 17l-5-5"/></svg></span></span>` : ''}
        </div>
        ${mesmoMaterialBadge(d)}
      </div>
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
  loadMoreWrap.style.display = 'none';
}
function showEmpty()   { hideAll(); emptyState.style.display = 'flex'; }

function countByModelo(list, modelo) {
  return list.filter(d => d.modelo && d.modelo.split(',').map(s => s.trim()).includes(modelo)).length;
}

function renderEmptyStats() {
  const el = document.getElementById('emptyStatsGrid');
  if (!el) return;
  const list = window.disciplinas || [];
  if (!list.length) { el.innerHTML = ''; return; }

  const stats = [
    { label: 'Total de Disciplinas', value: list.length },
    { label: 'Graduação',        value: countByModelo(list, 'Graduação') },
    { label: 'Pós-graduação',    value: countByModelo(list, 'Pós-graduação') },
    { label: 'Graduação & Pós',  value: countByModelo(list, 'Graduação & Pós') },
    { label: 'Curso Inova',      value: countByModelo(list, 'Curso Inova') },
  ].filter(s => s.value > 0);

  const cards = stats.map(s => `
    <div class="stat-card stat-card--highlight">
      <span class="stat-number" data-count-to="${s.value}">0</span>
      <span class="stat-label">${esc(s.label)}</span>
    </div>
  `);

  el.innerHTML = cards.join('');

  // Entrada escalonada dos cards
  el.querySelectorAll(':scope > *').forEach((card, i) => {
    card.classList.add('stat-anim-in');
    card.style.animationDelay = `${i * 160}ms`;
  });

  animateStatCounts(el);
}

/* Anima os números dos cards de 0 até o valor final */
function animateStatCounts(container) {
  const numbers = container.querySelectorAll('.stat-number[data-count-to]');
  const duration = 1000;

  numbers.forEach(numEl => {
    const target = parseInt(numEl.dataset.countTo, 10) || 0;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      numEl.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}
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
