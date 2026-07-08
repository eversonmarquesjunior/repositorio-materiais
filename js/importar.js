/**
 * importar.js — Importação de disciplinas via CSV
 */

const LS_KEY      = 'repo_import_preview';
const PREVIEW_MAX = 50;

// Mapeamento: campo do banco → possíveis nomes de coluna no CSV
const COL_MAP = {
  nome:            ['nome disc', 'nome da disciplina', 'nome disciplina', 'nome'],
  link_moodle_wae: ['link moodle wae', 'moodle wae', 'link moodle'],
  link_dp_wae:     ['link dp wae', 'dp wae'],
  link_moodle_erp: ['link moodle erp', 'moodle erp'],
  link_dp_erp:     ['link dp erp', 'dp erp'],
  link_moodle_pos: ['link padrao', 'link moodle pos', 'link moodle pós', 'link padrao moodle'],
  link_inova:      ['link inova', 'inova'],
  dropbox:         ['link dropbox', 'dropbox'],
  google_drive:    ['link google drive', 'link drive', 'google drive', 'drive'],
  sharepoint:      ['link sharepoint', 'sharepoint'],
  apostila_html:   ['apostila html', 'link apostila html', 'html'],
  youtube:         ['link youtube', 'youtube'],
  soundcloud:      ['link soundcloud', 'soundcloud'],
  plano_ensino_url: ['plano de ensino', 'link plano de ensino', 'plano ensino'],
  obs:             ['observacao', 'obs', 'observação'],
};

const COL_LABELS = {
  nome:            'Nome da Disciplina',
  link_moodle_wae: 'Moodle WAE',
  link_dp_wae:     'DP WAE',
  link_moodle_erp: 'Moodle ERP',
  link_dp_erp:     'DP ERP',
  link_moodle_pos: 'Moodle Pós',
  link_inova:      'Inova',
  dropbox:         'Dropbox',
  google_drive:    'Google Drive',
  sharepoint:      'SharePoint',
  apostila_html:   'Apostila HTML',
  youtube:         'YouTube',
  soundcloud:      'SoundCloud',
  plano_ensino_url: 'Plano de Ensino',
  obs:             'Observação',
};

/* ── ESTADO ────────────────────────────────────────────────── */
let parsedRows        = [];
let currentMode       = 'import';
let updateRows        = [];
let dbDisciplinas     = null;
let detectedLinkFields = [];

const UPDATE_FIELDS = ['dropbox', 'youtube', 'soundcloud', 'apostila_html', 'plano_ensino_url'];

/* ── INIT ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footerYear').textContent = new Date().getFullYear();
  refreshTestBanner();

  const zone   = document.getElementById('uploadZone');
  const fileIn = document.getElementById('csvFile');

  zone.addEventListener('click', () => fileIn.click());
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  });
  fileIn.addEventListener('change', () => {
    if (fileIn.files[0]) processFile(fileIn.files[0]);
  });

  document.getElementById('btnSaveTeste').addEventListener('click',    saveForTest);
  document.getElementById('btnImportarReal').addEventListener('click', confirmImportReal);
  document.getElementById('btnLimparTeste').addEventListener('click',  clearTestData);
  document.getElementById('tabImportar').addEventListener('click',     () => setMode('import'));
  document.getElementById('tabAtualizar').addEventListener('click',    () => setMode('update'));
  document.getElementById('btnRunUpdate').addEventListener('click',    confirmRunUpdate);
});

/* ── BANNER DE TESTE ────────────────────────────────────────── */
function refreshTestBanner() {
  const items = getStoredTest();
  const card  = document.getElementById('testActiveCard');
  if (items.length) {
    card.style.display = '';
    document.getElementById('testActiveCount').textContent = items.length;
  } else {
    card.style.display = 'none';
  }
}

function getStoredTest() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}

function clearTestData() {
  localStorage.removeItem(LS_KEY);
  refreshTestBanner();
  showToast('Dados de teste removidos com sucesso.', 'success');
}

/* ── TROCA DE MODO ──────────────────────────────────────────── */
function setMode(mode) {
  currentMode = mode;
  document.getElementById('tabImportar').classList.toggle('active', mode === 'import');
  document.getElementById('tabAtualizar').classList.toggle('active', mode === 'update');

  const modeloGroup = document.getElementById('modeloSelect').closest('.form-group');
  modeloGroup.style.display = mode === 'import' ? '' : 'none';

  parsedRows = [];
  updateRows = [];
  document.getElementById('previewBox').style.display        = 'none';
  document.getElementById('actionsBox').style.display        = 'none';
  document.getElementById('actionsUpdateBox').style.display  = 'none';
  document.getElementById('fileChosen').style.display        = 'none';
  document.getElementById('csvFile').value = '';

  const wrap = document.querySelector('.preview-table-wrap');
  wrap.style.maxHeight = '';
  wrap.style.overflowY = '';
}

