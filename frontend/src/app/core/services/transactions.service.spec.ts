import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CreateTransactionRequest } from '../../models/transaction';
import { DEMO_TRANSACTIONS } from '../mocks/demo-transactions';
import { TransactionsService } from './transactions.service';

const API_URL = 'https://a3t3zbdgmmixm4qvsujcnkp5xy0qjgbm.lambda-url.sa-east-1.on.aws/api/Transactions';

const newTransaction: CreateTransactionRequest = {
  description: 'Despesa local',
  amount: 32.5,
  date: '2026-10-09',
  category: 'Outros',
  type: 'Expense',
};

describe('TransactionsService', () => {
  let service: TransactionsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TransactionsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('uses only the real transactions when the API returns a non-empty list', () => {
    let result: unknown;
    service.getTransactions().subscribe((transactions) => result = transactions);

    httpTestingController.expectOne(API_URL).flush([
      {
        id: 'txn-1',
        description: 'Salário',
        amount: '4250.50',
        date: '2026-10-08',
        category: 'Renda',
        type: 'income',
        source: 'Manual',
      },
    ]);

    expect(result).toEqual([
      {
        id: 'txn-1',
        description: 'Salário',
        amount: 4250.5,
        date: '2026-10-08',
        category: 'Renda',
        type: 'Income',
        source: 'Manual',
      },
    ]);
    expect(service.state.source).toBe('real');
    expect(service.state.apiEmpty).toBe(false);
    expect(service.state.transactions).toHaveLength(1);
  });

  it('uses demo transactions when the API is available but its valid list is empty', () => {
    let result: unknown;
    service.getTransactions().subscribe((transactions) => result = transactions);
    httpTestingController.expectOne(API_URL).flush([]);

    expect(result).toEqual(DEMO_TRANSACTIONS);
    expect(service.state.source).toBe('demo');
    expect(service.state.apiEmpty).toBe(true);
    expect(service.state.apiUnavailable).toBe(false);
  });

  it('does not mix API records explicitly marked as demonstration with real transactions', () => {
    let result: unknown;
    service.getTransactions().subscribe((transactions) => result = transactions);
    httpTestingController.expectOne(API_URL).flush([
      {
        id: 'real-record',
        description: 'Receita real',
        amount: 100,
        date: '2026-10-08',
        category: 'Salário',
        type: 'Income',
        source: 'Manual',
      },
      {
        id: 'demo-record',
        description: 'Registro fictício',
        amount: 50,
        date: '2026-10-08',
        category: 'Outros',
        type: 'Expense',
        source: 'DEMO - dados ficticios',
      },
    ]);

    expect((result as Array<{ id: string }>).map((transaction) => transaction.id)).toEqual(['real-record']);
    expect(service.state.source).toBe('real');
  });

  it('uses the fallback and preserves the HTTP error explanation on server errors', () => {
    let result: unknown;
    service.getTransactions().subscribe((transactions) => result = transactions);
    httpTestingController.expectOne(API_URL).flush('unavailable', { status: 503, statusText: 'Service Unavailable' });

    expect(result).toEqual(DEMO_TRANSACTIONS);
    expect(service.state.source).toBe('demo');
    expect(service.state.apiUnavailable).toBe(true);
    expect(service.state.error).toContain('HTTP 503');
  });

  it('uses the fallback on network failure', () => {
    let result: unknown;
    service.getTransactions().subscribe((transactions) => result = transactions);
    httpTestingController.expectOne(API_URL).error(new ProgressEvent('error'));

    expect(result).toEqual(DEMO_TRANSACTIONS);
    expect(service.state.apiUnavailable).toBe(true);
    expect(service.state.error).toContain('rede indisponível');
  });

  it('returns to exclusive real data after an explicit successful retry', () => {
    service.getTransactions().subscribe();
    httpTestingController.expectOne(API_URL).flush([], { status: 503, statusText: 'Service Unavailable' });
    expect(service.isDemoMode).toBe(true);

    let result: unknown;
    service.retryTransactions().subscribe((transactions) => result = transactions);
    httpTestingController.expectOne(API_URL).flush([
      {
        id: 'real-1',
        description: 'Receita real',
        amount: 100,
        date: '2026-10-09',
        category: 'Salário',
        type: 'Income',
      },
    ]);

    expect((result as Array<{ id: string }>)[0].id).toBe('real-1');
    expect(service.state.source).toBe('real');
    expect(service.state.apiUnavailable).toBe(false);
    expect(service.state.transactions.some((transaction) => transaction.source === 'Demonstração')).toBe(false);
  });

  it('keeps demo create, edit, and delete local without issuing write requests', () => {
    service.getTransactions().subscribe();
    httpTestingController.expectOne(API_URL).error(new ProgressEvent('error'));

    let createdId = '';
    service.createTransaction(newTransaction).subscribe((transaction) => createdId = transaction.id);
    expect(service.state.transactions[0].description).toBe('Despesa local');
    expect(service.state.transactions[0].source).toBe('DEMO - dados ficticios');

    const originalDemo = service.state.transactions.find((transaction) => transaction.id === DEMO_TRANSACTIONS[0].id);
    expect(originalDemo).toBeDefined();
    service.updateTransaction(originalDemo!.id, { ...newTransaction, description: 'Descrição editada' }).subscribe();
    expect(service.state.transactions.find((transaction) => transaction.id === originalDemo!.id)?.description)
      .toBe('Descrição editada');

    service.deleteTransaction(createdId).subscribe();
    expect(service.state.transactions.some((transaction) => transaction.id === createdId)).toBe(false);
    httpTestingController.expectNone((request) => request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE');
  });

  it('does not turn a failed real write into a local or successful operation', () => {
    service.getTransactions().subscribe();
    httpTestingController.expectOne(API_URL).flush([
      {
        id: 'real-1',
        description: 'Receita real',
        amount: 100,
        date: '2026-10-09',
        category: 'Salário',
        type: 'Income',
      },
    ]);

    let receivedError: unknown;
    service.createTransaction(newTransaction).subscribe({ error: (error: unknown) => receivedError = error });
    httpTestingController.expectOne({ method: 'POST', url: API_URL }).flush('failed', {
      status: 500,
      statusText: 'Server Error',
    });

    expect(receivedError).toBeInstanceOf(HttpErrorResponse);
    expect(service.state.source).toBe('real');
    expect(service.state.transactions).toHaveLength(1);
    expect(service.state.transactions.some((transaction) => transaction.description === 'Despesa local')).toBe(false);
  });
});
