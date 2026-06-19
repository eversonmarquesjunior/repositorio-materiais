/**
 * detalhe.js — Lógica da página de detalhes de disciplina
 */

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  document.getElementById('footerYear').textContent = new Date().getFullYear();

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { showNotFound(); return; }

  const { data: disc, error } = await db.from('disciplinas').select('*').eq('id', id).single();
  if (error || !disc) { showNotFound(); return; }

  const [{ data: historico }, { data: retornos }, { data: todasDisciplinas }, { data: filhas }] = await Promise.all([
    db.from('historico').select('*').eq('disciplina_id', id).order('data'),
    db.from('retornos').select('*').eq('disciplina_id', id).order('data'),
    db.from('disciplinas').select('id, nome').order('nome'),
    db.from('disciplinas').select('id, nome').eq('disciplina_pai_id', id),
  ]);
  disc.historico        = historico        || [];
  disc.retornos         = retornos         || [];
  disc.todasDisciplinas       = todasDisciplinas || [];
  disc.filhas                 = filhas           || [];
  window._todasDisciplinas    = todasDisciplinas || [];

  if (disc.disciplina_pai_id) {
    const pai = (todasDisciplinas || []).find(d => d.id === disc.disciplina_pai_id);
    disc.paiNome = pai ? pai.nome : null;
    disc.paiId   = pai ? pai.id   : null;
  }

  renderDetail(disc);
  initCopyLink();
  initEditModal(disc);
  initDeleteBtn(disc);
  initObservacoes(disc);
  initHistorico(disc);
  initRetornos(disc);
});