/* ── LEITURA E PARSE DO CSV ─────────────────────────────────── */
function processFile(file) {
  const chosen = document.getElementById('fileChosen');
  chosen.textContent = file.name;
  chosen.style.display = '';

  const reader = new FileReader();
  reader.onload = e => {
    const buf = e.target.result;
    // Tenta UTF-8; se tiver caracteres quebrados, usa Windows-1252
    let text = new TextDecoder('utf-8').decode(buf);
    if (text.includes('�')) text = new TextDecoder('windows-1252').decode(buf);

    if (currentMode === 'update') {
      processFileForUpdate(text);
    } else {
      const { headers, dataRows } = parseCSV(text);
      const result = mapRows(headers, dataRows);
      parsedRows = result.valid;
      renderPreview(result, headers);
    }
  };
  reader.readAsArrayBuffer(file);
}

function parseCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // remove BOM

  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { headers: [], dataRows: [] };

  const first = lines[0];
  const counts = {
    ',':  (first.match(/,/g)  || []).length,
    ';':  (first.match(/;/g)  || []).length,
    '\t': (first.match(/\t/g) || []).length,
  };
  const sep = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

  const parseRow = line => {
    const cells = [];
    let inQ = false, cell = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cell += '"'; i++; }
        else inQ = !inQ;
      } else if (c === sep && !inQ) {
        cells.push(cell.trim()); cell = '';
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  return { headers: parseRow(lines[0]), dataRows: lines.slice(1).map(parseRow) };
}

