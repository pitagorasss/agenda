# 📋 Agenda

Sistema web de gestão de tarefas e rotina para equipes com calendário compartilhado, rotina semanal estruturada, relatórios inteligentes e notificações em tempo real.

---

## ⚡ Funcionalidades Principais

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | Visão unificada do dia: filtros por usuário/status, tarefas atrasadas, taxa de conclusão, agenda de hoje |
| **Agenda** | Calendário mensal compartilhado com tarefas coloridas. Criar, editar e excluir no contexto do dia |
| **Rotina** | Grade semanal de blocos horários fixos com confirmação de cumprimento, drag-drop e espelhamento |
| **Relatórios** | Análise de atividades com filtros por período, status, prioridade, categoria e responsável |
| **Estatísticas** | KPIs do período (total/concluídas/pendentes, taxa de conclusão) e tendências |
| **Evolução** | Observações de melhoria/desempenho com níveis de urgência e rastreabilidade |
| **Notificações** | Lembretes na hora + alertas de conclusão (Web Notifications com som) |

---

## 🛠 Stack Técnico

```
Frontend:     React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · React Router v7
Estado:       Zustand
Backend:      Supabase (Auth · Postgres · Realtime · Storage)
UI:           Radix UI · Framer Motion · Recharts · Sonner · Lucide
Qualidade:    Vitest · oxlint · GitHub Actions CI/CD
```

---

## 📦 Pré-requisitos

- **Node.js** ≥ 22.12.0
- **Projeto Supabase** (ou CLI local com migrations)

---

## 🚀 Quick Start

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

Preencha com valores do seu projeto Supabase:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=seu_anon_key_aqui
```

### 3. Aplicar schema do banco
```bash
supabase db push
```

### 4. Iniciar desenvolvimento
```bash
npm run dev
```

---

## 📜 Scripts Disponíveis

| Comando | Função |
|---------|--------|
| `npm run dev` | Servidor Vite em desenvolvimento |
| `npm run build` | Typecheck + build otimizado |
| `npm run lint` | Validação de código (oxlint) |
| `npm test` | Suite de testes (Vitest) |
| `npm run test:watch` | Testes em modo watch |
| `npm run preview` | Preview da build final |

---

## 📁 Arquitetura do Projeto

```
src/
├── components/
│   ├── agenda/      Calendário, tarefas, rotina, categorias
│   ├── layout/      Sidebar e dashboard layout
│   └── ui/          Kit de componentes (button, card, dialog, etc)
├── hooks/           useAuth, notificações, custom hooks
├── lib/             Cliente Supabase, utilitários, cálculos
├── pages/           Rotas: Login, Dashboard, Agenda, Rotina, etc
├── stores/          Zustand (auth, agenda)
└── types/           TypeScript types (espelho do banco)

supabase/
└── migrations/      Schema, RLS policies, triggers, índices
```

---

## 🗄 Banco de Dados

**Tabelas principais:**
- `tasks` · `task_categories` · `profiles` · `evolution_observations`
- `notifications` · `routine_slots` · `routine_slot_completions`

**Segurança & Automação:**
- RLS habilitado em todas as tabelas
- Trigger `handle_new_user` — sincroniza perfis
- Trigger `notify_task_completed` — alerta conclusão de tarefa

---

## 🌐 Deploy

### Vercel
1. `vercel.json` já configura SPA rewrite
2. Configure variáveis no dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### CI/CD
- `.github/workflows/ci.yml` — lint, testes e build em push/PR para `main`

---

## 📄 Licença

Uso interno.
