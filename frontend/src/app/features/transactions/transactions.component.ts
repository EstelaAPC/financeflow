import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TransactionsService } from '../../core/services/transactions.service';
import { formatCurrency, getCategoryBreakdown } from '../../core/utils/finance-utils';
import { CreateTransactionRequest, Transaction, TransactionType } from '../../models/transaction';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsPageComponent implements OnInit {
  protected readonly Math = Math;
  transactions: Transaction[] = [];
  loading = true;
  error = '';
  operationNotice = '';
  isSubmitting = false;
  showForm = false;
  editingId: string | null = null;
  searchTerm = '';
  typeFilter: 'all' | TransactionType = 'all';
  categoryFilter = 'all';
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' = 'date-desc';
  page = 1;
  pageSize = 6;
  deleteTarget: string | null = null;

  transactionForm: FormGroup;

  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly changeDetector: ChangeDetectorRef
  ) {
    this.transactionForm = this.formBuilder.group({
      description: ['', [Validators.required, Validators.maxLength(200)]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      date: ['', Validators.required],
      category: ['', [Validators.required, Validators.maxLength(100)]],
      type: ['Expense', Validators.required],
      source: [''],
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      if (params.get('mode') === 'create') {
        this.openCreateForm();
      }
    });

    this.loadTransactions();
  }

  get categories(): string[] {
    return [...new Set(this.transactions.map((transaction) => transaction.category).filter(Boolean))].sort();
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

  get filteredTransactions(): Transaction[] {
    const normalizedTerm = this.searchTerm.trim().toLowerCase();

    const filtered = this.transactions.filter((transaction) => {
      const matchesSearch =
        normalizedTerm.length === 0 ||
        transaction.description.toLowerCase().includes(normalizedTerm) ||
        transaction.category.toLowerCase().includes(normalizedTerm);

      const matchesType = this.typeFilter === 'all' || transaction.type === this.typeFilter;
      const matchesCategory = this.categoryFilter === 'all' || transaction.category === this.categoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });

    return filtered.sort((left, right) => {
      switch (this.sortBy) {
        case 'date-asc':
          return new Date(left.date).getTime() - new Date(right.date).getTime();
        case 'amount-desc':
          return Number(right.amount) - Number(left.amount);
        case 'amount-asc':
          return Number(left.amount) - Number(right.amount);
        case 'date-desc':
        default:
          return new Date(right.date).getTime() - new Date(left.date).getTime();
      }
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTransactions.length / this.pageSize));
  }

  get paginatedTransactions(): Transaction[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredTransactions.slice(start, start + this.pageSize);
  }

  get summary() {
    const totalExpense = this.transactions
      .filter((transaction) => transaction.type === 'Expense')
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const totalIncome = this.transactions
      .filter((transaction) => transaction.type === 'Income')
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    return {
      expense: totalExpense,
      income: totalIncome,
      balance: totalIncome - totalExpense,
    };
  }

  get categoryBreakdown() {
    return getCategoryBreakdown(this.transactions, 'Expense');
  }

  formatCurrency(value: number): string {
    return formatCurrency(value);
  }

  openCreateForm(): void {
    this.editingId = null;
    this.transactionForm.reset({
      description: '',
      amount: null,
      date: new Date().toISOString().slice(0, 10),
      category: '',
      type: 'Expense',
      source: '',
    });
    this.showForm = true;
    this.page = 1;
    this.router.navigate([], { relativeTo: this.route, queryParams: { mode: 'create' }, replaceUrl: true });
  }

  openEditForm(transaction: Transaction): void {
    this.editingId = transaction.id;
    this.transactionForm.reset({
      description: transaction.description,
      amount: transaction.amount,
      date: new Date(transaction.date).toISOString().slice(0, 10),
      category: transaction.category,
      type: transaction.type,
      source: transaction.source ?? '',
    });
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.transactionForm.reset();
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  submit(): void {
    if (this.transactionForm.invalid || this.isSubmitting) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const isDemoOperation = this.isDemoMode;
    this.operationNotice = '';

    const payload: CreateTransactionRequest = {
      description: this.transactionForm.value.description.trim(),
      amount: Number(this.transactionForm.value.amount),
      date: this.transactionForm.value.date,
      category: this.transactionForm.value.category.trim(),
      type: this.transactionForm.value.type as TransactionType,
      source: this.transactionForm.value.source?.trim() || null,
    };

    if (this.editingId) {
      this.transactionsService.updateTransaction(this.editingId, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.loadTransactions();
          this.operationNotice = isDemoOperation
            ? 'Alteração temporária aplicada apenas à demonstração; não foi enviada à API.'
            : 'Transação atualizada pela API.';
          this.closeForm();
          this.changeDetector.markForCheck();
        },
        error: () => {
          this.isSubmitting = false;
          this.error = 'A API não confirmou a alteração. Ela não foi considerada salva no servidor; confira antes de tentar novamente.';
          this.changeDetector.markForCheck();
        },
      });

      return;
    }

    this.transactionsService.createTransaction(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.loadTransactions();
        this.operationNotice = isDemoOperation
          ? 'Transação adicionada apenas à demonstração; ela não foi enviada à API.'
          : 'Transação criada pela API.';
        this.closeForm();
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.isSubmitting = false;
        this.error = 'A API não confirmou a operação. A transação não foi considerada salva no servidor; confira antes de tentar novamente.';
        this.changeDetector.markForCheck();
      },
    });
  }

  requestDelete(id: string): void {
    this.deleteTarget = id;
  }

  cancelDelete(): void {
    this.deleteTarget = null;
  }

  confirmDelete(): void {
    if (!this.deleteTarget) {
      return;
    }

    const isDemoOperation = this.isDemoMode;
    this.operationNotice = '';
    this.transactionsService.deleteTransaction(this.deleteTarget).subscribe({
      next: () => {
        this.deleteTarget = null;
        this.loadTransactions();
        this.operationNotice = isDemoOperation
          ? 'Transação removida apenas da demonstração; a alteração é temporária.'
          : 'Transação excluída pela API.';
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.error = 'A API não confirmou a exclusão. A transação não foi considerada removida do servidor.';
        this.deleteTarget = null;
        this.changeDetector.markForCheck();
      },
    });
  }

  loadTransactions(): void {
    this.loading = true;
    this.error = '';

    this.transactionsService.getTransactions().subscribe({
      next: (transactions) => {
        this.transactions = [...transactions].sort(
          (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
        );
        this.page = 1;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.error = 'Não foi possível carregar a lista de transações.';
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  retry(): void {
    this.loading = true;
    this.error = '';
    this.transactionsService.retryTransactions().subscribe({
      next: (transactions) => {
        this.transactions = [...transactions].sort(
          (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
        );
        this.page = 1;
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
}
