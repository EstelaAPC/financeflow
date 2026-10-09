import { Transaction } from '../../models/transaction';

function dateDaysAgo(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

const demoRows: Array<[number, string, number, string, Transaction['type']]> = [
  [2, 'Mercado da semana', 286.4, 'Alimentação', 'Expense'],
  [4, 'Salário mensal', 4200, 'Salário', 'Income'],
  [7, 'Metrô e ônibus', 68.5, 'Transporte', 'Expense'],
  [10, 'Plano de celular', 59.9, 'Assinaturas', 'Expense'],
  [13, 'Consulta médica', 180, 'Saúde', 'Expense'],
  [16, 'Projeto de identidade visual', 650, 'Freelance', 'Income'],
  [19, 'Conta de energia', 142.8, 'Moradia', 'Expense'],
  [23, 'Cinema no fim de semana', 92, 'Lazer', 'Expense'],
  [28, 'Curso de fotografia', 129.9, 'Educação', 'Expense'],
  [33, 'Feira e hortifruti', 118.3, 'Alimentação', 'Expense'],
  [37, 'Salário mensal', 4200, 'Salário', 'Income'],
  [41, 'Aplicativo de música', 21.9, 'Assinaturas', 'Expense'],
  [46, 'Corrida por aplicativo', 37.4, 'Transporte', 'Expense'],
  [51, 'Farmácia', 76.2, 'Saúde', 'Expense'],
  [57, 'Aluguel', 1450, 'Moradia', 'Expense'],
  [62, 'Aula particular', 240, 'Freelance', 'Income'],
  [68, 'Restaurante', 134.7, 'Alimentação', 'Expense'],
  [74, 'Material de estudo', 88, 'Educação', 'Expense'],
  [81, 'Manutenção da bicicleta', 110, 'Outros', 'Expense'],
  [89, 'Salário mensal', 4200, 'Salário', 'Income'],
  [98, 'Cinema e jantar', 156, 'Lazer', 'Expense'],
  [108, 'Internet residencial', 99.9, 'Moradia', 'Expense'],
  [121, 'Freelance de ilustração', 480, 'Freelance', 'Income'],
  [145, 'Compra para casa', 214.5, 'Outros', 'Expense'],
];

export const DEMO_TRANSACTIONS: Transaction[] = demoRows.map(
  ([daysAgo, description, amount, category, type], index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    description,
    amount,
    date: dateDaysAgo(daysAgo),
    category,
    type,
    source: 'DEMO - dados ficticios',
  })
);
