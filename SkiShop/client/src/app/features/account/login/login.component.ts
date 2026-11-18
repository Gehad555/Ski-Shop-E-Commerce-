import { Component, inject, signal } from '@angular/core';
import { AccountService } from '../../../core/services/account.service';
import { Router } from '@angular/router';
import { MatCard } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [MatCard, MatFormField, MatLabel, MatInput, MatButton, FormsModule],
  selector: 'app-login',
  styleUrl: './login.component.scss',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private accountService = inject(AccountService);
  private router = inject(Router);
  protected loading = signal(false);

  private redirectUrl = this.router.currentNavigation()?.extras?.state?.['attemptedUrl'] ?? '/shop';

  email = '';
  password = '';

  onSubmit(event: Event) {
    event.preventDefault();
    this.loading.set(true);
    this.accountService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl(this.redirectUrl);
      },
      error: () => this.loading.set(false)
    });
  }
}
