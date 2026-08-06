# Plano de Implementação — Deploy Vercel + Atualização das Stacks + Melhorias

Data: 06/08/2026
Projeto: agenda

## Decisões de escopo
- Tailwind: migrar para **v4.3** (plugin `@tailwindcss/vite`, config CSS-first).
- TypeScript: subir para **7.0.2** (nova major, compilador nativo).
- Storage de notas fiscais: bucket `contracts` → **privado** + URLs assinadas.
- Escopo: **completo** (deploy-ready + deps + melhorias de qualidade).

---

## Fase 0 — Documentação
- Criar pasta `modificacoes/` com este plano persistido no repositório.

## Fase 1 — Deploy-ready para Vercel
1. **`vercel.json`** na raiz (commitado):
   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
     "trailingSlash": false
   }
   ```
2. **Remover `.env` do tracking**: `git rm --cached .env` (o arquivo já está no `.gitignore`).
3. **`engines` no package.json**: `"node": ">=22.12.0"` (compatibilidade com Vite 8).
4. **README**: documentar:
   - Env Vars no dashboard da Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
   - Deploy da edge function `send-invoice-email` no Supabase + secret `RESEND_API_KEY`.
   - Verificação de domínio no Resend (o remetente `onboarding@resend.dev` só envia para e-mail próprio).

## Fase 1C — Renomear projeto para "agenda"
1. **`package.json`**: alterar `"name"` de `travessia-erp` → `agenda`.
2. **`index.html`**: trocar o título `<title>Sistema Travessia ERP</title>` → `Agenda`.
3. **Marcas/textos de "Travessia"**: alinhar referências do projeto para `agenda`:
   - `src/pages/Login.tsx` (CardTitle "Instituto Travessia", CardDescription).
   - `src/components/layout/Sidebar.tsx` e `src/components/layout/Header.tsx` ("Instituto Travessia"/"Travessia ERP").
   - `supabase/functions/send-invoice-email/index.ts` (rodapé "Enviado automaticamente pelo Travessia ERP" e remetente).

## Fase 2 — Atualização de dependências
| Pacote | De → Para |
|---|---|
| tailwindcss | `3.4.19 → 4.3.3` + novo `@tailwindcss/vite` (remover `postcss`, `autoprefixer`, `tailwindcss-animate`; adicionar `tw-animate-css`) |
| typescript | `6.0.3 → 7.0.2` |
| framer-motion | `12.42.2 → 13.0.0` (sem breaking para uso em JS/React) |
| @supabase/supabase-js | `2.110.8 → 2.112.2` |
| vite | `8.1.5 → 8.2.1` |
| @vitejs/plugin-react | `6.0.4 → 6.0.5` |
| oxlint | `1.75 → 1.77` |
| lucide-react | → latest |
| react-router-dom | → latest minor |
| postcss | → latest (se ainda necessário) |
| @radix-ui/* (6 pacotes) | → latest |

**Adaptações de config:**
- `vite.config.ts`: adicionar plugin `tailwindcss()`; remover `postcss.config.js` e `autoprefixer`.
- `tailwind.config.js` → **CSS-first no `index.css`**:
  - `@import "tailwindcss";`
  - `@custom-variant dark (&:where(.dark, .dark *));`
  - `@theme` com `--font-sans: 'Inter', system-ui, sans-serif`, cores `hsl(var(--...))`, `--radius-*` e keyframes `blink`.
- `tsconfig.app.json`: remover `ignoreDeprecations: "6.0"`; validar `tsc -b` no TS 7.

## Fase 3 — Qualidade e segurança
1. **RLS**: migration nova com UPDATE/DELETE de `contracts`, `contract_categories`, `contract_products` restritos a `created_by = auth.uid()` (espelha a regra existente de `tasks`).
2. **Error handling nos stores**: parar de ignorar `error`; só mutar o estado local após sucesso no banco; propagar erro para a UI.
3. **Toasts**: adicionar `sonner` + `<Toaster/>`; feedback de sucesso/erro em todos os CRUDs, upload de NF e envio de e-mail; substituir `confirm()`/`alert()` nativos por `ConfirmDialog`.
4. **Refactor `ContractCard.tsx` (383 linhas)** → `ContractCard`, `ContractProductRow`, `ContractCategorySection`, `ContractRenewDialog`, `ConfirmDialog`.
5. **Limpeza**: remover hooks mortos `useContracts`/`useTasks`; remover imports não usados (`User` em TaskCard, `Download` em ContractCard).
6. **Segurança de storage + e-mail**:
   - Bucket `contracts` → **privado** (`public = false` em migration).
   - Usar `createSignedUrl` (7 dias) para o botão "Nota" e para o link do e-mail.
   - Adicionar `htmlEscape` no template HTML da edge function `send-invoice-email` (evitar injeção de HTML).
7. **A11y/UX**: `aria-label` em botões icon-only; corrigir textos sem acento; adicionar `ErrorBoundary` no App.
8. **Migrations**: normalizar nomes para `YYYYMMDDHHMMSS_*.sql`; criar novos alters (RLS, bucket privado); remover duplicata `20240101_add_invoice_email.sql` (igual a `006_invoice_email.sql`).

## Fase B — Verificação
- `npm run build` (TS 7 + Vite 8).
- `npm run lint` (oxlint limpo).
- `npm run preview` smoke test.
- Commit.

## Registro de execução (06/08/2026)
Todas as fases foram implementadas. Desvios em relação ao plano:
- **Migrations renomeadas**: mantidos os nomes `001_..006_` (já aplicados no
  projeto Supabase vinculado); renomear forçaria o `supabase db push` a
  reaplicar migrations antigas. Apenas a duplicata
  `20240101_add_invoice_email.sql` foi removida e os novos alters (RLS owner +
  bucket privado) foram adicionados como `20260806000001_*.sql` e
  `20260806000002_*.sql`.
- **Bucket `contracts`**: ficou privado (`public = false`). `uploadInvoice`
  agora retorna o path do objeto e `getSignedUrl` (7 dias) gera o link sob
  demanda; o botão "Nota" e o e-mail usam URL assinada.
- **Endpoint de verificação**: `htmlEscape` adicionado no template HTML da edge
  function `send-invoice-email`.

Fora do escopo de código (manual, documentado no README)
- Dashboard Vercel: importar repositório, definir Node 22 / `engines`, configurar Env Vars.
- Supabase: `supabase functions deploy send-invoice-email`, secret `RESEND_API_KEY`, domínio verificado no Resend.