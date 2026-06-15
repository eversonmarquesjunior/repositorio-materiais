# RepoDisciplinas

Repositório de Disciplinas no estilo SciELO — pesquisável, responsivo, com modo claro/escuro.

## Estrutura do Projeto

```
repositorio-disciplinas/
├── index.html                  # Página inicial com busca + resultados
├── pages/
│   ├── disciplina.html         # Página de detalhe de cada disciplina
│   └── sobre.html              # Página institucional / instruções de uso
├── css/
│   └── style.css               # Todos os estilos (tokens, dark mode, componentes)
└── js/
    ├── data.js                 # ★ Fonte de dados (substituir pela API)
    ├── app.js                  # Lógica da busca, filtros e renderização
    └── detalhe.js              # Lógica da página de detalhe
```

## Stack

- **HTML5** semântico
- **Tailwind CSS** via CDN (utilidades de base)
- **CSS customizado** (`css/style.css`) com tokens de design e dark mode
- **Vanilla JavaScript** — sem frameworks, sem bundler

## Como funciona a busca

A busca filtra os campos: `nome`, `codigo`, `area`, `professor` e `ementa`.  
Os filtros rápidos (botões de área) se combinam com o texto digitado.  
A ordenação funciona sobre os resultados já filtrados.

## Integrando com banco de dados

### Opção 1 — API REST

Em `js/data.js`, substitua a atribuição de `window.disciplinas` por:

```javascript
async function loadDisciplinas() {
  const res = await fetch('/api/disciplinas');
  window.disciplinas = await res.json();
}
await loadDisciplinas();
```

### Opção 2 — Supabase

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadDisciplinas() {
  const { data, error } = await supabase.from('disciplinas').select('*');
  if (!error) window.disciplinas = data;
}
```

### Estrutura da tabela `disciplinas` (PostgreSQL / Supabase)

```sql
CREATE TABLE disciplinas (
  id            TEXT PRIMARY KEY,
  codigo        TEXT,
  nome          TEXT NOT NULL,
  area          TEXT,
  carga_horaria TEXT,
  periodo       TEXT,
  professor     TEXT,
  status        TEXT DEFAULT 'ativo',  -- 'ativo' | 'inativo' | 'revisao'
  ementa        TEXT,
  objetivos     TEXT,
  conteudo      TEXT[],                -- array de tópicos
  bibliografia  JSONB,                 -- { basica: [], complementar: [] }
  cursos        TEXT[],
  obs           TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

> **Atenção:** se usar snake_case no banco, adapte os nomes dos campos no `js/data.js`
> ou faça o mapeamento na camada de serviço.

## Personalização rápida

| O que mudar               | Onde                          |
|---------------------------|-------------------------------|
| Nome do sistema           | `index.html` + `css/style.css` (`.logo-name`) |
| Cor de destaque           | `css/style.css` → `--accent`  |
| Fonte                     | `<link>` no `<head>` de cada HTML |
| Campos exibidos nos cards | `js/app.js` → função `cardHTML()` |
| Campos na página detalhe  | `js/detalhe.js` → função `renderDetail()` |

## Observações

- Nenhum servidor necessário para rodar — abra `index.html` direto no navegador ou sirva com Live Server no VS Code.
- O estado de busca é preservado na URL (`?q=cálculo&area=Exatas`) — compartilhável e navegável pelo histórico.
- O layout é responsivo até 320px de largura.
- Modo impressão CSS embutido para a página de detalhe.
