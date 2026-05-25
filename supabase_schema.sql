-- =====================================================
-- NEP - Sistema de Correcao Assistida
-- Schema do banco de dados (Supabase / PostgreSQL)
-- Execute este SQL no editor do Supabase
-- =====================================================

-- Turmas
create table turmas (
    id uuid primary key default gen_random_uuid(),
    nome text not null,
    serie text not null,
    ano integer not null default extract(year from now())::integer,
    criado_em timestamptz default now()
  );

-- Alunos
create table alunos (
    id uuid primary key default gen_random_uuid(),
    turma_id uuid references turmas(id) on delete cascade,
    nome text not null,
    observacoes text,
    criado_em timestamptz default now()
  );

-- Provas
create table provas (
    id uuid primary key default gen_random_uuid(),
    turma_id uuid references turmas(id) on delete cascade,
    nome text not null,
    data date,
    valor_total numeric not null,
    contexto text,
    questoes jsonb not null default '[]',
    criado_em timestamptz default now()
  );

-- Correcoes
create table correcoes (
    id uuid primary key default gen_random_uuid(),
    prova_id uuid references provas(id) on delete cascade,
    aluno_id uuid references alunos(id) on delete cascade,
    fotos_urls text[] default '{}',
    resultado jsonb,
    nota_final numeric,
    status text default 'pendente',
    criado_em timestamptz default now(),
    unique(prova_id, aluno_id)
  );

-- Desabilitar RLS (uso pessoal - sem multi-tenant)
alter table turmas disable row level security;
alter table alunos disable row level security;
alter table provas disable row level security;
alter table correcoes disable row level security;