function normH(h) {
  return String(h || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function findCol(headers, candidates) {
  const norm = headers.map(normH);
  for (const c of candidates) {
    const nc = normH(c);
    const i  = norm.findIndex(h => h === nc || h.includes(nc));
    if (i !== -1) return i;
  }
  return -1;
}

function getModelo() {
  const sel = document.getElementById('modeloSelect');
  return sel ? sel.value : 'Pós-graduação';
}

function isUrl(v) {
  return v && (v.startsWith('http://') || v.startsWith('https://'));
}

function mapRows(headers, dataRows) {
  const detected = {};
  for (const [field, candidates] of Object.entries(COL_MAP)) {
    const idx = findCol(headers, candidates);
    if (idx >= 0) detected[field] = idx;
  }

  const valid = [], skipped = [];
  const now = new Date().toISOString();
  const modelo = getModelo();

  dataRows.forEach((row, i) => {
    const nome = ((detected.nome !== undefined ? row[detected.nome] : '') || '').trim();
    if (!nome) { skipped.push({ reason: 'Nome vazio' }); return; }

    const obj = {
      id: '_test_' + Date.now() + '_' + i,
      nome,
      modelo,
      _isTest: true,
      created_at: now,
      updated_at: now,
    };

    for (const [field, idx] of Object.entries(detected)) {
      if (field === 'nome') continue;
      const val = (row[idx] || '').trim();
      if (field === 'obs') { if (val) obj[field] = val; }
      else { if (isUrl(val)) obj[field] = val; }
    }

    valid.push(obj);
  });

  return { detected, valid, skipped };
}

/* ── RENDER PREVIEW ──────────────────────────────────────────── */
function renderPreview({ detected, valid, skipped }, headers) {
  const previewBox  = document.getElementById('previewBox');
  const actionsBox  = document.getElementById('actionsBox');
  const mappingInfo = document.getElementById('mappingInfo');
  const statsRow    = document.getElementById('statsRow');
  const previewWrap = document.getElementById('previewWrap');
  const previewHead = document.getElementById('previewHead');
  const previewBody = document.getElementById('previewBody');
  const previewMore = document.getElementById('previewMore');

  previewBox.style.display = '';
  actionsBox.style.display = valid.length ? '' : 'none';

  const temNome   = 'nome' in detected;
  const detFields = Object.keys(detected);

  mappingInfo.className = 'mapping-info' + (temNome ? '' : ' warn');

  if (temNome) {
    const linhas = detFields.map(f =>
      '<span><strong>' + (COL_LABELS[f] || f) + ':</strong> coluna "' + esc(headers[detected[f]]) + '"</span>'
    );
    linhas.push('<span><strong>Modelo:</strong> ' + esc(getModelo()) + '</span>');
    mappingInfo.innerHTML = linhas.join('');
  } else {
    const headersLidos = headers.map((h, i) => i + ': "' + h + '"').join(' | ');
    mappingInfo.innerHTML =
      '<span>Coluna de nome não detectada. O CSV precisa ter uma coluna "NOME" ou "NOME DISC".</span>' +
      '<span style="margin-top:.25rem;font-size:.8rem;opacity:.8">Cabeçalhos encontrados: ' + esc(headersLidos) + '</span>';
  }

  statsRow.innerHTML =
    '<span class="stat-chip valid">' + valid.length + ' linha' + (valid.length !== 1 ? 's' : '') + ' válida' + (valid.length !== 1 ? 's' : '') + '</span>' +
    (skipped.length ? '<span class="stat-chip skip">' + skipped.length + ' ignorada' + (skipped.length !== 1 ? 's' : '') + ' (nome vazio)</span>' : '');

  if (valid.length) {
    previewWrap.style.display = '';

    previewHead.innerHTML = '<tr><th>#</th>' +
      detFields.map(f => '<th>' + (COL_LABELS[f] || f) + '</th>').join('') + '</tr>';

    previewBody.innerHTML = valid.slice(0, PREVIEW_MAX).map((r, i) => {
      const cells = detFields.map(f => {
        const val = r[f] || '';
        return isUrl(val)
          ? '<td><a href="' + esc(val) + '" target="_blank" rel="noopener" style="color:#ff8f00;text-decoration:underline">' + esc(val) + '</a></td>'
          : '<td title="' + esc(val) + '">' + esc(val) + '</td>';
      }).join('');
      return '<tr><td style="color:#94a3b8;width:36px">' + (i + 1) + '</td>' + cells + '</tr>';
    }).join('');

    if (valid.length > PREVIEW_MAX) {
      previewMore.style.display = '';
      previewMore.textContent = '… e mais ' + (valid.length - PREVIEW_MAX) + ' linha(s) (exibindo as ' + PREVIEW_MAX + ' primeiras)';
    } else {
      previewMore.style.display = 'none';
    }
  } else {
    previewWrap.style.display = 'none';
  }
}

/* ── SALVAR PARA TESTE ───────────────────────────────────────── */
function saveForTest() {
  if (!parsedRows.length) return;
  localStorage.setItem(LS_KEY, JSON.stringify(parsedRows));
  refreshTestBanner();
  showToast(parsedRows.length + ' disciplinas salvas para teste. Redirecionando…', 'success');
  setTimeout(() => { window.location.href = '../index.html'; }, 2000);
}

/* ── IMPORTAR NO BANCO ───────────────────────────────────────── */
async function confirmImportReal() {
  if (!parsedRows.length) return;
  const ok = confirm(
    'Importar ' + parsedRows.length + ' disciplinas no banco de dados?\n\nEssa ação insere os dados definitivamente no Supabase.'
  );
  if (ok) await runImport();
}

async function runImport() {
  const progressWrap = document.getElementById('progressWrap');
  const progressBar  = document.getElementById('progressBar');
  const importLog    = document.getElementById('importLog');
  const btnReal      = document.getElementById('btnImportarReal');
  const btnTeste     = document.getElementById('btnSaveTeste');

  progressWrap.style.display = '';
  btnReal.disabled  = true;
  btnTeste.disabled = true;

  const rows = parsedRows.map(r => {
    const { id, _isTest, created_at, updated_at, ...rest } = r;
    return rest;
  });

  const BATCH = 50;
  let inserted = 0, errors = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await db.from('disciplinas').insert(batch);
    if (error) { errors += batch.length; console.error('Erro no lote:', error.message); }
    else inserted += batch.length;

    const pct = Math.round(((i + batch.length) / rows.length) * 100);
    progressBar.style.width = pct + '%';
    importLog.textContent = 'Importando… ' + Math.min(i + BATCH, rows.length) + ' de ' + rows.length;
  }

  if (errors === 0) {
    progressBar.style.background = '#22c55e';
    importLog.textContent = '✓ ' + inserted + ' disciplinas importadas com sucesso!';
    localStorage.removeItem(LS_KEY);
    refreshTestBanner();
    showToast(inserted + ' disciplinas importadas com sucesso!', 'success');
  } else {
    progressBar.style.background = '#ef4444';
    importLog.textContent = inserted + ' importadas · ' + errors + ' com erro (veja o console).';
    showToast('Importação com erros: ' + inserted + ' ok, ' + errors + ' falha(s).', 'error');
  }

  btnReal.disabled  = false;
  btnTeste.disabled = false;
}

/* ── UTIL ───────────────────────────────────────────────────── */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(text, type) {
  const isOk = type === 'success';
  const toast = document.createElement('div');
  toast.className = 'toast ' + (isOk ? 'toast-success' : 'toast-error');
  toast.innerHTML = '<span>' + text + '</span><button class="toast-close" aria-label="Fechar">✕</button>';
  document.body.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-show')));
  const remove = () => { toast.classList.remove('toast-show'); setTimeout(() => toast.remove(), 280); };
  toast.querySelector('.toast-close').addEventListener('click', remove);
  setTimeout(remove, isOk ? 4000 : 6000);
}

/* ── MODO ATUALIZAR LINKS ───────────────────────────────────── */
function normStr(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

async function ensureDbLoaded() {
  if (dbDisciplinas) return dbDisciplinas;
  const { data, error } = await db.from('disciplinas').select('id, nome');
  if (error) throw error;
  dbDisciplinas = data || [];
  return dbDisciplinas;
}

async function processFileForUpdate(text) {
  const previewBox  = document.getElementById('previewBox');
  const mappingInfo = document.getElementById('mappingInfo');

  previewBox.style.display = '';
  document.getElementById('previewWrap').style.display = 'none';
  document.getElementById('statsRow').innerHTML = '';
  document.getElementById('actionsUpdateBox').style.display = 'none';
  mappingInfo.className = 'mapping-info';
  mappingInfo.innerHTML = '<span>Carregando disciplinas do banco…</span>';

  let dbRows;
  try {
    dbRows = await ensureDbLoaded();
  } catch (e) {
    mappingInfo.className = 'mapping-info warn';
    mappingInfo.innerHTML = '<span>Erro ao carregar disciplinas do banco: ' + esc(e.message) + '</span>';
    return;
  }

  const { headers, dataRows } = parseCSV(text);

  const detected = {};
  for (const [field, candidates] of Object.entries(COL_MAP)) {
    if (field !== 'nome' && !UPDATE_FIELDS.includes(field)) continue;
    const idx = findCol(headers, candidates);
    if (idx >= 0) detected[field] = idx;
  }

  if (!('nome' in detected)) {
    mappingInfo.className = 'mapping-info warn';
    mappingInfo.innerHTML = '<span>Coluna de nome não detectada. O CSV precisa ter uma coluna "NOME" ou "NOME DISC".</span>';
    return;
  }

  detectedLinkFields = UPDATE_FIELDS.filter(f => f in detected);
  if (!detectedLinkFields.length) {
    mappingInfo.className = 'mapping-info warn';
    mappingInfo.innerHTML = '<span>Nenhuma coluna de link detectada (dropbox, youtube, soundcloud, apostila html).</span>';
    return;
  }

  const dbMap = new Map();
  dbRows.forEach(r => dbMap.set(normStr(r.nome), r));

  updateRows = [];
  dataRows.forEach(row => {
    const nome = ((detected.nome !== undefined ? row[detected.nome] : '') || '').trim();
    if (!nome) return;

    const links = {};
    detectedLinkFields.forEach(f => {
      const val = (row[detected[f]] || '').trim();
      if (isUrl(val)) links[f] = val;
    });

    const dbMatch = dbMap.get(normStr(nome));
    updateRows.push({ csvNome: nome, dbId: dbMatch?.id, dbNome: dbMatch?.nome, matched: !!dbMatch, links });
  });

  const foundCount    = updateRows.filter(r => r.matched).length;
  const notFoundCount = updateRows.filter(r => !r.matched).length;

  const linkLabels = detectedLinkFields.map(f => COL_LABELS[f]).join(', ');
  mappingInfo.innerHTML = '<span><strong>Links detectados:</strong> ' + esc(linkLabels) + '</span>';

  refreshUpdateStatsRow();
  renderUpdatePreview();

  if (foundCount) {
    document.getElementById('actionsUpdateBox').style.display = '';
    refreshUpdateActionStats();
  }
}

function renderUpdatePreview() {
  const previewWrap = document.getElementById('previewWrap');
  if (!updateRows.length) { previewWrap.style.display = 'none'; return; }
  previewWrap.style.display = '';

  const wrap = document.querySelector('.preview-table-wrap');
  wrap.style.maxHeight = '460px';
  wrap.style.overflowY = 'auto';

  document.getElementById('previewHead').innerHTML = '<tr>' +
    '<th>Status</th><th>Nome no CSV</th><th>Nome no banco</th>' +
    detectedLinkFields.map(f => '<th>' + (COL_LABELS[f] || f) + '</th>').join('') +
    '<th></th></tr>';

  document.getElementById('previewBody').innerHTML = updateRows.map((r, i) => {
    const status = r.matched
      ? '<span class="match-chip found">✓ Encontrada</span>'
      : '<span class="match-chip not-found">✗ Não encontrada</span>';

    const dbNomeCell = r.dbNome
      ? '<td title="' + esc(r.dbNome) + '" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r.dbNome) + '</td>'
      : '<td style="color:#94a3b8">—</td>';

    const linkCells = detectedLinkFields.map(f => {
      const v = r.links[f];
      return v
        ? '<td><a href="' + esc(v) + '" target="_blank" rel="noopener" style="color:#ff8f00;text-decoration:underline">link</a></td>'
        : '<td style="color:#94a3b8">—</td>';
    }).join('');

    return '<tr' + (r.matched ? '' : ' style="opacity:.55"') + '>' +
      '<td>' + status + '</td>' +
      '<td title="' + esc(r.csvNome) + '" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r.csvNome) + '</td>' +
      dbNomeCell + linkCells +
      '<td><button class="btn-remove-row" onclick="removeUpdateRow(' + i + ')" title="Remover linha">✕</button></td></tr>';
  }).join('');

  document.getElementById('previewMore').style.display = 'none';
}

function removeUpdateRow(index) {
  updateRows.splice(index, 1);
  renderUpdatePreview();
  refreshUpdateStatsRow();
  refreshUpdateActionStats();
  const foundCount = updateRows.filter(r => r.matched).length;
  document.getElementById('actionsUpdateBox').style.display = foundCount ? '' : 'none';
}

function refreshUpdateStatsRow() {
  const foundCount    = updateRows.filter(r => r.matched).length;
  const notFoundCount = updateRows.filter(r => !r.matched).length;
  document.getElementById('statsRow').innerHTML =
    '<span class="stat-chip valid">' + foundCount + ' encontrada' + (foundCount !== 1 ? 's' : '') + ' no banco</span>' +
    (notFoundCount ? '<span class="stat-chip skip">' + notFoundCount + ' não encontrada' + (notFoundCount !== 1 ? 's' : '') + '</span>' : '');
}

function refreshUpdateActionStats() {
  const found = updateRows.filter(r => r.matched).length;
  document.getElementById('updateStats').innerHTML =
    '<span class="stat-chip valid">' + found + ' disciplina' + (found !== 1 ? 's' : '') + ' será' + (found !== 1 ? 'ão' : '') + ' atualizada' + (found !== 1 ? 's' : '') + '</span>';
}

async function confirmRunUpdate() {
  const found = updateRows.filter(r => r.matched);
  if (!found.length) return;
  const ok = confirm('Atualizar links de ' + found.length + ' disciplina' + (found.length !== 1 ? 's' : '') + ' no banco?\n\nEssa ação modifica registros existentes no Supabase.');
  if (ok) await runUpdate();
}

async function runUpdate() {
  const progressWrap = document.getElementById('progressUpdateWrap');
  const progressBar  = document.getElementById('progressUpdateBar');
  const importLog    = document.getElementById('importUpdateLog');
  const btn          = document.getElementById('btnRunUpdate');

  progressWrap.style.display = '';
  btn.disabled = true;

  const matched = updateRows.filter(r => r.matched);
  let updated = 0, errors = 0;

  for (let i = 0; i < matched.length; i++) {
    const r = matched[i];
    const { error } = await db.from('disciplinas').update(r.links).eq('id', r.dbId);
    if (error) { errors++; console.error('Erro ao atualizar:', r.csvNome, error.message); }
    else updated++;

    const pct = Math.round(((i + 1) / matched.length) * 100);
    progressBar.style.width = pct + '%';
    importLog.textContent = 'Atualizando… ' + (i + 1) + ' de ' + matched.length;
  }

  if (errors === 0) {
    progressBar.style.background = '#22c55e';
    importLog.textContent = '✓ ' + updated + ' disciplinas atualizadas com sucesso!';
    showToast(updated + ' disciplinas atualizadas com sucesso!', 'success');
  } else {
    progressBar.style.background = '#ef4444';
    importLog.textContent = updated + ' atualizadas · ' + errors + ' com erro (veja o console).';
    showToast('Atualização com erros: ' + updated + ' ok, ' + errors + ' falha(s).', 'error');
  }

  btn.disabled = false;
}
