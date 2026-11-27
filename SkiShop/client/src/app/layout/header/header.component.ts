import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBadge } from '@angular/material/badge';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { BusyService } from '../../core/services/busy.service';
import { AccountService } from '../../core/services/account.service';
import CartService from '../../core/services/cart.service';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider';
import { IsAdmin } from '../../shared/directives/is-admin.directive';


@Component({
  selector: 'app-header',
  imports: [
    MatIcon,
    MatButton,
    MatIconButton,
    MatBadge,
    RouterLink,
    RouterLinkActive,
    MatProgressBar,
    MatMenu,
    MatMenuItem,
    MatDivider,
    MatMenuTrigger,
    IsAdmin
  ],

  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  busyService = inject(BusyService);
  cartService = inject(CartService);
  accountService = inject(AccountService);
  private router = inject(Router);

  mobileMenuOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.mobileMenuOpen.set(false));
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(open => !open);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  logout() {
    this.closeMobileMenu();
    this.accountService.logout().subscribe({
      next: () => {
        this.accountService.userResource.set(undefined);
        this.cartService.forgetCart();
        void this.router.navigateByUrl('/');
      }
    });
  }
}
