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

function addNewDiscipline() {
  const form = document.getElementById('addDisciplineForm');
  const messageEl = document.getElementById('formMessage');

  // Coleta dados do formulário
  const formData = {
    nome: document.getElementById('nome').value.trim(),
    area: document.getElementById('modelo').value.trim(),
    status: (() => {
      const s   = document.getElementById('status').value;
      const ano = document.getElementById('anoAntiga').value.trim();
      return s === 'antiga' && ano ? `Disciplina Antiga - ${ano}` : s;
    })(),
    modulo:        document.getElementById('modulo').value,
    codigo:        toggleVal('linkMoodleWAE'),
    linkDPWAE:     toggleVal('linkDPWAE'),
    linkMoodleERP: toggleVal('linkMoodleERP'),
    linkDPERP:     toggleVal('linkDPERP'),
    linkMoodlePos: toggleVal('linkMoodlePos'),
    linkInova:     toggleVal('linkInova'),
    cargaHoraria:  document.getElementById('dropbox').value.trim(),
    googleDrive:   document.getElementById('googledrive').value.trim(),
    periodo: document.getElementById('youtube').value.trim(),
    professor: document.getElementById('soundcloud').value.trim(),
    ementa: document.getElementById('observacoes').value.trim(),
    updatedAt: new Date().toISOString(),
    id: generateId()
  };

  // Validação básica
  if (!formData.nome || !formData.area) {
    showMessage(messageEl, 'Por favor, preencha os campos obrigatórios (Nome e Modelo).', 'error');
    return;
  }

  // Carrega disciplinas existentes (incluindo as salvas em localStorage)
  loadCustomDisciplines();

  // Verifica se disciplina com mesmo nome já existe
  if (window.disciplinas.some(d => d.nome.toLowerCase() === formData.nome.toLowerCase())) {
    showMessage(messageEl, 'Uma disciplina com este nome já existe.', 'error');
    return;
  }

  // Adiciona nova disciplina ao array global
  window.disciplinas.push(formData);

  // Salva disciplinas customizadas no localStorage
  saveCustomDisciplines();

  // Exibe mensagem de sucesso
  showMessage(messageEl, '✓ Disciplina adicionada com sucesso!', 'success');

  // Limpa formulário
  form.reset();

  // Redireciona para página inicial após 2 segundos
  setTimeout(() => {
    window.location.href = '../index.html?q=' + encodeURIComponent(formData.nome);
  }, 2000);
}

function generateId() {
  return 'disc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
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

function saveCustomDisciplines() {
  // Salva apenas as disciplinas customizadas (as adicionadas depois do carregamento)
  const customDisciplines = window.disciplinas.filter(d => d.id.startsWith('disc-') && d.id.includes('-'));
  localStorage.setItem('customDisciplines', JSON.stringify(customDisciplines));
}

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

// Carrega disciplinas customizadas ao iniciar a página
window.addEventListener('DOMContentLoaded', loadCustomDisciplines);
