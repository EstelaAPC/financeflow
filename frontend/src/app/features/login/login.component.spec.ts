import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { LoginPageComponent } from './login.component';

@Component({
  standalone: true,
  template: '',
})
class DashboardRouteTarget {}

describe('LoginPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        provideRouter([{ path: 'dashboard', component: DashboardRouteTarget }]),
      ],
    }).compileComponents();
  });

  it('does not render credential fields while authentication is unavailable', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('input').length).toBe(0);
    expect(element.querySelector('.auth-unavailable')?.textContent).toContain('nenhum dado será coletado ou armazenado');
  });

  it('keeps guest access available in the registration view and opens the dashboard', async () => {
    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const registerButton = Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Cadastre-se')
    );
    registerButton?.click();
    fixture.detectChanges();

    expect(element.querySelector('h2')?.textContent).toContain('Crie seu espaço');
    expect(element.querySelector('button.guest-button')?.textContent).toContain('Continuar como visitante');
    expect(element.querySelectorAll('input').length).toBe(0);

    element.querySelector<HTMLButtonElement>('button.guest-button')?.click();
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/dashboard');
  });
});