/* ── RENDERIZAÇÃO PRINCIPAL ──────────────────────────────── */
function renderDetail(d) {
  // Título da aba
  document.title = `${d.nome.toUpperCase()} — RepoDisciplinas`;

  // Breadcrumb
  document.getElementById('bcArea').textContent = d.modelo || '—';
  document.getElementById('bcNome').textContent = d.nome.toUpperCase();

  // Badges
  const statusMap = {
    ativo:        { cls: 'badge-status-ativo',   label: 'Ativo' },
    inativo:      { cls: 'badge-status-inativo', label: 'Inativo' },
    revisao:      { cls: 'badge-status-revisao', label: 'Em Revisão' },
    finalizada:   { cls: 'badge-status-ativo',   label: 'Finalizada' },
    pendente:     { cls: 'badge-status-revisao', label: 'Pendente' },
    producao:     { cls: 'badge-status-inativo', label: 'Em Produção' },
    padronizada:  { cls: 'badge-status-ativo',   label: 'Disciplina Padronizada' },
    antiga:       { cls: 'badge-status-inativo', label: 'Disciplina Antiga' },
    atualizacao:  { cls: 'badge-status-revisao', label: 'Atualização do Zero' },
    paliativa:    { cls: 'badge-status-revisao', label: 'Disciplina Paliativa' },
  };
  const st = statusMap[d.status] || { cls: 'badge-status-inativo', label: d.status || '—' };
  document.getElementById('detailBadges').innerHTML = [
    d.modelo ? `<span class="badge badge-area">${esc(d.modelo)}</span>` : '',
    d.modulo  ? `<span class="badge badge-periodo">${esc(d.modulo)}</span>` : '',
    d.status  ? `<span class="badge ${st.cls}">${st.label}</span>` : '',
  ].join('');

  // Badge "Mesmo material de"
  const linkSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
  const mesmoMaterialEl = document.getElementById('detailMesmoMaterial');
  if (mesmoMaterialEl) {
    if (d.paiNome && d.paiId) {
      mesmoMaterialEl.innerHTML = `${linkSVG}<span>Mesmo material de: <a href="disciplina.html?id=${esc(d.paiId)}" class="badge-linked-name">${esc(d.paiNome)}</a></span>`;
      mesmoMaterialEl.style.display = '';
    } else if (d.filhas && d.filhas.length) {
      const nomes = d.filhas.map(f => `<a href="disciplina.html?id=${esc(f.id)}" class="badge-linked-name">${esc(f.nome)}</a>`).join(', ');
      mesmoMaterialEl.innerHTML = `${linkSVG}<span>Mesmo material de: ${nomes}</span>`;
      mesmoMaterialEl.style.display = '';
    } else {
      mesmoMaterialEl.style.display = 'none';
    }
  }

  // Título e código
  document.getElementById('detailNome').textContent = d.nome.toUpperCase();

  // Botões de link (mesmos do card da página inicial)
  const linkBtnSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
  const waeUrl = isUrl(d.link_moodle_wae) ? d.link_moodle_wae : (d.modulo && isUrl(d.youtube) ? d.youtube : '');
  const detailLinkDefs = [
    { label: 'Link Moodle WAE', url: waeUrl },
    { label: 'Link DP WAE',     url: isUrl(d.link_dp_wae)     ? d.link_dp_wae     : '' },
    { label: 'Link Moodle ERP', url: isUrl(d.link_moodle_erp) ? d.link_moodle_erp : '' },
    { label: 'Link DP ERP',     url: isUrl(d.link_dp_erp)     ? d.link_dp_erp     : '' },
    { label: 'Link Moodle Pós', url: isUrl(d.link_moodle_pos) ? d.link_moodle_pos : '' },
    { label: 'Link Inova',      url: isUrl(d.link_inova)      ? d.link_inova      : '' }
  ].filter(l => l.url);
  document.getElementById('detailCodigo').innerHTML = detailLinkDefs.length
    ? `<div class="card-link-btns">${detailLinkDefs.map(l =>
        `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" class="card-moodle-btn">${linkBtnSVG}${esc(l.label)}</a>`
      ).join('')}</div>`
    : '';

  // Meta row
  const metas = [
    { label: 'DROPBOX',       value: d.dropbox, icon: 'dropbox' },
    { label: 'GOOGLE DRIVE', value: d.google_drive,  icon: 'googledrive' },
    { label: 'SHAREPOINT',   value: d.sharepoint,    icon: 'sharepoint' },
    { label: 'APOSTILA HTML',value: d.apostila_html, icon: 'apostilahtml' },
    { label: 'YOUTUBE',      value: d.youtube,      icon: 'youtube' },
    { label: 'SOUNDCLOUD',   value: d.soundcloud,    icon: 'soundcloud' }
  ].filter(m => m.value);

  document.getElementById('detailMetaRow').innerHTML = metas.map(m => `
    <div class="detail-meta-item">
      <a href="${esc(m.value)}" target="_blank" rel="noopener noreferrer" class="detail-meta-icon ${m.icon}" title="${esc(m.label)}">
        ${getIconSVG(m.icon)}
      </a>
    </div>
  `).join('');

  // Observações
  renderObservacoes(d);

  // Histórico
  renderHistorico(d);

  // Retornos
  renderRetornos(d);

  // Sidebar — Cursos Relacionados
  if (d.cursos && d.cursos.length) {
    document.getElementById('scCursos').style.display = '';
    document.getElementById('sidebarCursos').innerHTML =
      d.cursos.map(c => `<li><a href="#">${esc(c)}</a></li>`).join('');
  }
}

/* ── HISTÓRICO DE ATUALIZAÇÕES ───────────────────────────── */
const EQUIPE_COLABS = {
  'AUDIOVISUAL': ['MARIA', 'THASSIANE'],
  'DIAGRAMAÇÃO': ['BRUNA'],
  'INSERÇÃO':    ['FELIPE', 'JUNIOR', 'LUCAS', 'NATÁLIA', 'PEDRO', 'STEFANYE'],
  'REVISÃO':     ['CAROLAYNE', 'LOUISE', 'MARCELINO', 'JÉSSICA'],
};

function buildColabOptions(equipe, selected) {
  const opts = EQUIPE_COLABS[equipe] || [];
  return `<option value="">Colaborador</option>` +
    opts.map(o => `<option value="${o}"${selected === o ? ' selected' : ''}>${o}</option>`).join('');
}

function formatHistDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return (d && m && y) ? `${d}/${m}/${y}` : dateStr;
}

function renderHistorico(d) {
  const timeline = document.getElementById('historicoTimeline');
  const emptyEl  = document.getElementById('historicoEmpty');
  if (!timeline) return;

  const items = (d.historico || []).slice().sort((a, b) => a.data.localeCompare(b.data));

  if (!items.length) {
    timeline.innerHTML = '';
    if (emptyEl) emptyEl.style.display = '';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  const equipeOpts = ['AUDIOVISUAL', 'DIAGRAMAÇÃO', 'INSERÇÃO', 'REVISÃO'];
  const tipoOpts   = ['LIBERAÇÃO', 'ATUALIZAÇÃO'];

  timeline.innerHTML = items.map(item => `
    <div class="hist-entry" data-id="${esc(item.id)}">
      <div class="hist-dot"></div>
      <div class="hist-content">
        <div class="hist-view">
          <div class="hist-header">
            <span class="hist-date">${formatHistDate(item.data)}</span>
            ${item.equipe        ? `<span class="hist-badge hist-badge-equipe">${esc(item.equipe)}${item.colaborador ? ` · ${esc(item.colaborador)}` : ''}</span>` : ''}
            ${item.tipo_registro ? `<span class="hist-badge hist-badge-tipo">${esc(item.tipo_registro)}</span>` : ''}
            <div class="hist-actions">
              <button class="hist-edit-btn obs-edit-btn" title="Editar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="hist-del-btn obs-edit-btn" title="Excluir">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>
          <p class="hist-text">${esc(item.texto)}</p>
        </div>
        <div class="hist-edit" style="display:none">
          <div class="hist-form-row">
            <input type="date" class="hist-date-input" value="${esc(item.data)}" />
            <select class="hist-select hist-equipe-sel">
              <option value="">Equipe</option>
              ${equipeOpts.map(o => `<option value="${o}"${item.equipe === o ? ' selected' : ''}>${o}</option>`).join('')}
            </select>
            <select class="hist-select hist-colab-sel"${!item.equipe ? ' style="display:none"' : ''}>
              ${buildColabOptions(item.equipe, item.colaborador)}
            </select>
            <select class="hist-select hist-tipo-sel">
              <option value="">Tipo de Registro</option>
              ${tipoOpts.map(o => `<option value="${o}"${item.tipo_registro === o ? ' selected' : ''}>${o}</option>`).join('')}
            </select>
          </div>
          <textarea class="obs-textarea" rows="3">${esc(item.texto)}</textarea>
          <div class="obs-edit-actions">
            <button class="hist-save-btn btn btn-primary btn-sm">Salvar</button>
            <button class="hist-cancel-btn btn btn-secondary btn-sm">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  timeline.querySelectorAll('.hist-entry').forEach(entry => {
    const id          = entry.dataset.id;
    const viewEl      = entry.querySelector('.hist-view');
    const editEl      = entry.querySelector('.hist-edit');
    const dateIn      = entry.querySelector('.hist-date-input');
    const textIn      = entry.querySelector('textarea');
    const equipeSelEl = entry.querySelector('.hist-equipe-sel');
    const colabSelEl  = entry.querySelector('.hist-colab-sel');

    equipeSelEl.addEventListener('change', () => {
      const eq = equipeSelEl.value;
      colabSelEl.innerHTML     = buildColabOptions(eq, '');
      colabSelEl.style.display = eq ? '' : 'none';
    });

    entry.querySelector('.hist-edit-btn').addEventListener('click', () => {
      viewEl.style.display = 'none';
      editEl.style.display = '';
      textIn.focus();
    });

    entry.querySelector('.hist-cancel-btn').addEventListener('click', () => {
      viewEl.style.display = '';
      editEl.style.display = 'none';
    });

    entry.querySelector('.hist-del-btn').addEventListener('click', async () => {
      if (!confirm('Remover este registro do histórico?')) return;
      const { error } = await db.from('historico').delete().eq('id', id);
      if (error) { showToast('Erro ao remover: ' + error.message, 'error'); return; }
      d.historico = (d.historico || []).filter(i => i.id !== id);
      renderHistorico(d);
      showToast('Registro removido.', 'success');
    });

    entry.querySelector('.hist-save-btn').addEventListener('click', async () => {
      const novoTexto  = textIn.value.trim();
      const novaData   = dateIn.value;
      const novaEquipe = equipeSelEl.value || null;
      const novoColab  = colabSelEl.value  || null;
      const novoTipo   = entry.querySelector('.hist-tipo-sel').value || null;
      if (!novoTexto || !novaData) {
        showToast('Preencha a data e o texto do registro.', 'error');
        return;
      }
      const { error } = await db.from('historico')
        .update({ texto: novoTexto, data: novaData, equipe: novaEquipe, colaborador: novoColab, tipo_registro: novoTipo })
        .eq('id', id);
      if (error) { showToast('Erro ao atualizar: ' + error.message, 'error'); return; }
      const item = (d.historico || []).find(i => i.id === id);
      if (item) { item.texto = novoTexto; item.data = novaData; item.equipe = novaEquipe; item.colaborador = novoColab; item.tipo_registro = novoTipo; }
      renderHistorico(d);
      showToast('Registro atualizado.', 'success');
    });
  });
}

