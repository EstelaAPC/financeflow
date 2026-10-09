import { Injectable } from '@angular/core';

import { CategoryBudget } from '../../models/budget';

const STORAGE_KEY = 'financeflow.category-budgets.v1';

@Injectable({
  providedIn: 'root',
})
export class BudgetsService {
  getBudgets(): CategoryBudget[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      throw new Error('Os orçamentos salvos neste navegador estão em um formato inválido.');
    }

    return parsed.map((item: unknown, index: number) => {
      if (typeof item !== 'object' || item === null) {
        throw new Error(`O orçamento ${index + 1} salvo neste navegador é inválido.`);
      }

      const value = item as Record<string, unknown>;
      const id = value['id'];
      const month = value['month'];
      const category = value['category'];
      const limit = value['limit'];
      if (
        typeof id !== 'string' ||
        id.length === 0 ||
        typeof month !== 'string' ||
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
        typeof category !== 'string' ||
        category.trim().length === 0 ||
        typeof limit !== 'number' ||
        !Number.isFinite(limit) ||
        limit <= 0
      ) {
        throw new Error(`O orçamento ${index + 1} salvo neste navegador contém dados inválidos.`);
      }

      return { id, month, category, limit };
    });
  }

  saveBudget(month: string, category: string, limit: number): CategoryBudget[] {
    const budgets = this.getBudgets();
    const normalizedCategory = category.trim();
    const existingIndex = budgets.findIndex(
      (budget) => budget.month === month && budget.category.toLocaleLowerCase() === normalizedCategory.toLocaleLowerCase()
    );

    if (existingIndex >= 0) {
      budgets[existingIndex] = { ...budgets[existingIndex], limit };
    } else {
      budgets.push({
        id: globalThis.crypto.randomUUID(),
        month,
        category: normalizedCategory,
        limit,
      });
    }

    this.writeBudgets(budgets);
    return budgets;
  }

  deleteBudget(id: string): CategoryBudget[] {
    const budgets = this.getBudgets().filter((budget) => budget.id !== id);
    this.writeBudgets(budgets);
    return budgets;
  }

  private writeBudgets(budgets: CategoryBudget[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
  }
}
