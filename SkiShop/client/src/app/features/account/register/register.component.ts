import { Component, inject, signal } from '@angular/core';
import { AccountService } from '../../../core/services/account.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Router } from '@angular/router';

import { MatCard } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [MatCard, MatFormField, MatLabel, MatInput, MatButton, FormsModule],
  selector: 'app-register',
  styleUrl: './register.component.scss',
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private accountService = inject(AccountService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  protected loading = signal(false);
  protected validationErrors = signal<string[]>([]);

  firstName = '';
  lastName = '';
  email = '';
  password = '';

  onSubmit(event: Event) {
    event.preventDefault();
    this.loading.set(true);
    this.accountService.register({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        this.snackbar.success('Registration successful - you can now login!');
        void this.router.navigateByUrl('/account/login');
      },
      error: (error: any) => {
        if (Array.isArray(error)) this.validationErrors.set(error);
        this.loading.set(false);
      }
    });
  }
}