function initHistorico(d) {
  const addBtn    = document.getElementById('historicoAddBtn');
  const newForm   = document.getElementById('historicoNewForm');
  const dateIn    = document.getElementById('historicoNewData');
  const textIn    = document.getElementById('historicoNewTexto');
  const saveBtn   = document.getElementById('historicoNewSave');
  const cancelBtn = document.getElementById('historicoNewCancel');
  const equipeEl  = document.getElementById('historicoNewEquipe');
  const colabEl   = document.getElementById('historicoNewColaborador');
  const tipoEl    = document.getElementById('historicoNewTipo');
  if (!addBtn || !newForm) return;

  if (equipeEl && colabEl) {
    equipeEl.addEventListener('change', () => {
      const eq = equipeEl.value;
      colabEl.innerHTML     = buildColabOptions(eq, '');
      colabEl.style.display = eq ? '' : 'none';
    });
  }

  addBtn.addEventListener('click', () => {
    dateIn.value = new Date().toISOString().slice(0, 10);
    textIn.value = '';
    if (equipeEl) equipeEl.value = '';
    if (colabEl)  { colabEl.innerHTML = buildColabOptions('', ''); colabEl.style.display = 'none'; }
    if (tipoEl)   tipoEl.value   = '';
    newForm.style.display = '';
    addBtn.style.display  = 'none';
    textIn.focus();
  });

  const cancelNew = () => {
    newForm.style.display = 'none';
    addBtn.style.display  = '';
  };

  cancelBtn.addEventListener('click', cancelNew);

  saveBtn.addEventListener('click', async () => {
    const texto         = textIn.value.trim();
    const data          = dateIn.value;
    const equipe        = equipeEl?.value  || null;
    const colaborador   = colabEl?.value   || null;
    const tipo_registro = tipoEl?.value    || null;
    if (!texto || !data) {
      showToast('Preencha a data e o texto do registro.', 'error');
      return;
    }
    const { data: novo, error } = await db.from('historico')
      .insert([{ disciplina_id: d.id, texto, data, equipe, colaborador, tipo_registro }])
      .select().single();
    if (error) { showToast('Erro ao adicionar: ' + error.message, 'error'); return; }
    if (!d.historico) d.historico = [];
    d.historico.push(novo);
    cancelNew();
    renderHistorico(d);
    showToast('Registro adicionado ao histórico!', 'success');
  });
}

