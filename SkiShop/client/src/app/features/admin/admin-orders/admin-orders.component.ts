import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatSelectChange, MatSelect } from '@angular/material/select';
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption } from '@angular/material/core';
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
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AdminService } from '../../../core/services/admin.service';
import { DialogService } from '../../../core/services/dialog.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Order } from '../../../shared/models/order';
import { SplitCamelCasePipe } from '../../../shared/pipes/split-camel-case-pipe';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    FormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatPrefix,
    MatSuffix,
    MatSelect,
    MatOption,
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
    MatPaginator,
    DatePipe,
    CurrencyPipe,
    NgClass,
    MatTooltip,
    MatIconButton,
    MatButton,
    RouterLink,
    MatIcon,
    SplitCamelCasePipe
  ],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss'
})
export class AdminOrdersComponent {
  protected adminService = inject(AdminService);
  private dialogService = inject(DialogService);
  private snackbar = inject(SnackbarService);

  protected displayedColumns: string[] = [
    'no',
    'id',
    'buyerEmail',
    'items',
    'orderDate',
    'total',
    'status',
    'actions'
  ];

  protected statusOptions = ['All', 'PaymentReceived', 'Pending', 'PaymentFailed', 'Refunded'];
  protected searchTerm = signal('');

  protected orders = computed<Order[]>(() => this.adminService.ordersResource.value()?.data ?? []);
  protected totalItems = computed(() => this.adminService.ordersResource.value()?.count ?? 0);
  protected pageIndex = computed(() => this.adminService.orderParams().pageNumber - 1);
  protected pageSize = computed(() => this.adminService.orderParams().pageSize);
  protected selectedStatus = computed(() => this.adminService.orderParams().status || 'All');

  protected filteredOrders = computed<Order[]>(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const list = this.orders();
    if (!query) return list;

    return list.filter(order =>
      order.buyerEmail.toLowerCase().includes(query) ||
      (order.shippingAddress?.name ?? '').toLowerCase().includes(query) ||
      `#${order.id}`.includes(query) ||
      order.id.toString() === query
    );
  });

  protected paidStats = computed(() => {
    const paid = this.orders().filter(o => o.status === 'PaymentReceived');
    const amount = paid.reduce((sum, o) => sum + o.total, 0);
    return { count: paid.length, amount };
  });

  protected attentionCount = computed(() =>
    this.orders().filter(o => o.status === 'Pending' || o.status === 'PaymentFailed').length
  );

  protected refundedCount = computed(() =>
    this.orders().filter(o => o.status === 'Refunded').length
  );

  getItemCount(order: Order): number {
    return order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  }

  onPageChange(event: PageEvent) {
    this.adminService.orderParams.update(current => ({
      ...current,
      pageNumber: event.pageIndex + 1,
      pageSize: event.pageSize
    }));
  }

  onFilterSelect(event: MatSelectChange) {
    this.adminService.orderParams.update(current => ({
      ...current,
      pageNumber: 1,
      status: event.value === 'All' ? '' : event.value
    }));
  }

  resetFilters() {
    this.searchTerm.set('');
    this.adminService.orderParams.set({
      pageNumber: 1,
      pageSize: this.pageSize(),
      status: ''
    });
  }

  reload() {
    this.adminService.ordersResource.reload();
  }

  async openConfirmDialog(order: Order) {
    const confirmed = await this.dialogService.confirm(
      `Confirm refund for #${order.id}`,
      `Issue a full refund of $${order.total.toFixed(2)} to ${order.buyerEmail}? This action cannot be undone.`
    );

    if (confirmed) this.refundOrder(order.id);
  }

  private refundOrder(id: number) {
    this.adminService.refundOrder(id).subscribe({
      next: () => {
        this.snackbar.success(`Order #${id} has been refunded.`);
      }
    });
  }
}
