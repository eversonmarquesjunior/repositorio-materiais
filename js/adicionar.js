/**
 * adicionar.js — Lógica para adicionar novas disciplinas
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('addDisciplineForm');
  const messageEl = document.getElementById('formMessage');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addNewDiscipline();
  });

  // Mostra/esconde campo de ano quando "Disciplina Antiga" é selecionado
  const statusSel = document.getElementById('status');
  const anoInput  = document.getElementById('anoAntiga');
  if (statusSel && anoInput) {
    statusSel.addEventListener('change', () => {
      const show = statusSel.value === 'antiga';
      anoInput.style.display = show ? '' : 'none';
      if (!show) anoInput.value = '';
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
    }, 0);
  });
});

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
    modelo: document.getElementById('modelo').value.trim(),
    status: (() => {
      const s   = document.getElementById('status').value;
      const ano = document.getElementById('anoAntiga').value.trim();
      return s === 'antiga' && ano ? `Disciplina Antiga - ${ano}` : s;
    })(),
    modulo:          document.getElementById('modulo').value.trim(),
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
    obs:             document.getElementById('observacoes').value.trim(),
    updated_at: new Date().toISOString()
  };

  // Validação básica
  if (!formData.nome || !formData.modelo) {
    showMessage(messageEl, 'Por favor, preencha os campos obrigatórios (Nome e Modelo).', 'error');
    return;
  }

  if (formData.modulo && !/^\d{4}\/\d+$/.test(formData.modulo)) {
    showMessage(messageEl, 'O módulo deve seguir o formato Ano/Número (ex: 2026/1).', 'error');
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

