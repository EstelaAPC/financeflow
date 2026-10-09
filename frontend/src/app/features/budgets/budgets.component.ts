import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BudgetsService } from '../../core/services/budgets.service';
import { TransactionsService } from '../../core/services/transactions.service';
import { formatCurrency } from '../../core/utils/finance-utils';
import { CategoryBudget } from '../../models/budget';
import { Transaction } from '../../models/transaction';

interface BudgetProgress extends CategoryBudget {
  spent: number;
  percent: number;
  remaining: number;
}

@Component({
  selector: 'app-budgets-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './budgets.component.html',
  styleUrl: './budgets.component.scss',
})
export class BudgetsPageComponent implements OnInit {
  protected readonly Math = Math;
  transactions: Transaction[] = [];
  budgets: CategoryBudget[] = [];
  loading = true;
  error = '';
  budgetError = '';
  monthOffset = 0;
  category = '';
  limit: number | null = null;
  saving = false;
  pendingDeleteId: string | null = null;

  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly budgetsService: BudgetsService,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadBudgets();
    this.loadTransactions();
  }

  get monthKey(): string {
    const date = this.selectedMonth;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  get isDemoMode(): boolean {
    return this.transactionsService.state.source === 'demo';
  }

  get apiUnavailable(): boolean {
    return this.transactionsService.state.apiUnavailable;
  }

  get apiEmpty(): boolean {
    return this.transactionsService.state.apiEmpty;
  }

  get monthLabel(): string {
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(this.selectedMonth);
  }

  get monthBudgets(): BudgetProgress[] {
    return this.budgets
      .filter((budget) => budget.month === this.monthKey)
      .map((budget) => {
        const spent = this.transactions
          .filter((transaction) =>
            transaction.type === 'Expense' &&
            transaction.category.toLocaleLowerCase() === budget.category.toLocaleLowerCase() &&
            this.transactionMonthKey(transaction.date) === this.monthKey
          )
          .reduce((total, transaction) => total + Number(transaction.amount), 0);
        return {
          ...budget,
          spent,
          percent: Math.min(100, (spent / budget.limit) * 100),
          remaining: budget.limit - spent,
        };
      })
      .sort((left, right) => right.spent / right.limit - left.spent / left.limit);
  }

  get monthlyExpenses(): number {
    return this.transactions
      .filter((transaction) => transaction.type === 'Expense' && this.transactionMonthKey(transaction.date) === this.monthKey)
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
  }

  get totalBudget(): number {
    return this.monthBudgets.reduce((total, item) => total + item.limit, 0);
  }

  get totalBudgetedSpend(): number {
    return this.monthBudgets.reduce((total, item) => total + item.spent, 0);
  }

  get totalRemaining(): number {
    return this.totalBudget - this.totalBudgetedSpend;
  }

  get unbudgetedCategories(): string[] {
    const known = new Set(this.monthBudgets.map((budget) => budget.category.toLocaleLowerCase()));
    return [...new Set(
      this.transactions
        .filter((transaction) => transaction.type === 'Expense' && this.transactionMonthKey(transaction.date) === this.monthKey)
        .map((transaction) => transaction.category)
        .filter((category) => !known.has(category.toLocaleLowerCase()))
    )];
  }

  formatCurrency(value: number): string {
    return formatCurrency(value);
  }

  previousMonth(): void {
    this.monthOffset -= 1;
  }

  nextMonth(): void {
    if (this.monthOffset < 0) {
      this.monthOffset += 1;
    }
  }

  saveBudget(): void {
    const normalizedCategory = this.category.trim();
    const normalizedLimit = Number(this.limit);
    if (!normalizedCategory || !Number.isFinite(normalizedLimit) || normalizedLimit <= 0 || this.saving) {
      return;
    }

    this.saving = true;
    this.budgetError = '';
    try {
      this.budgets = this.budgetsService.saveBudget(this.monthKey, normalizedCategory, normalizedLimit);
      this.category = '';
      this.limit = null;
    } catch (error: unknown) {
      this.budgetError = error instanceof Error
        ? `Não foi possível salvar o limite: ${error.message}`
        : 'Não foi possível salvar o limite neste navegador.';
    } finally {
      this.saving = false;
      this.changeDetector.markForCheck();
    }
  }

  startBudgetFor(category: string): void {
    this.category = category;
  }

  cancelDelete(): void {
    this.pendingDeleteId = null;
  }

  confirmDelete(id: string): void {
    try {
      this.budgets = this.budgetsService.deleteBudget(id);
      this.pendingDeleteId = null;
      this.budgetError = '';
    } catch (error: unknown) {
      this.budgetError = error instanceof Error
        ? `Não foi possível remover o limite: ${error.message}`
        : 'Não foi possível remover o limite neste navegador.';
    }
  }

  retry(): void {
    this.loading = true;
    this.error = '';
    this.transactionsService.retryTransactions().subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.error = error instanceof Error ? error.message : 'Não foi possível carregar as despesas.';
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  private get selectedMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + this.monthOffset, 1);
  }

  private loadBudgets(): void {
    try {
      this.budgets = this.budgetsService.getBudgets();
    } catch (error: unknown) {
      this.budgetError = error instanceof Error
        ? `Não foi possível ler os limites locais: ${error.message}`
        : 'Não foi possível ler os limites salvos neste navegador.';
    }
  }

  private loadTransactions(): void {
    this.loading = true;
    this.error = '';
    this.transactionsService.getTransactions().subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.error = error instanceof Error ? error.message : 'Não foi possível carregar as despesas.';
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  private transactionMonthKey(value: string): string {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const date = dateOnly
      ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
      : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}
