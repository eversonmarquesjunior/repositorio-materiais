/**
 * export.js — Exportação dos resultados filtrados (Excel / PDF)
 * Usa o mesmo array `state.results` já filtrado pela busca (js/app.js).
 */

const EXPORT_STATUS_LABELS = {
  comum:       'Disciplina Comum',
  atualizacao: 'Atualização do Zero',
  paliativa:   'Disciplina Paliativa',
  antiga:      'Disciplina Origem Grad.',
};

const EXPORT_TIPO_LABELS = {
  ace:                 'Ace',
  estagio:             'Estágio',
  padrao_unificada:    'Padrão Unificada',
  projeto_integrador:  'Projeto Integrador',
  pratica_conectada:   'Prática Conectada',
  introducao_ao_curso: 'Introdução ao Curso',
  pap:                 'Proj. em Amb. Prof.',
  outro:               'Outro',
};

function exportStatusLabel(d) {
  if (!d.status) return '';
  return EXPORT_STATUS_LABELS[d.status] || d.status;
}

function exportTipoLabel(d) {
  if (!d.tipo_disciplina) return '';
  return EXPORT_TIPO_LABELS[d.tipo_disciplina] || d.tipo_disciplina;
}

function exportMesmoMaterial(d) {
  const all = window.disciplinas || [];
  if (d.disciplina_pai_id) {
    const pai = all.find(x => x.id === d.disciplina_pai_id);
    return pai ? pai.nome : '';
  }
  if (d.disciplina_pai_texto) return d.disciplina_pai_texto;
  const filhas = all.filter(x => x.disciplina_pai_id === d.id);
  return filhas.length ? filhas.map(f => f.nome).join(', ') : '';
}

function exportEmentaTexto(d) {
  return d.ementa || '';
}

/* Colunas exportadas: { header, get(d), link } — link: true = valor é uma URL */
const EXPORT_COLUMNS = [
  { header: 'Nome',            get: d => d.nome || '' },
  { header: 'Modelo',          get: d => d.modelo || '' },
  { header: 'Tipo de Disciplina', get: exportTipoLabel },
  { header: 'Status',          get: exportStatusLabel },
  { header: 'Mesmo Material De', get: exportMesmoMaterial },
  { header: 'Ementa',           get: exportEmentaTexto },
  { header: 'Plano de Ensino', get: d => d.plano_ensino_url || '', link: true },
  { header: 'Moodle WAE',      get: d => d.link_moodle_wae  || '', link: true },
  { header: 'DP WAE',          get: d => d.link_dp_wae      || '', link: true },
  { header: 'Moodle ERP',      get: d => d.link_moodle_erp  || '', link: true },
  { header: 'DP ERP',          get: d => d.link_dp_erp      || '', link: true },
  { header: 'Moodle Pós',      get: d => d.link_moodle_pos  || '', link: true },
  { header: 'Inova',           get: d => d.link_inova       || '', link: true },
  { header: 'Dropbox',         get: d => d.dropbox          || '', link: true },
  { header: 'Google Drive',    get: d => d.google_drive     || '', link: true },
  { header: 'SharePoint',      get: d => d.sharepoint       || '', link: true },
  { header: 'Apostila HTML',   get: d => d.apostila_html    || '', link: true },
  { header: 'YouTube',         get: d => d.youtube          || '', link: true },
  { header: 'Soundcloud',      get: d => d.soundcloud       || '', link: true },
];

function exportFileBaseName() {
  const ts = new Date().toISOString().slice(0, 10);
  return `disciplinas_filtradas_${ts}`;
}

function getExportList() {
  return (typeof state !== 'undefined' && Array.isArray(state.results)) ? state.results : [];
}

/* ── METADADOS DO RELATÓRIO (filtros, data, quantidade) ──── */
function getFilterSummary() {
  if (typeof state === 'undefined') return 'Nenhum filtro aplicado';

  const parts = [];
  if (state.query) parts.push(`Busca: "${state.query}"`);
  if (state.filterModelo?.length) parts.push(`Modelo: ${state.filterModelo.join(', ')}`);
  if (state.filterTipo?.length) {
    parts.push(`Tipo de Disciplina: ${state.filterTipo.map(t => EXPORT_TIPO_LABELS[t] || t).join(', ')}`);
  }
  if (state.filterStatus?.length) {
    parts.push(`Status: ${state.filterStatus.map(s => EXPORT_STATUS_LABELS[s] || s).join(', ')}`);
  }
  return parts.length ? parts.join('  |  ') : 'Nenhum filtro aplicado';
}

