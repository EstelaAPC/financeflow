import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, Observable, of, shareReplay, tap, throwError, timeout } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CreateTransactionRequest, Transaction, TransactionType } from '../../models/transaction';
import { DEMO_TRANSACTIONS } from '../mocks/demo-transactions';

export interface TransactionsState {
  transactions: Transaction[];
  source: 'real' | 'demo';
  loading: boolean;
  apiUnavailable: boolean;
  apiEmpty: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class TransactionsService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/Transactions`;
  private readonly stateSubject = new BehaviorSubject<TransactionsState>({
    transactions: [],
    source: 'demo',
    loading: false,
    apiUnavailable: false,
    apiEmpty: false,
    error: null,
  });
  readonly state$ = this.stateSubject.asObservable();
  private loaded = false;
  private inFlightRequest: Observable<Transaction[]> | null = null;
  private localId = 0;
  private readonly demoIds = new Set(DEMO_TRANSACTIONS.map((transaction) => transaction.id));

  constructor(private readonly http: HttpClient) {}

  get state(): TransactionsState {
    return this.stateSubject.value;
  }

  get isDemoMode(): boolean {
    return this.state.source === 'demo';
  }

  getTransactions(): Observable<Transaction[]> {
    if (this.inFlightRequest) {
      return this.inFlightRequest;
    }
    if (this.loaded) {
      return of(this.state.transactions);
    }
    return this.fetchTransactions();
  }

  retryTransactions(): Observable<Transaction[]> {
    if (this.inFlightRequest) {
      return this.inFlightRequest;
    }
    this.loaded = false;
    return this.fetchTransactions();
  }

  getTransactionById(id: string): Observable<Transaction> {
    if (this.isDemoId(id)) {
      const transaction = this.state.transactions.find((item) => item.id === id);
      return transaction
        ? of(transaction)
        : throwError(() => new Error('A transação de demonstração não foi encontrada.'));
    }
    return this.http.get<Transaction>(`${this.apiUrl}/${id}`);
  }

  createTransaction(data: CreateTransactionRequest): Observable<Transaction> {
    if (this.isDemoMode) {
      const transaction: Transaction = {
        ...data,
        id: `00000000-0000-4000-8000-${String(100 + ++this.localId).padStart(12, '0')}`,
        source: 'DEMO - dados ficticios',
      };
      this.demoIds.add(transaction.id);
      this.setState({
        ...this.state,
        transactions: [transaction, ...this.state.transactions],
      });
      return of(transaction);
    }

    return this.http.post<Transaction>(this.apiUrl, data).pipe(
      tap((transaction) => this.setState({
        ...this.state,
        transactions: [transaction, ...this.state.transactions],
      }))
    );
  }

  updateTransaction(id: string, data: CreateTransactionRequest): Observable<void> {
    if (this.isDemoId(id)) {
      const existing = this.state.transactions.find((transaction) => transaction.id === id);
      if (!existing) {
        return throwError(() => new Error('A transação de demonstração não foi encontrada.'));
      }
      const updated: Transaction = { ...existing, ...data, id, source: 'DEMO - dados ficticios' };
      this.setState({
        ...this.state,
        transactions: this.state.transactions.map((transaction) => transaction.id === id ? updated : transaction),
      });
      return of(void 0);
    }

    return this.http.put<void>(`${this.apiUrl}/${id}`, data).pipe(
      tap(() => this.setState({
        ...this.state,
        transactions: this.state.transactions.map((transaction) =>
          transaction.id === id ? { ...transaction, ...data } : transaction
        ),
      }))
    );
  }

  deleteTransaction(id: string): Observable<void> {
    if (this.isDemoId(id)) {
      const found = this.state.transactions.some((transaction) => transaction.id === id);
      if (!found) {
        return throwError(() => new Error('A transação de demonstração não foi encontrada.'));
      }
      this.setState({
        ...this.state,
        transactions: this.state.transactions.filter((transaction) => transaction.id !== id),
      });
      return of(void 0);
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.setState({
        ...this.state,
        transactions: this.state.transactions.filter((transaction) => transaction.id !== id),
      }))
    );
  }

  private fetchTransactions(): Observable<Transaction[]> {
    this.setState({ ...this.state, loading: true, error: null });

    const request = this.http.get<unknown>(this.apiUrl).pipe(
      timeout({ first: 15000 }),
      map((response) => this.normalizeTransactions(response)),
      map((transactions) => {
        transactions
          .filter((transaction) => this.isDemonstrationTransaction(transaction))
          .forEach((transaction) => this.demoIds.add(transaction.id));
        const realTransactions = transactions.filter((transaction) => !this.isDemonstrationTransaction(transaction));
        if (realTransactions.length > 0) {
          this.loaded = true;
          this.setState({
            transactions: realTransactions,
            source: 'real',
            loading: false,
            apiUnavailable: false,
            apiEmpty: false,
            error: null,
          });
          return this.state.transactions;
        }

        if (transactions.length > 0) {
          transactions.forEach((transaction) => this.demoIds.add(transaction.id));
          this.loaded = true;
          this.setState({
            transactions,
            source: 'demo',
            loading: false,
            apiUnavailable: false,
            apiEmpty: false,
            error: null,
          });
          return this.state.transactions;
        }

        if (transactions.length === 0) {
          this.loaded = true;
          this.setState({
            transactions: [...DEMO_TRANSACTIONS],
            source: 'demo',
            loading: false,
            apiUnavailable: false,
            apiEmpty: true,
            error: null,
          });
          return this.state.transactions;
        }

        this.loaded = true;
        this.setState({
          transactions,
          source: 'real',
          loading: false,
          apiUnavailable: false,
          apiEmpty: false,
          error: null,
        });
        return this.state.transactions;
      }),
      catchError((error: unknown) => {
        this.loaded = true;
        this.setState({
          transactions: [...DEMO_TRANSACTIONS],
          source: 'demo',
          loading: false,
          apiUnavailable: true,
          apiEmpty: false,
          error: this.getApiErrorMessage(error),
        });
        return of(this.state.transactions);
      }),
      finalize(() => {
        this.inFlightRequest = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    this.inFlightRequest = request;
    return request;
  }

  private setState(state: TransactionsState): void {
    this.stateSubject.next(state);
  }

  private isDemoId(id: string): boolean {
    return this.demoIds.has(id);
  }

  private isDemonstrationTransaction(transaction: Transaction): boolean {
    const source = transaction.source?.trim().toLocaleLowerCase() ?? '';
    return source.startsWith('demo') || source.startsWith('demonstração');
  }

  private getApiErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.status === 0
        ? 'Não foi possível carregar os dados da API (rede indisponível ou tempo de resposta excedido).'
        : `A API não conseguiu carregar os dados (HTTP ${error.status}).`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Não foi possível carregar os dados da API.';
  }

  private normalizeTransactions(response: unknown): Transaction[] {
    if (!Array.isArray(response)) {
      throw new Error('A API retornou uma lista de transações em um formato inesperado.');
    }

    return response.map((item: unknown, index: number) => {
      if (typeof item !== 'object' || item === null) {
        throw new Error(`A transação ${index + 1} retornada pela API é inválida.`);
      }

      const value = item as Record<string, unknown>;
      const type = this.normalizeType(value['type']);
      const amountValue = value['amount'];
      const amount = Number(amountValue);
      const id = value['id'];
      const description = value['description'];
      const date = value['date'];
      const category = value['category'];
      const source = value['source'];

      if (
        typeof id !== 'string' ||
        id.length === 0 ||
        typeof description !== 'string' ||
        typeof date !== 'string' ||
        Number.isNaN(Date.parse(date)) ||
        typeof category !== 'string' ||
        (typeof amountValue !== 'number' &&
          (typeof amountValue !== 'string' || amountValue.trim().length === 0)) ||
        !Number.isFinite(amount) ||
        amount < 0 ||
        type === null ||
        (source !== undefined && typeof source !== 'string' && source !== null)
      ) {
        throw new Error(`A transação ${index + 1} retornada pela API contém dados inválidos.`);
      }

      return {
        id,
        description,
        amount,
        date,
        category,
        type,
        ...(typeof source === 'string' || source === null ? { source } : {}),
      };
    });
  }

  private normalizeType(value: unknown): TransactionType | null {
    if (typeof value !== 'string') {
      return null;
    }

    switch (value.toLowerCase()) {
      case 'income':
        return 'Income';
      case 'expense':
        return 'Expense';
      default:
        return null;
    }
  }
}
