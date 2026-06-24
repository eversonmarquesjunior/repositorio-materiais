window.disciplinas = [];

async function loadDisciplinas() {
  const { data, error } = await db.from('disciplinas').select('*').order('nome');
  if (error) {
    console.error('Erro ao carregar disciplinas:', error.message);
    return;
  }
  let testData = [];
  try { testData = JSON.parse(localStorage.getItem('repo_import_preview') || '[]'); } catch {}
  window.disciplinas = [...(data || []), ...testData];
}