function getExportMeta(list) {
  const now = new Date();
  const dateStr = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  return {
    dateStr,
    filtersStr: getFilterSummary(),
    count: list.length,
  };
}

/* Mantém só as colunas em que ao menos uma disciplina do conjunto exportado tem valor */
function getActiveColumns(list) {
  return EXPORT_COLUMNS.filter(col => list.some(d => col.get(d)));
}

/* ── EXCEL ───────────────────────────────────────────────── */
function exportToExcel() {
  const list = getExportList();
  if (!list.length) { window.showToast?.('Nenhum resultado para exportar.', 'error'); return; }

  const columns = getActiveColumns(list);
  const meta = getExportMeta(list);
  const headerRow = columns.map(c => c.header);
  const dataRows = list.map(d => columns.map(c => c.get(d)));

  const metaRows = [
    ['Relatório de Disciplinas Filtradas'],
    [`Gerado em: ${meta.dateStr}`],
    [`Filtros utilizados: ${meta.filtersStr}`],
    [`Quantidade de disciplinas filtradas: ${meta.count}`],
    [],
  ];
  const offset = metaRows.length; // linhas antes do cabeçalho da tabela

  const ws = XLSX.utils.aoa_to_sheet([...metaRows, headerRow, ...dataRows]);

  columns.forEach((col, colIdx) => {
    if (!col.link) return;
    dataRows.forEach((row, rowIdx) => {
      const url = row[colIdx];
      if (!url) return;
      const cellRef = XLSX.utils.encode_cell({ r: rowIdx + offset + 1, c: colIdx });
      const cell = ws[cellRef];
      if (cell) {
        cell.l = { Target: url };
        cell.s = { font: { color: { rgb: 'FF8F00' }, underline: true } };
      }
    });
  });

  ws['!cols'] = columns.map(c => ({ wch: c.link ? 28 : (c.header === 'Ementa' ? 50 : 20) }));
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(columns.length - 1, 0) } }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Disciplinas');
  XLSX.writeFile(wb, `${exportFileBaseName()}.xlsx`);
}

/* ── PDF ─────────────────────────────────────────────────── */
function drawWrappedText(doc, text, x, y, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach((line, i) => doc.text(line, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}

function exportToPDF() {
  const list = getExportList();
  if (!list.length) { window.showToast?.('Nenhum resultado para exportar.', 'error'); return; }

  const columns = getActiveColumns(list);
  const meta = getExportMeta(list);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.text('Relatório de Disciplinas Filtradas', 20, 20);

  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  let metaY = 34;
  metaY = drawWrappedText(doc, `Gerado em: ${meta.dateStr}`, 20, metaY, 800, 11) + 2;
  metaY = drawWrappedText(doc, `Filtros utilizados: ${meta.filtersStr}`, 20, metaY, 800, 11) + 2;
  metaY = drawWrappedText(doc, `Quantidade de disciplinas filtradas: ${meta.count}`, 20, metaY, 800, 11) + 8;

  const head = [columns.map(c => c.header)];
  const body = list.map(d => columns.map(c => c.get(d)));

  const linkMap = {};
  list.forEach((d, rowIdx) => {
    columns.forEach((col, colIdx) => {
      if (col.link && d && col.get(d)) linkMap[`${rowIdx}_${colIdx}`] = col.get(d);
    });
  });

  doc.autoTable({
    head,
    body,
    startY: metaY,
    styles: { fontSize: 6, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [255, 143, 0] },
    margin: { top: 30, left: 20, right: 20 },
    didDrawCell: data => {
      if (data.section !== 'body') return;
      const url = linkMap[`${data.row.index}_${data.column.index}`];
      if (url) {
        doc.setTextColor(255, 143, 0);
        doc.textWithLink('Abrir', data.cell.x + 3, data.cell.y + data.cell.height / 2 + 2, { url });
        doc.setTextColor(0, 0, 0);
      }
    },
    didParseCell: data => {
      if (data.section === 'body' && linkMap[`${data.row.index}_${data.column.index}`]) {
        data.cell.text = [];
      }
    },
  });

  doc.save(`${exportFileBaseName()}.pdf`);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('exportExcelBtn')?.addEventListener('click', exportToExcel);
  document.getElementById('exportPdfBtn')?.addEventListener('click', exportToPDF);
});
