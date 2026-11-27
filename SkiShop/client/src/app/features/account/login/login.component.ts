import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../../../core/services/account.service';
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
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  protected loading = signal(false);
  protected hidePassword = signal(true);

  private redirectUrl = this.activatedRoute.snapshot.queryParams['returnUrl']
    ?? this.router.currentNavigation()?.extras?.state?.['attemptedUrl']
    ?? '/shop';

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    const { email, password } = this.loginForm.getRawValue();

    this.accountService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl(this.redirectUrl);
      },
      error: () => this.loading.set(false)
    });
  }
}
