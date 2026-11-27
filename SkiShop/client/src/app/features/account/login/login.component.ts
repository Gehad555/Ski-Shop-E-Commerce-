import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../../../core/services/account.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  selector: 'app-login',
  styleUrl: './login.component.scss',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  protected loading = signal(false);
  protected hidePassword = signal(true);
  protected errorMessage = signal<string | null>(null);

  private redirectUrl = this.activatedRoute.snapshot.queryParams['returnUrl']
    ?? this.router.currentNavigation()?.extras?.state?.['attemptedUrl']
    ?? '/shop';

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    this.loginForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.errorMessage()) {
          this.errorMessage.set(null);
        }
      });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    const { email, password } = this.loginForm.getRawValue();

    this.accountService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl(this.redirectUrl);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const message = this.getLoginErrorMessage(err);
        this.errorMessage.set(message);
        this.snackbar.error(message);
      }
    });
  }

  private getLoginErrorMessage(err: HttpErrorResponse): string {
    if (err.status === 401) {
      const detail = err.error?.detail;
      if (detail === 'Lockedout') {
        return 'Your account is temporarily locked. Please try again later.';
      }
      if (detail === 'NotAllowed') {
        return 'Sign in is not allowed for this account.';
      }
      return 'Invalid email or password. Please try again.';
    }
    if (err.status === 0) {
      return 'Unable to reach the server. Please check your connection.';
    }
    return 'Unable to sign in right now. Please try again.';
  }
}