/* ── RETORNOS ────────────────────────────────────────────── */
function renderRetornos(d) {
  const timeline = document.getElementById('retornosTimeline');
  const emptyEl  = document.getElementById('retornosEmpty');
  if (!timeline) return;

  const items = (d.retornos || []).slice().sort((a, b) => a.data.localeCompare(b.data));

  if (!items.length) {
    timeline.innerHTML = '';
    if (emptyEl) emptyEl.style.display = '';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  timeline.innerHTML = items.map(item => `
    <div class="hist-entry" data-id="${esc(item.id)}">
      <div class="hist-dot"></div>
      <div class="hist-content">
        <div class="hist-view">
          <div class="hist-header">
            <span class="hist-date">${formatHistDate(item.data)}</span>
            <div class="hist-actions">
              <button class="ret-edit-btn obs-edit-btn" title="Editar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="ret-del-btn obs-edit-btn" title="Excluir">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            </div>
          </div>
          <p class="hist-text">${esc(item.texto)}</p>
        </div>
        <div class="hist-edit" style="display:none">
          <input type="date" class="hist-date-input" value="${esc(item.data)}" />
          <textarea class="obs-textarea" rows="3">${esc(item.texto)}</textarea>
          <div class="obs-edit-actions">
            <button class="ret-save-btn btn btn-primary btn-sm">Salvar</button>
            <button class="ret-cancel-btn btn btn-secondary btn-sm">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  timeline.querySelectorAll('.hist-entry').forEach(entry => {
    const id     = entry.dataset.id;
    const viewEl = entry.querySelector('.hist-view');
    const editEl = entry.querySelector('.hist-edit');
    const dateIn = entry.querySelector('.hist-date-input');
    const textIn = entry.querySelector('textarea');

    entry.querySelector('.ret-edit-btn').addEventListener('click', () => {
      viewEl.style.display = 'none';
      editEl.style.display = '';
      textIn.focus();
    });

    entry.querySelector('.ret-cancel-btn').addEventListener('click', () => {
      viewEl.style.display = '';
      editEl.style.display = 'none';
    });

    entry.querySelector('.ret-del-btn').addEventListener('click', async () => {
      if (!confirm('Remover este retorno?')) return;
      const { error } = await db.from('retornos').delete().eq('id', id);
      if (error) { showToast('Erro ao remover: ' + error.message, 'error'); return; }
      d.retornos = (d.retornos || []).filter(i => i.id !== id);
      renderRetornos(d);
      showToast('Retorno removido.', 'success');
    });

    entry.querySelector('.ret-save-btn').addEventListener('click', async () => {
      const novoTexto = textIn.value.trim();
      const novaData  = dateIn.value;
      if (!novoTexto || !novaData) {
        showToast('Preencha a data e o texto do retorno.', 'error');
        return;
      }
      const { error } = await db.from('retornos').update({ texto: novoTexto, data: novaData }).eq('id', id);
      if (error) { showToast('Erro ao atualizar: ' + error.message, 'error'); return; }
      const item = (d.retornos || []).find(i => i.id === id);
      if (item) { item.texto = novoTexto; item.data = novaData; }
      renderRetornos(d);
      showToast('Retorno atualizado.', 'success');
    });
  });
}

function initRetornos(d) {
  const addBtn    = document.getElementById('retornosAddBtn');
  const newForm   = document.getElementById('retornosNewForm');
  const dateIn    = document.getElementById('retornosNewData');
  const textIn    = document.getElementById('retornosNewTexto');
  const saveBtn   = document.getElementById('retornosNewSave');
  const cancelBtn = document.getElementById('retornosNewCancel');
  if (!addBtn || !newForm) return;

  addBtn.addEventListener('click', () => {
    dateIn.value = new Date().toISOString().slice(0, 10);
    textIn.value = '';
    newForm.style.display = '';
    addBtn.style.display  = 'none';
    textIn.focus();
  });

  const cancelNew = () => {
    newForm.style.display = 'none';
    addBtn.style.display  = '';
  };

  cancelBtn.addEventListener('click', cancelNew);

  saveBtn.addEventListener('click', async () => {
    const texto = textIn.value.trim();
    const data  = dateIn.value;
    if (!texto || !data) {
      showToast('Preencha a data e o texto do retorno.', 'error');
      return;
    }
    const { data: novo, error } = await db.from('retornos')
      .insert([{ disciplina_id: d.id, texto, data }])
      .select().single();
    if (error) { showToast('Erro ao adicionar: ' + error.message, 'error'); return; }
    if (!d.retornos) d.retornos = [];
    d.retornos.push(novo);
    cancelNew();
    renderRetornos(d);
    showToast('Retorno adicionado!', 'success');
  });
}

/* ── OBSERVAÇÕES INLINE ──────────────────────────────────── */
function renderObservacoes(d) {
  const textEl  = document.getElementById('detailEmenta');
  const editMode = document.getElementById('ementaEditMode');
  const editBtn  = document.getElementById('ementaEditBtn');
  if (!textEl) return;
  if (editMode) editMode.style.display = 'none';
  if (editBtn)  editBtn.style.display  = '';
  if (d.obs && d.obs.trim()) {
    textEl.textContent = d.obs;
    textEl.classList.remove('obs-empty');
  } else {
    textEl.textContent = 'Sem observações.';
    textEl.classList.add('obs-empty');
  }
  textEl.style.display = '';
}

function initObservacoes(d) {
  const editBtn  = document.getElementById('ementaEditBtn');
  const editMode = document.getElementById('ementaEditMode');
  const textarea = document.getElementById('ementaTextarea');
  const saveBtn  = document.getElementById('ementaSaveBtn');
  const cancelBtn = document.getElementById('ementaCancelBtn');
  const textEl   = document.getElementById('detailEmenta');
  if (!editBtn || !editMode || !textarea) return;

  editBtn.addEventListener('click', () => {
    textarea.value = d.obs || '';
    textEl.style.display  = 'none';
    editMode.style.display = '';
    editBtn.style.display  = 'none';
    textarea.focus();
  });

  const cancelEdit = () => {
    editMode.style.display = 'none';
    textEl.style.display   = '';
    editBtn.style.display  = '';
  };

  saveBtn.addEventListener('click', async () => {
    const obs = textarea.value.trim();
    const { error } = await db.from('disciplinas').update({ obs }).eq('id', d.id);
    if (error) { showToast('Erro ao salvar: ' + error.message, 'error'); return; }
    d.obs = obs;
    cancelEdit();
    renderObservacoes(d);
    showToast('Observações salvas com sucesso!', 'success');
  });

  cancelBtn.addEventListener('click', cancelEdit);
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
  document.documentElement.setAttribute('data-theme', 'light');
  localStorage.removeItem('repo-theme');
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
    finalizada: 'Finalizada', pendente: 'Pendente', producao: 'Em Produção',
    padronizada: 'Disciplina Padronizada', atualizacao: 'Atualização do Zero',
    paliativa: 'Disciplina Paliativa', antiga: 'Disciplina Antiga'
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
      <path d="M6 2L11 6L6 10L1 6zM18 2L23 6L18 10L13 6zM12 8L17 12L12 16L7 12zM6 14L11 18L6 22L1 18zM18 14L23 18L18 22L13 18z"/>
    </svg>`,

    googledrive: `<svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon">
      <path d="M7.5 3L1 14.5l3.25 5.5 6.5-11zm9 0H7.5l6.5 11h9zm-9.25 13L4 21.5h16l-3.25-5.5z"/>
    </svg>`,

    sharepoint: `<svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm9.5 4c-1.8 0-2.8.8-2.8 2 0 1 .68 1.7 2.04 2.02l.96.24c.78.18 1.1.48 1.1.96 0 .6-.56 1-1.52 1-.98 0-1.58-.42-1.68-1.16H9.22c.1 1.38 1.14 2.2 3.06 2.2s3.04-.84 3.04-2.12c0-1.04-.66-1.7-2.08-2.04l-.86-.2c-.78-.2-1.1-.48-1.1-.94 0-.58.52-.96 1.36-.96s1.4.4 1.5 1.08h1.28C15.3 9.82 14.3 9 12.5 9z"/></svg>`,

    apostilahtml: `<svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>`,

    moodle: `<svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>`
  };
  return icons[type] || icons.moodle;
}


/* ── AUTOCOMPLETE DISCIPLINA PAI ─────────────────────── */
function initDisciplinaPaiAutocomplete(searchId, dropdownId, hiddenId, selectedId, selectedNameId, clearBtnId, excludeId) {
  const searchEl   = document.getElementById(searchId);
  const dropdownEl = document.getElementById(dropdownId);
  const hiddenEl   = document.getElementById(hiddenId);
  const selectedEl = document.getElementById(selectedId);
  const nameEl     = document.getElementById(selectedNameId);
  const clearBtn   = document.getElementById(clearBtnId);
  if (!searchEl || !dropdownEl) return;

  const normalize = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  searchEl.addEventListener('input', () => {
    const q = normalize(searchEl.value);
    if (!q) { dropdownEl.innerHTML = ''; dropdownEl.classList.remove('ac-open'); return; }

    const allDiscs = (window._todasDisciplinas || []);
    const matches  = allDiscs.filter(d => d.id !== excludeId && normalize(d.nome).includes(q)).slice(0, 8);

    if (!matches.length) { dropdownEl.innerHTML = ''; dropdownEl.classList.remove('ac-open'); return; }

    dropdownEl.innerHTML = matches.map(d =>
      `<div class="ac-item" data-id="${d.id}" data-nome="${d.nome.replace(/"/g, '&quot;')}">${d.nome}</div>`
    ).join('');
    dropdownEl.classList.add('ac-open');

    dropdownEl.querySelectorAll('.ac-item').forEach(item => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        hiddenEl.value          = item.dataset.id;
        nameEl.textContent      = item.dataset.nome;
        selectedEl.style.display = '';
        searchEl.style.display  = 'none';
        dropdownEl.classList.remove('ac-open');
        dropdownEl.innerHTML = '';
      });
    });
  });

  searchEl.addEventListener('blur', () => {
    setTimeout(() => { dropdownEl.classList.remove('ac-open'); }, 150);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearDisciplinaPai(searchId, hiddenId, selectedId);
    });
  }
}

