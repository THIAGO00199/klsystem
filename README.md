# KL System — Plataforma de agendamentos online

Protótipo de aplicação web para negócios que trabalham com hora marcada, como barbearias, clínicas e salões. A proposta combina uma experiência pública de agendamento com recursos de gestão para o estabelecimento.

## Base atual

- Next.js App Router com React e TypeScript.
- Integração de cliente com Supabase para autenticação e dados da aplicação.
- Página inicial pública com apresentação do serviço e planos.
- Rotas iniciais para autenticação, páginas de estabelecimentos, serviços, profissionais, horários e agendamentos.

## Desenvolvimento

Requisitos: Node.js compatível com a versão do Next.js declarada em `package.json` e npm.

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

Para compilar e executar as verificações de lint:

```bash
npm run build
npm run lint
```

## Configuração

Crie um arquivo local `.env.local` com a URL do projeto Supabase e a chave anônima pública:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Não envie `.env.local`, chaves service-role, credenciais de banco ou dados de produção ao Git. Os arquivos de ambiente locais são excluídos deste repositório.

## Estado do projeto

Este repositório é uma base inicial de produto, não um serviço de agendamento pronto para produção. Autenticação, políticas do banco, isolamento entre estabelecimentos, pagamentos, concorrência de agendamentos e segurança operacional precisam ser revisados e testados antes de cadastrar empresas ou dados reais de clientes.

---

[Português](./README.md) · [English](./README.en.md) · [Español](./README.es.md)
