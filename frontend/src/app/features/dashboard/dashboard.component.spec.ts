import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { formatCurrency } from '../../core/utils/finance-utils';
import { DashboardPageComponent } from './dashboard.component';

describe('DashboardPageComponent', () => {
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('loads transactions from the published API and displays the real summary', async () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const request = httpTestingController.expectOne(
      'https://a3t3zbdgmmixm4qvsujcnkp5xy0qjgbm.lambda-url.sa-east-1.on.aws/api/Transactions'
    );
    expect(request.request.method).toBe('GET');

    const today = new Date().toISOString();
    request.flush([
      {
        id: 'income-1',
        description: 'Receita verificada',
        amount: 1200,
        date: today,
        category: 'Salário',
        type: 'Income',
      },
      {
        id: 'expense-1',
        description: 'Despesa verificada',
        amount: 200,
        date: today,
        category: 'Moradia',
        type: 'Expense',
      },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.balance h2')?.textContent).toBe(formatCurrency(1000));
    expect(element.textContent).toContain('Receita verificada');
    expect(element.textContent).toContain('Despesa verificada');
    expect(element.querySelector('.skeleton-grid')).toBeNull();
    expect(element.querySelector('.data-source-badge')).toBeNull();
    expect(element.textContent).not.toContain('DEMO');
  });

  it('shows clearly identified demo data when the API returns an empty list', async () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    httpTestingController.expectOne(
      'https://a3t3zbdgmmixm4qvsujcnkp5xy0qjgbm.lambda-url.sa-east-1.on.aws/api/Transactions'
    ).flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.data-source-badge')?.textContent).toContain('DEMO');
    expect(element.textContent).toContain('Ainda não existem transações reais cadastradas');
    expect(element.querySelectorAll('.summary-card h2').length).toBe(4);
    expect(element.textContent).toContain('Alimentação');
  });

  it('falls back after an API error and switches back to real data after retry', async () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    httpTestingController.expectOne(
      'https://a3t3zbdgmmixm4qvsujcnkp5xy0qjgbm.lambda-url.sa-east-1.on.aws/api/Transactions'
    ).flush('offline', { status: 503, statusText: 'Service Unavailable' });
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.data-source-badge')?.textContent).toContain('DEMO');
    expect(element.textContent).toContain('não foi possível carregar os dados da API');

    element.querySelector<HTMLButtonElement>('.data-source-retry')?.click();
    fixture.detectChanges();
    httpTestingController.expectOne(
      'https://a3t3zbdgmmixm4qvsujcnkp5xy0qjgbm.lambda-url.sa-east-1.on.aws/api/Transactions'
    ).flush([
      {
        id: 'real-after-retry',
        description: 'Receita real recuperada',
        amount: 800,
        date: new Date().toISOString(),
        category: 'Freelance',
        type: 'Income',
      },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('.data-source-badge')).toBeNull();
    expect(element.textContent).toContain('Receita real recuperada');
    expect(element.textContent).not.toContain('Mercado da semana');
  });
});
