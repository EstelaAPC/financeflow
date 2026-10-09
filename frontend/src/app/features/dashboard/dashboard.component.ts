import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TransactionsService } from '../../core/services/transactions.service';
import {
  calculateFinancialSummary,
  formatCurrency,
  getCategoryBreakdown,
  getPeriodTransactions,
  getRecentTransactions,
} from '../../core/utils/finance-utils';
import { Transaction } from '../../models/transaction';
import { FinMascotComponent } from '../../shared/components/fin-mascot/fin-mascot.component';

type PeriodFilter = '30d' | 'month';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FinMascotComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardPageComponent implements OnInit {
  protected readonly Math = Math;
  transactions: Transaction[] = [];
  loading = true;
  error = '';
  selectedPeriod: PeriodFilter = '30d';

  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  formatCurrency(value: number): string {
    return formatCurrency(value);
  }

  get summary() {
    const filtered = this.visibleTransactions;
    return calculateFinancialSummary(filtered);
  }

  get visibleTransactions(): Transaction[] {
    return getPeriodTransactions(this.transactions, this.selectedPeriod);
  }

  get outsidePeriodCount(): number {
    return this.transactions.length - this.visibleTransactions.length;
  }

  get recentTransactions(): Transaction[] {
    return getRecentTransactions(this.visibleTransactions, 5);
  }

  get expenseBreakdown() {
    return getCategoryBreakdown(this.visibleTransactions, 'Expense');
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

  get maxExpenseValue(): number {
    const values = this.expenseBreakdown.map((item) => item.total);
    return values.length > 0 ? Math.max(...values) : 1;
  }

  get trendPoints(): Array<{ label: string; value: number }> {
    const points: Array<{ label: string; value: number }> = [];
    const days = [...this.visibleTransactions]
      .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
      .reduce<Map<string, number>>((acc, transaction) => {
        const key = new Date(transaction.date).toISOString().slice(0, 10);
        const current = acc.get(key) ?? 0;
        acc.set(key, current + (transaction.type === 'Income' ? Number(transaction.amount) : -Number(transaction.amount)));
        return acc;
      }, new Map());

    [...days.entries()].forEach(([date, value]) => {
      points.push({ label: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value });
    });

    if (points.length < 2) {
      return [];
    }

    return points;
  }

  get finMood(): 'welcome' | 'empty' | 'positive' | 'warning' | 'loading' {
    if (this.loading) {
      return 'loading';
    }

    if (this.visibleTransactions.length === 0) {
      return 'empty';
    }

    if (this.summary.balance < 0) {
      return 'warning';
    }

    return 'positive';
  }

  get finMessage(): string {
    if (this.loading) {
      return 'Preparando os números do seu financeiro...';
    }

    if (this.visibleTransactions.length === 0) {
      return 'Ainda não existem transações cadastradas. Adicione a primeira movimentação para começar.';
    }

    if (this.summary.balance < 0) {
      const topExpense = this.expenseBreakdown[0];
      if (topExpense) {
        return `As despesas estão acima das receitas neste período. A categoria ${topExpense.category} lidera o gasto com ${formatCurrency(topExpense.total)}.`;
      }

      return 'As despesas superaram as receitas neste período. Acompanhe os gastos para equilibrar o saldo.';
    }

    const topExpense = this.expenseBreakdown[0];
    if (topExpense) {
      return `O saldo do período está positivo. A maior categoria de despesa continua sendo ${topExpense.category}.`;
    }

    return 'Seu saldo está positivo e o fluxo está em boa ordem neste período.';
  }

  retryLoadTransactions(): void {
    this.loading = true;
    this.error = '';
    this.transactionsService.retryTransactions().subscribe({
      next: (transactions) => {
        this.transactions = [...transactions].sort(
          (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
        );
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.error = error instanceof Error ? error.message : 'Não foi possível carregar as transações.';
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  private loadTransactions(): void {
    this.loading = true;
    this.error = '';

    this.transactionsService.getTransactions().subscribe({
      next: (transactions) => {
        this.transactions = [...transactions].sort(
          (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
        );
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        if (error instanceof Error) {
          this.error = error.message;
        } else {
          this.error = 'Não foi possível carregar as transações. Tente novamente.';
        }
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }
}
