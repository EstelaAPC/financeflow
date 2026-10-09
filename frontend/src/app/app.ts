import { Component, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { QuickActionsComponent } from './shared/components/quick-actions/quick-actions.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, QuickActionsComponent],
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly sidebarCollapsed = signal(false);
  protected readonly Math = Math;

  constructor(
    private readonly router: Router,
    readonly themeService: ThemeService
  ) {}

  navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '◫' },
    { label: 'Transações', path: '/transactions', icon: '≣' },
    { label: 'Relatórios', path: '/reports', icon: '⌁' },
    { label: 'Orçamentos', path: '/budgets', icon: '◎' },
  ];

  get currentPageTitle(): string {
    if (this.router.url.includes('/transactions')) {
      return 'Transações';
    }

    if (this.router.url.includes('/reports')) {
      return 'Relatórios';
    }

    if (this.router.url.includes('/budgets')) {
      return 'Planejamento de orçamento';
    }

    return 'Visão geral';
  }

  get isLoginPage(): boolean {
    return this.router.url.startsWith('/login');
  }

  get greeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Bom dia';
    }

    if (hour < 18) {
      return 'Boa tarde';
    }

    return 'Boa noite';
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  signOut(): void {
    this.sidebarCollapsed.set(false);
    void this.router.navigateByUrl('/login');
  }
}
