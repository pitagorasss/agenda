# Alterações — Logo Travessia e Tema

Data: 13/08/2026

## Objetivo
Adicionar o logo da empresa (`img/LOGO_TRAVESSIA.png`) em locais agradáveis do layout e alinhar as cores do tema com as cores do logo.

## Cores do logo
- Verde: `#00CE69`
- Azul-marinho: `#002175`

## Arquivos alterados

### 1. `public/LOGO_TRAVESSIA.png` (novo)
- Copiado de `img/LOGO_TRAVESSIA.png` para a pasta `public/`, permitindo que o logo seja referenciado como `/LOGO_TRAVESSIA.png` nos componentes (o Vite serve `public/` na raiz).

### 2. `src/index.css`
- `--color-brand-green`: `#16a34a` → `#00ce69` (verde do logo)
- `--color-brand-blue`: `#2563eb` → `#002175` (azul-marinho do logo)
- Paleta shadcn (light): `--primary`/`--ring` → `150 100% 40%` (verde do logo); `--secondary` → `223 100% 23%` (azul-marinho)
- Paleta shadcn (dark): `--primary`/`--ring` → `150 70% 50%`; `--secondary` → `223 100% 30%`

### 3. `public/favicon.svg`
- Ícone de casa recolhido para o verde do logo `#00CE69` (antes `#16A34A`), mantendo consistência com a aba do navegador.

### 4. `src/pages/Login.tsx`
- Adicionado o logo centralizado acima do card de login (`h-10 w-auto`).

### 5. `src/components/layout/Sidebar.tsx`
- Adicionado o logo no topo da sidebar. Quando expandida mostra o logo completo; quando recolhida mostra um recorte quadrado de 32px (`object-left`).

### 6. `src/components/layout/DashboardLayout.tsx`
- Substituído o texto "Agenda" do cabeçalho móvel pelo logo (`h-7 w-auto`).

### 7. `src/components/ui/button.tsx`
- Ajustes de hover para combinar com as novas cores:
  - `default`: `hover:bg-green-600` → `hover:bg-[#00b85e]`
  - `secondary`: `hover:bg-blue-600` → `hover:bg-[#001a5c]`

### 8. `src/components/agenda/TaskForm.tsx`
- Botão de submit: `hover:bg-green-600` → `hover:bg-[#00b85e]`

### 9. `src/components/ErrorBoundary.tsx`
- Botão de recarregar: `hover:bg-green-600` → `hover:bg-[#00b85e]`

### 10. Badges de status "Concluída" (3 arquivos)
- `src/pages/Reports.tsx`
- `src/components/agenda/DayTasksModal.tsx`
- `src/components/agenda/TaskCard.tsx`
- Cor `bg-green-500` → `bg-brand-green` para padronizar com o verde do logo.

## Verificação
- `npm run build` executado com sucesso (TypeScript + Vite).
- Logo copiado para `dist/LOGO_TRAVESSIA.png` no build de produção.