function clearDisciplinaPai(searchId, hiddenId, selectedId) {
  const searchEl   = document.getElementById(searchId);
  const hiddenEl   = document.getElementById(hiddenId);
  const selectedEl = document.getElementById(selectedId);
  if (hiddenEl)   hiddenEl.value = '';
  if (selectedEl) selectedEl.style.display = 'none';
  if (searchEl)   { searchEl.value = ''; searchEl.style.display = ''; }
}

/* ── EXCLUIR DISCIPLINA ──────────────────────────────── */
function initDeleteBtn(d) {
  const btn = document.getElementById('deleteBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const confirmed = confirm(`Tem certeza que deseja excluir a disciplina "${d.nome}"?\n\nEsta ação não pode ser desfeita.`);
    if (!confirmed) return;
    const { error } = await db.from('disciplinas').delete().eq('id', d.id);
    if (error) { showToast('Erro ao excluir: ' + error.message, 'error'); return; }
    window.location.href = '../index.html';
  });
}

/* ── MODAL EDITAR DISCIPLINA ─────────────────────────── */
function initEditModal(d) {
  const modal    = document.getElementById('editModal');
  const closeBtn = document.getElementById('editModalClose');
  const cancelBtn = document.getElementById('editModalCancelBtn');
  const editBtn  = document.getElementById('editBtn');
  const form     = document.getElementById('editDisciplineForm');
  if (!modal || !editBtn || !form) return;

  const openModal = () => {
    fillEditForm(d);
    modal.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('modal-open')));
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('modal-open');
    setTimeout(() => { modal.style.display = ''; }, 210);
    document.body.style.overflow = '';
  };

  initDisciplinaPaiAutocomplete(
    'editDisciplinaPaiSearch',
    'editDisciplinaPaiDropdown',
    'editDisciplinaPaiId',
    'editDisciplinaPaiSelected',
    'editDisciplinaPaiSelectedName',
    'editDisciplinaPaiClear',
    d.id
  );

  editBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('modal-open')) closeModal(); });

  const editStatusSel  = document.getElementById('editStatus');
  const editAnoInput   = document.getElementById('editAnoAntiga');
  if (editStatusSel && editAnoInput) {
    editStatusSel.addEventListener('change', () => {
      const show = editStatusSel.value === 'antiga';
      editAnoInput.style.display = show ? '' : 'none';
      if (!show) editAnoInput.value = '';
    });
  }

  form.querySelectorAll('.field-toggle').forEach(cb => {
    cb.addEventListener('change', () => {
      const target = document.getElementById(cb.dataset.target);
      if (target) {
        target.disabled = !cb.checked;
        if (!cb.checked) target.value = '';
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveEditedDiscipline(d, closeModal);
  });
}

function fillEditForm(d) {
  document.getElementById('editNome').value    = d.nome    || '';
  document.getElementById('editModelo').value  = d.modelo    || '';
  document.getElementById('editModulo').value  = d.modulo  || '';

  const anoAntigaInput = document.getElementById('editAnoAntiga');
  const isAntiga = d.status && d.status.startsWith('Disciplina Antiga');
  if (isAntiga) {
    document.getElementById('editStatus').value = 'antiga';
    const match = d.status.match(/(\d{4})$/);
    if (anoAntigaInput) { anoAntigaInput.value = match ? match[1] : ''; anoAntigaInput.style.display = ''; }
  } else {
    document.getElementById('editStatus').value = d.status || '';
    if (anoAntigaInput) { anoAntigaInput.value = ''; anoAntigaInput.style.display = 'none'; }
  }

  const setToggle = (inputId, value) => {
    const input = document.getElementById(inputId);
    const cb    = document.querySelector(`[data-target="${inputId}"]`);
    if (!input || !cb) return;
    if (value && isUrl(value)) {
      cb.checked     = true;
      input.disabled = false;
      input.value    = value;
    } else {
      cb.checked     = false;
      input.disabled = true;
      input.value    = '';
    }
  };

  setToggle('editLinkMoodleWAE', d.link_moodle_wae);
  setToggle('editLinkDPWAE',     d.link_dp_wae);
  setToggle('editLinkMoodleERP', d.link_moodle_erp);
  setToggle('editLinkDPERP',     d.link_dp_erp);
  setToggle('editLinkMoodlePos', d.link_moodle_pos);
  setToggle('editLinkInova',     d.link_inova);

  document.getElementById('editDropbox').value      = d.dropbox      || '';
  document.getElementById('editGoogledrive').value  = d.google_drive || '';
  document.getElementById('editSharepoint').value   = d.sharepoint   || '';
  document.getElementById('editApostilaHtml').value = d.apostila_html || '';
  document.getElementById('editYoutube').value      = d.youtube      || '';
  document.getElementById('editSoundcloud').value   = d.soundcloud   || '';
  document.getElementById('editObservacoes').value  = d.obs          || '';

  // Preenche o campo "Mesmo material de"
  clearDisciplinaPai('editDisciplinaPaiSearch', 'editDisciplinaPaiId', 'editDisciplinaPaiSelected');
  if (d.disciplina_pai_id && d.paiNome) {
    const hiddenEl   = document.getElementById('editDisciplinaPaiId');
    const selectedEl = document.getElementById('editDisciplinaPaiSelected');
    const nameEl     = document.getElementById('editDisciplinaPaiSelectedName');
    const searchEl   = document.getElementById('editDisciplinaPaiSearch');
    if (hiddenEl && selectedEl && nameEl && searchEl) {
      hiddenEl.value          = d.disciplina_pai_id;
      nameEl.textContent      = d.paiNome;
      selectedEl.style.display = '';
      searchEl.style.display  = 'none';
    }
  }
}

async function saveEditedDiscipline(d, closeModal) {
  const val = (id) => document.getElementById(id)?.value.trim() || '';
  const toggleVal = (id) => {
    const el = document.getElementById(id);
    return el && !el.disabled ? el.value.trim() : '';
  };

  const nome = val('editNome');
  const area = val('editModelo');
  if (!nome || !area) {
    showToast('Por favor, preencha os campos obrigatórios (Nome e Modelo).', 'error');
    return;
  }

  const modulo = val('editModulo');
  if (modulo && !/^\d{4}\/\d+$/.test(modulo)) {
    showToast('O módulo deve seguir o formato Ano/Número (ex: 2026/1).', 'error');
    return;
  }

  const updates = {
    nome:            nome,
    modelo:          area,
    status:          (() => {
      const s   = val('editStatus');
      const ano = (document.getElementById('editAnoAntiga') || {}).value?.trim();
      return s === 'antiga' && ano ? `Disciplina Antiga - ${ano}` : s;
    })(),
    modulo:          val('editModulo'),
    link_moodle_wae: toggleVal('editLinkMoodleWAE'),
    link_dp_wae:     toggleVal('editLinkDPWAE'),
    link_moodle_erp: toggleVal('editLinkMoodleERP'),
    link_dp_erp:     toggleVal('editLinkDPERP'),
    link_moodle_pos: toggleVal('editLinkMoodlePos'),
    link_inova:      toggleVal('editLinkInova'),
    dropbox:         val('editDropbox'),
    google_drive:    val('editGoogledrive'),
    sharepoint:      val('editSharepoint'),
    apostila_html:   val('editApostilaHtml'),
    youtube:         val('editYoutube'),
    soundcloud:      val('editSoundcloud'),
    obs:               val('editObservacoes'),
    disciplina_pai_id: (document.getElementById('editDisciplinaPaiId') || {}).value || null,
  };

  const { error } = await db.from('disciplinas').update(updates).eq('id', d.id);
  if (error) {
    showToast('Erro ao salvar: ' + error.message, 'error');
    return;
  }

  Object.assign(d, updates);
  const novoPaiId = updates.disciplina_pai_id;
  if (novoPaiId) {
    const pai = (window._todasDisciplinas || []).find(x => x.id === novoPaiId);
    d.paiNome = pai ? pai.nome : null;
    d.paiId   = pai ? pai.id   : null;
  } else {
    d.paiNome = null;
    d.paiId   = null;
  }
  renderDetail(d);
  closeModal();
  showToast('Disciplina atualizada com sucesso!', 'success');
}

function showToast(text, type) {
  const isSuccess = type === 'success';
  const iconSVG = isSuccess
    ? `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>`
    : `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  const toast = document.createElement('div');
  toast.className = `toast ${isSuccess ? 'toast-success' : 'toast-error'}`;
  toast.innerHTML = `${iconSVG}<span>${text}</span><button class="toast-close" aria-label="Fechar">✕</button>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-show')));
  const remove = () => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 280);
  };
  toast.querySelector('.toast-close').addEventListener('click', remove);
  setTimeout(remove, isSuccess ? 4000 : 6000);
}
