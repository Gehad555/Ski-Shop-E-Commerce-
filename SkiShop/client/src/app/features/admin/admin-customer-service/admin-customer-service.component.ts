import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import {
  MatTable,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatCell,
  MatCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef
} from '@angular/material/table';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { AdminService, SupportCaseStatus } from '../../../core/services/admin.service';
import { DialogService } from '../../../core/services/dialog.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Order } from '../../../shared/models/order';
import { SplitCamelCasePipe } from '../../../shared/pipes/split-camel-case-pipe';
import { SupportCaseDialogComponent } from '../support-case-dialog/support-case-dialog.component';

type QueueFilter = 'all' | 'attention' | 'refunded' | 'resolved';
type ServiceViewMode = 'cases' | 'customers';

interface CustomerSummary {
  email: string;
  name: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  refundedCount: number;
  lastOrderDate: string;
  lastOrderStatus: string;
}

@Component({
  selector: 'app-admin-customer-service',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
    UpperCasePipe,
    NgClass,
    MatFormField,
    MatLabel,
    MatInput,
    MatPrefix,
    MatSuffix,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatCell,
    MatCellDef,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef,
    MatButton,
    MatIconButton,
    MatIcon,
    MatTooltip,
    SplitCamelCasePipe
  ],
  templateUrl: './admin-customer-service.component.html',
  styleUrl: './admin-customer-service.component.scss'
})
export class AdminCustomerServiceComponent implements OnInit {
  protected adminService = inject(AdminService);
  private dialog = inject(MatDialog);
  private dialogService = inject(DialogService);
  private snackbar = inject(SnackbarService);

  protected viewMode = signal<ServiceViewMode>('cases');
  protected queueFilter = signal<QueueFilter>('all');
  protected searchTerm = signal('');

  protected caseColumns: string[] = [
    'no',
    'orderId',
    'customer',
    'payment',
    'total',
    'orderStatus',
    'caseStatus',
    'actions'
  ];

  protected customerColumns: string[] = [
    'no',
    'customer',
    'ordersCount',
    'totalSpent',
    'lastOrder',
    'actions'
  ];

  protected orders = computed<Order[]>(() => this.adminService.supportOrdersResource.value()?.data ?? []);

  protected uniqueCustomers = computed<CustomerSummary[]>(() => {
    const map = new Map<string, CustomerSummary>();

    for (const order of this.orders()) {
      const key = order.buyerEmail.toLowerCase();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          email: order.buyerEmail,
          name: order.shippingAddress?.name || 'Customer',
          city: order.shippingAddress?.city || '',
          ordersCount: 1,
          totalSpent: order.status === 'Refunded' ? 0 : order.total,
          refundedCount: order.status === 'Refunded' ? 1 : 0,
          lastOrderDate: order.orderDate,
          lastOrderStatus: order.status
        });
      } else {
        existing.ordersCount += 1;
        if (order.status !== 'Refunded') existing.totalSpent += order.total;
        if (order.status === 'Refunded') existing.refundedCount += 1;
        if (new Date(order.orderDate) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.orderDate;
          existing.lastOrderStatus = order.status;
        }
      }
    }

    return Array.from(map.values());
  });

  protected filteredCustomers = computed<CustomerSummary[]>(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const list = this.uniqueCustomers();
    if (!q) return list;

    return list.filter(c =>
      c.email.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  protected attentionCount = computed(() => {
    this.adminService.supportCases();
    return this.orders().filter(o => {
      const meta = this.adminService.getSupportCase(o);
      return meta.caseStatus === 'Open' || meta.caseStatus === 'InProgress' ||
        o.status === 'Pending' || o.status === 'PaymentFailed';
    }).length;
  });

  protected refundedCount = computed(() =>
    this.orders().filter(o => o.status === 'Refunded').length
  );

  protected resolvedCount = computed(() => {
    this.adminService.supportCases();
    return this.orders().filter(o => this.adminService.getSupportCase(o).caseStatus === 'Resolved').length;
  });

  protected filteredCases = computed<Order[]>(() => {
    this.adminService.supportCases();
    const q = this.searchTerm().trim().toLowerCase();
    const filter = this.queueFilter();

    return this.orders().filter(order => {
      const meta = this.adminService.getSupportCase(order);

      if (filter === 'attention') {
        const needsAttention =
          meta.caseStatus === 'Open' ||
          meta.caseStatus === 'InProgress' ||
          order.status === 'Pending' ||
          order.status === 'PaymentFailed';
        if (!needsAttention) return false;
      } else if (filter === 'refunded' && order.status !== 'Refunded') {
        return false;
      } else if (filter === 'resolved' && meta.caseStatus !== 'Resolved') {
        return false;
      }

      if (!q) return true;
      return (
        order.buyerEmail.toLowerCase().includes(q) ||
        (order.shippingAddress?.name ?? '').toLowerCase().includes(q) ||
        `#${order.id}`.includes(q) ||
        order.id.toString() === q
      );
    });
  });

  ngOnInit() {
    this.adminService.supportActive.set(true);
  }

  getCaseStatus(order: Order): SupportCaseStatus {
    this.adminService.supportCases();
    return this.adminService.getSupportCase(order).caseStatus;
  }

  hasCaseNote(order: Order): boolean {
    this.adminService.supportCases();
    return Boolean(this.adminService.getSupportCase(order).note);
  }

  getCaseNotePreview(order: Order): string {
    this.adminService.supportCases();
    return this.adminService.getSupportCase(order).note;
  }

  formatCaseStatus(status: SupportCaseStatus): string {
    return status === 'InProgress' ? 'In Progress' : status;
  }

  openSupportCase(order: Order) {
    this.dialog.open(SupportCaseDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      data: { order }
    });
  }

  inspectCustomerOrders(email: string) {
    this.searchTerm.set(email);
    this.queueFilter.set('all');
    this.viewMode.set('cases');
  }

  async quickRefund(order: Order) {
    const confirmed = await this.dialogService.confirm(
      `Confirm refund for #${order.id}`,
      `Issue a full refund of $${order.total.toFixed(2)} to ${order.buyerEmail}?`
    );

    if (!confirmed) return;

    this.adminService.refundOrder(order.id).subscribe({
      next: () => {
        this.adminService.saveSupportCase(
          order.id,
          'Resolved',
          this.getCaseNotePreview(order) || 'Refund issued via Customer Service desk.'
        );
        this.snackbar.success(`Order #${order.id} refunded and marked resolved.`);
      }
    });
  }

  reload() {
    this.adminService.supportOrdersResource.reload();
  }

  clearSearch() {
    this.searchTerm.set('');
    this.queueFilter.set('all');
  }
}
