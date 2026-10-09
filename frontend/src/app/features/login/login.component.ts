import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginPageComponent {
  mode: 'login' | 'register' = 'login';

  constructor(private readonly router: Router) {}

  setMode(mode: 'login' | 'register'): void {
    this.mode = mode;
  }

  continueAsGuest(): void {
    void this.router.navigateByUrl('/dashboard');
  }
}
