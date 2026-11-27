import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatTabGroup, MatTab, MatTabLabel, MatTabContent } from '@angular/material/tabs';
import { MatIcon } from '@angular/material/icon';
import { AdminService } from '../../core/services/admin.service';
import { AccountService } from '../../core/services/account.service';
import { AdminOrdersComponent } from './admin-orders/admin-orders.component';
import { AdminCatalogComponent } from './admin-catalog/admin-catalog.component';
import { AdminCustomerServiceComponent } from './admin-customer-service/admin-customer-service.component';
import { AdminLogsComponent } from './admin-logs/admin-logs.component';

const TAB_QUERY_MAP: Record<string, number> = {
  orders: 0,
  catalog: 1,
  support: 2,
  logs: 3
};

@Component({
  imports: [
    MatTabGroup,
    MatTab,
    MatTabLabel,
    MatTabContent,
    MatIcon,
    AdminOrdersComponent,
    AdminCatalogComponent,
    AdminCustomerServiceComponent,
    AdminLogsComponent
  ],
  selector: 'app-admin',
  styleUrl: './admin.component.scss',
  templateUrl: './admin.component.html',
})
export class Admin implements OnInit {
  private route = inject(ActivatedRoute);
  protected adminService = inject(AdminService);
  protected accountService = inject(AccountService);

  protected selectedTabIndex = signal(0);

  protected ordersCount = computed(() => this.adminService.ordersResource.value()?.count);
  protected productsCount = computed(() => this.adminService.productsResource.value()?.count);
  protected errorLogsCount = computed(() => this.adminService.logStatsResource.value()?.errorCount);

  ngOnInit() {
    const initialTab = this.route.snapshot.data['initialTab'];
    const tabParam = this.route.snapshot.queryParamMap.get('tab')?.toLowerCase();

    if (typeof initialTab === 'number') {
      this.onTabChange(initialTab);
    } else if (tabParam && tabParam in TAB_QUERY_MAP) {
      this.onTabChange(TAB_QUERY_MAP[tabParam]);
    }
  }

  onTabChange(index: number) {
    this.selectedTabIndex.set(index);
    if (index === 1) {
      this.adminService.catalogActive.set(true);
    } else if (index === 2) {
      this.adminService.supportActive.set(true);
    } else if (index === 3) {
      this.adminService.logsActive.set(true);
    }
  }
}

export { Admin as AdminComponent };
