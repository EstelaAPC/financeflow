import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  calculateFinancialSummary,
  formatDateBr,
  getCategoryBreakdown,
  getPeriodTransactions,
} from './finance-utils';

describe('finance-utils', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates balances from transactions', () => {
    const transactions = [
      { id: '1', description: 'Salário', amount: 4200, date: '2025-01-08', category: 'Salário', type: 'Income' as const },
      { id: '2', description: 'Mercado', amount: 900, date: '2025-01-09', category: 'Alimentação', type: 'Expense' as const },
      { id: '3', description: 'Aluguel', amount: 1500, date: '2025-01-12', category: 'Moradia', type: 'Expense' as const },
    ];

    const summary = calculateFinancialSummary(transactions);

    expect(summary.income).toBe(4200);
    expect(summary.expense).toBe(2400);
    expect(summary.balance).toBe(1800);
  });

  it('aggregates category totals for expenses', () => {
    const transactions = [
      { id: '1', description: 'Mercado', amount: 340, date: '2025-01-08', category: 'Alimentação', type: 'Expense' as const },
      { id: '2', description: 'Supermercado', amount: 270, date: '2025-01-10', category: 'Alimentação', type: 'Expense' as const },
      { id: '3', description: 'Combustível', amount: 180, date: '2025-01-12', category: 'Transporte', type: 'Expense' as const },
    ];

    const result = getCategoryBreakdown(transactions, 'Expense');

    expect(result[0].category).toBe('Alimentação');
    expect(result[0].total).toBe(610);
  });

  it('formats date-only values without shifting the calendar day', () => {
    expect(formatDateBr('2025-01-08')).toBe('08/01/2025');
  });

  it('uses the current calendar month for the month filter', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-09T12:00:00'));
    const transactions = [
      { id: '1', description: 'Anterior', amount: 10, date: '2026-09-30', category: 'Teste', type: 'Expense' as const },
      { id: '2', description: 'Este mês', amount: 20, date: '2026-10-01', category: 'Teste', type: 'Expense' as const },
      { id: '3', description: 'Futuro', amount: 30, date: '2026-10-10', category: 'Teste', type: 'Expense' as const },
    ];

    expect(getPeriodTransactions(transactions, 'month').map((transaction) => transaction.id)).toEqual(['2']);
  });
});
