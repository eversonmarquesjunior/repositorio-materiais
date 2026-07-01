/**
 * adicionar.js — Lógica para adicionar novas disciplinas
 */

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('addDisciplineForm');
  const messageEl = document.getElementById('formMessage');

  if (!form) return;

  await loadDisciplinas();
  initDisciplinaPaiAutocomplete(
    'disciplinaPaiSearch',
    'disciplinaPaiDropdown',
    'disciplinaPaiId',
    'disciplinaPaiSelected',
    'disciplinaPaiSelectedName',
    'disciplinaPaiClear',
    null
  );

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addNewDiscipline();
  });

  // Mostra/esconde campo de ano quando "Disciplina Antiga" é selecionado
  const moduloSel = document.getElementById('modulo');
  const anoInput  = document.getElementById('anoAntiga');
  if (moduloSel && anoInput) {
    moduloSel.addEventListener('change', () => {
      const show = moduloSel.value === 'antiga';
      anoInput.style.display = show ? '' : 'none';
      if (!show) anoInput.value = '';
    });
  }

  // Botão inserir link nas observações
  const obsInsertLink = document.getElementById('obsInsertLink');
  const obsTextarea   = document.getElementById('observacoes');
  if (obsInsertLink && obsTextarea) {
    obsInsertLink.addEventListener('click', () => {
      const start = obsTextarea.selectionStart;
      const end   = obsTextarea.selectionEnd;
      const sel   = obsTextarea.value.slice(start, end).trim();

      let url, label;
      if (sel && (sel.startsWith('http://') || sel.startsWith('https://'))) {
        label = prompt('Digite o texto que vai aparecer como link:');
        if (!label) return;
        url = sel;
      } else {
        url = prompt('Cole o endereço do link:');
        if (!url) return;
        label = sel || url;
      }

      const markdown = `[${label}](${url})`;
      obsTextarea.value = obsTextarea.value.slice(0, start) + markdown + obsTextarea.value.slice(end);
      obsTextarea.focus();
      obsTextarea.setSelectionRange(start + markdown.length, start + markdown.length);
    });
  }

  // Habilita/desabilita campos de link ao clicar no checkbox
  document.querySelectorAll('.field-toggle').forEach(cb => {
    cb.addEventListener('change', () => {
      const target = document.getElementById(cb.dataset.target);
      if (target) {
        target.disabled = !cb.checked;
        if (!cb.checked) target.value = '';
      }
    });
  });

  // Ao resetar o formulário, recoloca os inputs de link como desabilitados e esconde o campo de ano
  form.addEventListener('reset', () => {
    setTimeout(() => {
      document.querySelectorAll('.field-toggle').forEach(cb => {
        const target = document.getElementById(cb.dataset.target);
        if (target) target.disabled = true;
      });
      if (anoInput) anoInput.style.display = 'none';
      clearDisciplinaPai('disciplinaPaiSearch', 'disciplinaPaiId', 'disciplinaPaiSelected');
    }, 0);
  });
});

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

    const matches = (window.disciplinas || [])
      .filter(d => d.id !== excludeId && normalize(d.nome).includes(q))
      .slice(0, 8);

    if (!matches.length) { dropdownEl.innerHTML = ''; dropdownEl.classList.remove('ac-open'); return; }

    dropdownEl.innerHTML = matches.map(d =>
      `<div class="ac-item" data-id="${d.id}" data-nome="${d.nome.replace(/"/g, '&quot;')}">${d.nome}</div>`
    ).join('');
    dropdownEl.classList.add('ac-open');

    dropdownEl.querySelectorAll('.ac-item').forEach(item => {
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectDisciplinaPai(item.dataset.id, item.dataset.nome, searchEl, hiddenEl, selectedEl, nameEl, dropdownEl);
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

function selectDisciplinaPai(id, nome, searchEl, hiddenEl, selectedEl, nameEl, dropdownEl) {
  hiddenEl.value      = id;
  searchEl.value      = '';
  nameEl.textContent  = nome;
  selectedEl.style.display = '';
  dropdownEl.classList.remove('ac-open');
  dropdownEl.innerHTML = '';
  searchEl.style.display = 'none';
}

function clearDisciplinaPai(searchId, hiddenId, selectedId) {
  const searchEl   = document.getElementById(searchId);
  const hiddenEl   = document.getElementById(hiddenId);
  const selectedEl = document.getElementById(selectedId);
  if (hiddenEl)   hiddenEl.value = '';
  if (selectedEl) selectedEl.style.display = 'none';
  if (searchEl)   { searchEl.value = ''; searchEl.style.display = ''; }
}

function toggleVal(id) {
  const el = document.getElementById(id);
  return el && !el.disabled ? el.value.trim() : '';
}

async function addNewDiscipline() {
  const form = document.getElementById('addDisciplineForm');
  const messageEl = document.getElementById('formMessage');

  // Coleta dados do formulário
  const formData = {
    nome: document.getElementById('nome').value.trim(),
    modelo: Array.from(document.querySelectorAll('#modeloCheckboxes .modelo-cb:checked')).map(cb => cb.value).join(', '),
    tipo_disciplina: document.getElementById('status').value,
    status: (() => {
      const m   = document.getElementById('modulo').value;
      const ano = document.getElementById('anoAntiga').value.trim();
      return m === 'antiga' && ano ? `Disciplina Origem Grad. - ${ano}` : m;
    })(),
    link_moodle_wae: toggleVal('linkMoodleWAE'),
    link_dp_wae:     toggleVal('linkDPWAE'),
    link_moodle_erp: toggleVal('linkMoodleERP'),
    link_dp_erp:     toggleVal('linkDPERP'),
    link_moodle_pos: toggleVal('linkMoodlePos'),
    link_inova:      toggleVal('linkInova'),
    dropbox:         document.getElementById('dropbox').value.trim(),
    google_drive:    document.getElementById('googledrive').value.trim(),
    sharepoint:      document.getElementById('sharepoint').value.trim(),
    apostila_html:   document.getElementById('apostilaHtml').value.trim(),
    youtube:         document.getElementById('youtube').value.trim(),
    soundcloud:      document.getElementById('soundcloud').value.trim(),
    obs:              document.getElementById('observacoes').value.trim(),
    disciplina_pai_id: document.getElementById('disciplinaPaiId').value || null,
    updated_at: new Date().toISOString()
  };

  // Validação básica
  if (!formData.nome || !formData.modelo) {
    showMessage(messageEl, 'Por favor, preencha os campos obrigatórios (Nome e Modelo).', 'error');
    return;
  }

  const { data, error } = await db.from('disciplinas').insert([formData]).select().single();

  if (error) {
    showMessage(messageEl, 'Erro ao salvar: ' + error.message, 'error');
    return;
  }

  showMessage(messageEl, '✓ Disciplina adicionada com sucesso!', 'success');
  form.reset();

  setTimeout(() => {
    window.location.href = '../index.html?q=' + encodeURIComponent(data.nome);
  }, 2000);
}


function showMessage(_el, text, type) {
  const isSuccess = type === 'success';
  const iconSVG = isSuccess
    ? `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>`
    : `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  const toast = document.createElement('div');
  toast.className = `toast ${isSuccess ? 'toast-success' : 'toast-error'}`;
  toast.innerHTML = `${iconSVG}<span>${text}</span><button class="toast-close" aria-label="Fechar">✕</button>`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast-show'));
  });

  const remove = () => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 280);
  };

  toast.querySelector('.toast-close').addEventListener('click', remove);
  setTimeout(remove, isSuccess ? 4000 : 6000);
}

