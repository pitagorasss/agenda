// Constantes e configurações compartilhadas pela aplicação.

// Abreviações dos dias da semana (iniciando em Domingo), usadas no calendário.
export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Seleção padrão de colunas ao buscar tarefas,
// incluindo a categoria associada (via relacionamento "task_categories").
export const TASK_SELECT = '*, category:task_categories(*)'

// Paleta de cores disponíveis para as categorias de tarefas.
export const COLOR_PALETTE = [
  '#DC2626', // Vermelho
  '#2563EB', // Azul
  '#16A34A', // Verde
  '#F59E0B', // Amarelo
  '#8B5CF6', // Roxo
  '#EC4899', // Rosa
  '#14B8A6', // Teal
  '#F97316', // Laranja
  '#6B7280', // Cinza
  '#EF4444', // Vermelho (red-500, tom mais claro que o primeiro)
]