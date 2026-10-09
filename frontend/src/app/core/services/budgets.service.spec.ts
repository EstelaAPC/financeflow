import { afterEach, describe, expect, it, vi } from 'vitest';

import { BudgetsService } from './budgets.service';

describe('BudgetsService', () => {
  const service = new BudgetsService();

  afterEach(() => {
    localStorage.clear();
  });

  it('creates, updates and removes month-specific category budgets', () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValueOnce('00000000-0000-4000-8000-000000000001');

    const created = service.saveBudget('2026-10', 'Alimentação', 1200);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      id: '00000000-0000-4000-8000-000000000001',
      month: '2026-10',
      category: 'Alimentação',
      limit: 1200,
    });

    const updated = service.saveBudget('2026-10', 'alimentação', 1500);
    expect(updated).toHaveLength(1);
    expect(updated[0].limit).toBe(1500);
    expect(updated[0].id).toBe('00000000-0000-4000-8000-000000000001');

    expect(service.deleteBudget('00000000-0000-4000-8000-000000000001')).toEqual([]);
  });

  it('rejects corrupted browser storage rather than silently hiding it', () => {
    localStorage.setItem('financeflow.category-budgets.v1', '{"budgets":[]}');
    expect(() => service.getBudgets()).toThrow('formato inválido');
  });
});
