import { Routes } from '@angular/router';

import { DashboardPageComponent } from './features/dashboard/dashboard.component';
import { TransactionsPageComponent } from './features/transactions/transactions.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((module) => module.LoginPageComponent),
  },
  { path: 'dashboard', component: DashboardPageComponent },
  { path: 'transactions', component: TransactionsPageComponent },
  {
    path: 'reports',
    loadComponent: () => import('./features/reports/reports.component').then((module) => module.ReportsPageComponent),
  },
  {
    path: 'budgets',
    loadComponent: () => import('./features/budgets/budgets.component').then((module) => module.BudgetsPageComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
