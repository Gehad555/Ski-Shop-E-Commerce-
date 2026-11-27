import { Component, computed, inject, signal } from '@angular/core';
import { MatTabGroup, MatTab, MatTabLabel, MatTabContent } from '@angular/material/tabs';
import { MatIcon } from '@angular/material/icon';
import { AdminService } from '../../core/services/admin.service';
import { AccountService } from '../../core/services/account.service';
import { AdminOrdersComponent } from './admin-orders/admin-orders.component';
import { AdminCatalogComponent } from './admin-catalog/admin-catalog.component';
import { AdminCustomerServiceComponent } from './admin-customer-service/admin-customer-service.component';

@Component({
  imports: [
    MatTabGroup,
    MatTab,
    MatTabLabel,
    MatTabContent,
    MatIcon,
    AdminOrdersComponent,
    AdminCatalogComponent,
    AdminCustomerServiceComponent
  ],
  selector: 'app-admin',
  styleUrl: './admin.component.scss',
  templateUrl: './admin.component.html',
})
export class Admin {
  protected adminService = inject(AdminService);
  protected accountService = inject(AccountService);

  protected selectedTabIndex = signal(0);

  protected ordersCount = computed(() => this.adminService.ordersResource.value()?.count);
  protected productsCount = computed(() => this.adminService.productsResource.value()?.count);

  onTabChange(index: number) {
    this.selectedTabIndex.set(index);
    if (index === 1) {
      this.adminService.catalogActive.set(true);
    } else if (index === 2) {
      this.adminService.supportActive.set(true);
    }
  }
}

export { Admin as AdminComponent };
