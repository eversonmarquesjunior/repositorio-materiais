-- ============================================================
--  REPOSITÓRIO DE DISCIPLINAS — Schema Supabase
--  Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Tabela principal
CREATE TABLE IF NOT EXISTS disciplinas (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Campos obrigatórios
  nome             text NOT NULL,
  modelo           text NOT NULL,

  -- Campos de classificação
  status           text,
  modulo           text,

  -- Links Moodle / DP
  link_moodle_wae  text,
  link_dp_wae      text,
  link_moodle_erp  text,
  link_dp_erp      text,
  link_moodle_pos  text,
  link_inova       text,

  -- Links de materiais
  dropbox          text,
  google_drive     text,
  sharepoint       text,
  apostila_html    text,
  youtube          text,
  soundcloud       text,

  -- Texto livre
  obs              text,

  -- Timestamps
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Trigger: atualiza updated_at automaticamente ─────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_disciplinas_updated_at
  BEFORE UPDATE ON disciplinas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Tabela: historico ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS historico (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id    uuid NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  nome_disciplina  text,
  data             date NOT NULL,
  texto            text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Tabela: retornos ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS retornos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina_id    uuid NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
  nome_disciplina  text,
  data             date NOT NULL,
  texto            text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Trigger: preenche nome_disciplina automaticamente ────────
CREATE OR REPLACE FUNCTION set_nome_disciplina()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  SELECT nome INTO NEW.nome_disciplina FROM disciplinas WHERE id = NEW.disciplina_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_historico_nome
  BEFORE INSERT ON historico
  FOR EACH ROW EXECUTE FUNCTION set_nome_disciplina();

CREATE OR REPLACE TRIGGER trg_retornos_nome
  BEFORE INSERT ON retornos
  FOR EACH ROW EXECUTE FUNCTION set_nome_disciplina();

-- ── Vínculo de material compartilhado ───────────────────────
-- Execute este ALTER TABLE no Supabase SQL Editor após a criação inicial:
-- ALTER TABLE disciplinas ADD COLUMN IF NOT EXISTS disciplina_pai_id uuid REFERENCES disciplinas(id) ON DELETE SET NULL;

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;

ALTER TABLE historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE retornos  ENABLE ROW LEVEL SECURITY;

-- Leitura pública (visitantes e admins), escrita somente para usuários
-- autenticados via Supabase Auth (os 5 admins). Execute este bloco no
-- SQL Editor do Supabase para atualizar as policies já existentes.
DROP POLICY IF EXISTS "leitura_publica"  ON disciplinas;
DROP POLICY IF EXISTS "escrita_publica"  ON disciplinas;
DROP POLICY IF EXISTS "edicao_publica"   ON disciplinas;
DROP POLICY IF EXISTS "exclusao_publica" ON disciplinas;

CREATE POLICY "leitura_publica"    ON disciplinas FOR SELECT USING (true);
CREATE POLICY "escrita_admin"      ON disciplinas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "edicao_admin"       ON disciplinas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "exclusao_admin"     ON disciplinas FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "leitura_publica"  ON historico;
DROP POLICY IF EXISTS "escrita_publica"  ON historico;
DROP POLICY IF EXISTS "edicao_publica"   ON historico;
DROP POLICY IF EXISTS "exclusao_publica" ON historico;

CREATE POLICY "leitura_publica"    ON historico FOR SELECT USING (true);
CREATE POLICY "escrita_admin"      ON historico FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "edicao_admin"       ON historico FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "exclusao_admin"     ON historico FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "leitura_publica"  ON retornos;
DROP POLICY IF EXISTS "escrita_publica"  ON retornos;
DROP POLICY IF EXISTS "edicao_publica"   ON retornos;
DROP POLICY IF EXISTS "exclusao_publica" ON retornos;

CREATE POLICY "leitura_publica"    ON retornos FOR SELECT USING (true);
CREATE POLICY "escrita_admin"      ON retornos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "edicao_admin"       ON retornos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "exclusao_admin"     ON retornos FOR DELETE USING (auth.role() = 'authenticated');
