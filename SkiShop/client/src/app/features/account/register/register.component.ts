import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../../../core/services/account.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Router, RouterLink } from '@angular/router';

import { MatCard } from '@angular/material/card';
import { MatFormField, MatLabel, MatError, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
  imports: [
    MatCard,
    MatFormField,
    MatLabel,
    MatError,
    MatPrefix,
    MatSuffix,
    MatInput,
    MatButton,
    MatIconButton,
    MatIcon,
    ReactiveFormsModule,
    RouterLink
  ],
  selector: 'app-register',
  styleUrl: './register.component.scss',
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);

  protected loading = signal(false);
  protected hidePassword = signal(true);
  protected validationErrors = signal<string[]>([]);

  registerForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.loading.set(true);
    this.validationErrors.set([]);

    const formVal = this.registerForm.getRawValue();

    this.accountService.register({
      firstName: formVal.firstName!,
      lastName: formVal.lastName!,
      email: formVal.email!,
      password: formVal.password!
    }).subscribe({
      next: () => {
        this.snackbar.success('Registration successful - you can now sign in!');
        void this.router.navigateByUrl('/account/login');
      },
      error: (error: any) => {
        if (Array.isArray(error)) {
          this.validationErrors.set(error);
        } else if (error?.errors) {
          const errs: string[] = [];
          for (const key in error.errors) {
            errs.push(...error.errors[key]);
          }
          this.validationErrors.set(errs);
        }
        this.loading.set(false);
      }
    });
  }
}
