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

  // Ao resetar o formulário, recoloca os inputs de link como desabilitados
  form.addEventListener('reset', () => {
    setTimeout(() => {
      document.querySelectorAll('.field-toggle').forEach(cb => {
        const target = document.getElementById(cb.dataset.target);
        if (target) target.disabled = true;
      });
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
    status: document.getElementById('status').value,
    modulo:        document.getElementById('modulo').value,
    codigo:        toggleVal('linkMoodleWAE'),
    linkDPWAE:     toggleVal('linkDPWAE'),
    linkMoodleERP: toggleVal('linkMoodleERP'),
    linkDPERP:     toggleVal('linkDPERP'),
    cargaHoraria:  document.getElementById('dropbox').value.trim(),
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
  showMessage(messageEl, '✓ Disciplina adicionada com sucesso! Você pode procurá-la na página inicial.', 'success');

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

function showMessage(element, text, type) {
  element.textContent = text;
  element.className = 'form-message ' + (type === 'success' ? 'form-message-success' : 'form-message-error');
  element.style.display = 'block';

  if (type === 'error') {
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }
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
