import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { TransactionsService } from '../../core/services/transactions.service';
import { formatCurrency } from '../../core/utils/finance-utils';
import { Transaction } from '../../models/transaction';

interface MonthlyPoint {
  key: string;
  label: string;
  income: number;
  expense: number;
}

interface CategoryTotal {
  category: string;
  amount: number;
  share: number;
}

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsPageComponent implements OnInit {
  transactions: Transaction[] = [];
  loading = true;
  error = '';
  monthOffset = 0;

  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  get selectedMonthKey(): string {
    const date = this.selectedMonthDate;
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

  get selectedMonthLabel(): string {
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(this.selectedMonthDate);
  }

  get monthTransactions(): Transaction[] {
    return this.transactions.filter((transaction) => this.transactionMonthKey(transaction.date) === this.selectedMonthKey);
  }

  get income(): number {
    return this.sumByType(this.monthTransactions, 'Income');
  }

  get expense(): number {
    return this.sumByType(this.monthTransactions, 'Expense');
  }

  get balance(): number {
    return this.income - this.expense;
  }

  get categoryTotals(): CategoryTotal[] {
    const totals = new Map<string, number>();
    this.monthTransactions
      .filter((transaction) => transaction.type === 'Expense')
      .forEach((transaction) => {
        totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + Number(transaction.amount));
      });

    return [...totals.entries()]
      .map(([category, amount]) => ({
        category,
        amount,
        share: this.expense > 0 ? (amount / this.expense) * 100 : 0,
      }))
      .sort((left, right) => right.amount - left.amount);
  }

  get monthlyTrend(): MonthlyPoint[] {
    const points: MonthlyPoint[] = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(this.selectedMonthDate.getFullYear(), this.selectedMonthDate.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthTransactions = this.transactions.filter((transaction) => this.transactionMonthKey(transaction.date) === key);
      points.push({
        key,
        label: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', ''),
        income: this.sumByType(monthTransactions, 'Income'),
        expense: this.sumByType(monthTransactions, 'Expense'),
      });
    }
    return points;
  }

  get monthsWithTrendData(): number {
    return this.monthlyTrend.filter((point) => point.income > 0 || point.expense > 0).length;
  }

  get maxTrendValue(): number {
    return Math.max(1, ...this.monthlyTrend.flatMap((point) => [point.income, point.expense]));
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
        this.error = error instanceof Error ? error.message : 'Não foi possível carregar os relatórios.';
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  private get selectedMonthDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + this.monthOffset, 1);
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
        this.error = error instanceof Error ? error.message : 'Não foi possível carregar os relatórios.';
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  private sumByType(transactions: Transaction[], type: Transaction['type']): number {
    return transactions
      .filter((transaction) => transaction.type === type)
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
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
