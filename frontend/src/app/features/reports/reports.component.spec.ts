import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { formatCurrency } from '../../core/utils/finance-utils';
import { ReportsPageComponent } from './reports.component';

const API_URL = 'https://a3t3zbdgmmixm4qvsujcnkp5xy0qjgbm.lambda-url.sa-east-1.on.aws/api/Transactions';

describe('ReportsPageComponent', () => {
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('shows sparse monthly API history without any demo preview actions', async () => {
    const fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();

    httpTestingController.expectOne(API_URL).flush([
      {
        id: 'real-current-month',
        description: 'Receita do mês',
        amount: 900,
        date: new Date().toISOString(),
        category: 'Freelance',
        type: 'Income',
        source: 'Manual',
      },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.trend-month').length).toBe(6);
    expect(element.querySelectorAll('.trend-bar.income-bar').length).toBe(6);
    expect(element.querySelector('.report-total strong')?.textContent).toBe(formatCurrency(900));
    expect(element.querySelector('.data-source-banner.demo')).toBeNull();
    expect(element.querySelector('.demo-preview-toggle')).toBeNull();
    expect(element.querySelector('.chart-demo-action')).toBeNull();
    expect(element.textContent).not.toContain('exemplo DEMO');
  });

  it('labels the chart as demo when the API fallback is active', async () => {
    const fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();
    httpTestingController.expectOne(API_URL).flush('offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.data-source-banner.demo')).not.toBeNull();
    expect(element.textContent).toContain('somente dados fictícios');
    expect(element.querySelector('.demo-preview-toggle')).toBeNull();
    expect(element.querySelector('.chart-demo-action')).toBeNull();
  });
});
