import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatInput } from '@angular/material/input';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { AdminService, SupportCaseStatus } from '../../../core/services/admin.service';
import { DialogService } from '../../../core/services/dialog.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Order } from '../../../shared/models/order';
import { SplitCamelCasePipe } from '../../../shared/pipes/split-camel-case-pipe';

export interface SupportCaseDialogData {
  order: Order;
}

@Component({
  selector: 'app-support-case-dialog',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
    UpperCasePipe,
    NgClass,
    RouterLink,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatInput,
    MatButton,
    MatIconButton,
    MatIcon,
    MatTooltip,
    SplitCamelCasePipe
  ],
  templateUrl: './support-case-dialog.component.html',
  styleUrl: './support-case-dialog.component.scss'
})
export class SupportCaseDialogComponent {
  private dialogRef = inject(MatDialogRef<SupportCaseDialogComponent>);
  private adminService = inject(AdminService);
  private dialogService = inject(DialogService);
  private snackbar = inject(SnackbarService);

  protected data = inject<SupportCaseDialogData>(MAT_DIALOG_DATA);
  protected order = signal<Order>(this.data.order);
  protected caseStatus = signal<SupportCaseStatus>(
    this.adminService.getSupportCase(this.data.order).caseStatus
  );
  protected note = signal<string>(
    this.adminService.getSupportCase(this.data.order).note
  );
  protected refunding = signal(false);

  protected caseStatusOptions: { value: SupportCaseStatus; label: string }[] = [
    { value: 'Open', label: 'Open' },
    { value: 'InProgress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' }
  ];

  copyText(text: string, label: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      this.snackbar.success(`${label} copied to clipboard`);
    });
  }

  async issueRefund() {
    const current = this.order();
    const confirmed = await this.dialogService.confirm(
      `Confirm refund for #${current.id}`,
      `Issue a full refund of $${current.total.toFixed(2)} to ${current.buyerEmail}?`
    );

    if (!confirmed) return;

    this.refunding.set(true);
    this.adminService.refundOrder(current.id).subscribe({
      next: updatedOrder => {
        this.order.set(updatedOrder);
        this.caseStatus.set('Resolved');
        this.adminService.saveSupportCase(
          updatedOrder.id,
          'Resolved',
          this.note() || 'Refund processed by customer support.'
        );
        this.refunding.set(false);
        this.snackbar.success(`Order #${current.id} refunded and marked resolved`);
      },
      error: () => this.refunding.set(false)
    });
  }

  saveCase() {
    this.adminService.saveSupportCase(this.order().id, this.caseStatus(), this.note());
    this.snackbar.success(`Support case for #${this.order().id} updated`);
    this.dialogRef.close(true);
  }

  close() {
    this.dialogRef.close(false);
  }
}
