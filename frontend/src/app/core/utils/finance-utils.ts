import { Transaction, TransactionType } from '../../models/transaction';

export interface DashboardSummary {
  balance: number;
  income: number;
  expense: number;
  savings: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  percentage: number;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateBr(value: string): string {
  const date = parseDate(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function calculateFinancialSummary(transactions: Transaction[]): DashboardSummary {
  const income = transactions
    .filter((transaction) => transaction.type === 'Income')
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  const expense = transactions
    .filter((transaction) => transaction.type === 'Expense')
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  return {
    balance: income - expense,
    income,
    expense,
    savings: income - expense,
  };
}

export function getCategoryBreakdown(
  transactions: Transaction[],
  type: TransactionType = 'Expense'
): CategoryBreakdown[] {
  const filtered = transactions.filter((transaction) => transaction.type === type);
  const total = filtered.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  if (total === 0) {
    return [];
  }

  const grouped = new Map<string, number>();

  filtered.forEach((transaction) => {
    const current = grouped.get(transaction.category) ?? 0;
    grouped.set(transaction.category, current + Number(transaction.amount || 0));
  });

  return [...grouped.entries()]
    .map(([category, totalByCategory]) => ({
      category,
      total: totalByCategory,
      percentage: (totalByCategory / total) * 100,
    }))
    .sort((left, right) => right.total - left.total);
}

export function getPeriodTransactions(transactions: Transaction[], period: '30d' | 'month'): Transaction[] {
  const now = new Date();
  const start = period === '30d'
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  return transactions.filter((transaction) => {
    const date = parseDate(transaction.date);
    return !Number.isNaN(date.getTime()) && date >= start && date <= now;
  });
}

export function getRecentTransactions(transactions: Transaction[], limit = 5): Transaction[] {
  return [...transactions]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, limit);
}

function parseDate(value: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }

  return new Date(value);
}
