function statusBadgeClass(status) {
  if (status === 'ativo') return 'badge-status-ativo';
  if (status === 'revisao') return 'badge-status-revisao';
  return 'badge-status-inativo';
}

function statusLabel(status) {
  if (status === 'ativo') return 'Ativo';
  if (status === 'revisao') return 'Em revisão';
  return 'Inativo';
}

function renderDashboardStats(disciplinas) {
  const total = disciplinas.length;
  const ativas = disciplinas.filter(d => d.status === 'ativo').length;
  const revisao = disciplinas.filter(d => d.status === 'revisao').length;
  const inativas = disciplinas.filter(d => d.status === 'inativo').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-ativas').textContent = ativas;
  document.getElementById('stat-revisao').textContent = revisao;
  document.getElementById('stat-inativas').textContent = inativas;

  const pct = total > 0 ? Math.round((ativas / total) * 100) : 0;
  document.getElementById('stat-ativas-pct').textContent = `${pct}%`;
}

function renderDashboardTable(disciplinas) {
  const tbody = document.getElementById('dashTableBody');
  if (!tbody) return;

  const recentes = [...disciplinas]
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    .slice(0, 6);

  if (recentes.length === 0) {
    tbody.innerHTML = '<tr class="dash-empty-row"><td colspan="4">Nenhuma disciplina cadastrada ainda.</td></tr>';
    return;
  }

  tbody.innerHTML = recentes.map(d => `
    <tr>
      <td>
        <p class="dash-table-name">${d.nome || '—'}</p>
        <p class="dash-table-sub">${d.codigo || ''}</p>
      </td>
      <td>${d.area || '—'}</td>
      <td>${d.professor || '—'}</td>
      <td><span class="badge ${statusBadgeClass(d.status)}">${statusLabel(d.status)}</span></td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadDisciplinas();
  renderDashboardStats(window.disciplinas || []);
  renderDashboardTable(window.disciplinas || []);
});
