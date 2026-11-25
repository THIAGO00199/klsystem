-- ============================================
-- KL SYSTEM - DATABASE RESET COMPLETO
-- Remove tudo e recria do zero
-- ============================================

-- ============================================
-- 1. REMOVER POLÍTICAS ANTIGAS (se existirem)
-- ============================================
DROP POLICY IF EXISTS "Allow SELECT planos" ON planos;
DROP POLICY IF EXISTS "Allow SELECT empresas" ON empresas;
DROP POLICY IF EXISTS "Allow SELECT personalizacao" ON personalizacao;
DROP POLICY IF EXISTS "Allow INSERT personalizacao" ON personalizacao;
DROP POLICY IF EXISTS "Allow UPDATE personalizacao" ON personalizacao;
DROP POLICY IF EXISTS "Allow DELETE personalizacao" ON personalizacao;
DROP POLICY IF EXISTS "Allow SELECT profissionais" ON profissionais;
DROP POLICY IF EXISTS "Allow INSERT profissionais" ON profissionais;
DROP POLICY IF EXISTS "Allow UPDATE profissionais" ON profissionais;
DROP POLICY IF EXISTS "Allow DELETE profissionais" ON profissionais;
DROP POLICY IF EXISTS "Allow SELECT servicos" ON servicos;
DROP POLICY IF EXISTS "Allow INSERT servicos" ON servicos;
DROP POLICY IF EXISTS "Allow UPDATE servicos" ON servicos;
DROP POLICY IF EXISTS "Allow DELETE servicos" ON servicos;
DROP POLICY IF EXISTS "Allow SELECT horarios" ON horarios;
DROP POLICY IF EXISTS "Allow INSERT horarios" ON horarios;
DROP POLICY IF EXISTS "Allow UPDATE horarios" ON horarios;
DROP POLICY IF EXISTS "Allow DELETE horarios" ON horarios;
DROP POLICY IF EXISTS "Allow SELECT clientes" ON clientes;
DROP POLICY IF EXISTS "Allow INSERT clientes" ON clientes;
DROP POLICY IF EXISTS "Allow UPDATE clientes" ON clientes;
DROP POLICY IF EXISTS "Allow DELETE clientes" ON clientes;
DROP POLICY IF EXISTS "Allow SELECT agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Allow INSERT agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Allow UPDATE agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Allow DELETE agendamentos" ON agendamentos;

-- ============================================
-- 2. DESABILITAR RLS
-- ============================================
ALTER TABLE planos DISABLE ROW LEVEL SECURITY;
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE personalizacao DISABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais DISABLE ROW LEVEL SECURITY;
ALTER TABLE servicos DISABLE ROW LEVEL SECURITY;
ALTER TABLE horarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. ATIVAR RLS NOVAMENTE
-- ============================================
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE personalizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. GRANT PERMISSÕES AO ROLE ANON
-- ============================================
GRANT SELECT ON public.planos TO anon;
GRANT SELECT ON public.empresas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personalizacao TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profissionais TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.horarios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO anon;

-- ============================================
-- 5. CRIAR POLÍTICAS RLS (NOVAS)
-- ============================================

-- PLANOS - Leitura pública
CREATE POLICY "Allow SELECT planos" ON planos FOR SELECT USING (true);

-- EMPRESAS - Leitura pública
CREATE POLICY "Allow SELECT empresas" ON empresas FOR SELECT USING (true);

-- PERSONALIZACAO - Todas operações
CREATE POLICY "Allow SELECT personalizacao" ON personalizacao FOR SELECT USING (true);
CREATE POLICY "Allow INSERT personalizacao" ON personalizacao FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow UPDATE personalizacao" ON personalizacao FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow DELETE personalizacao" ON personalizacao FOR DELETE USING (true);

-- PROFISSIONAIS - Todas operações
CREATE POLICY "Allow SELECT profissionais" ON profissionais FOR SELECT USING (true);
CREATE POLICY "Allow INSERT profissionais" ON profissionais FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow UPDATE profissionais" ON profissionais FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow DELETE profissionais" ON profissionais FOR DELETE USING (true);

-- SERVICOS - Todas operações
CREATE POLICY "Allow SELECT servicos" ON servicos FOR SELECT USING (true);
CREATE POLICY "Allow INSERT servicos" ON servicos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow UPDATE servicos" ON servicos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow DELETE servicos" ON servicos FOR DELETE USING (true);

-- HORARIOS - Todas operações
CREATE POLICY "Allow SELECT horarios" ON horarios FOR SELECT USING (true);
CREATE POLICY "Allow INSERT horarios" ON horarios FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow UPDATE horarios" ON horarios FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow DELETE horarios" ON horarios FOR DELETE USING (true);

-- CLIENTES - Todas operações
CREATE POLICY "Allow SELECT clientes" ON clientes FOR SELECT USING (true);
CREATE POLICY "Allow INSERT clientes" ON clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow UPDATE clientes" ON clientes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow DELETE clientes" ON clientes FOR DELETE USING (true);

-- AGENDAMENTOS - Todas operações
CREATE POLICY "Allow SELECT agendamentos" ON agendamentos FOR SELECT USING (true);
CREATE POLICY "Allow INSERT agendamentos" ON agendamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow UPDATE agendamentos" ON agendamentos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow DELETE agendamentos" ON agendamentos FOR DELETE USING (true);

-- ============================================
-- ✅ PRONTO - Tudo resetado e funcional!
-- ============================================
