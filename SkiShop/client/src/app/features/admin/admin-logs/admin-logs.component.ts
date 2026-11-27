import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
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
import { AdminService } from '../../../core/services/admin.service';
import { AuditLog, SystemLog } from '../../../shared/models/logs';
import { LogDetailsDialogComponent, LogDetailsDialogData } from '../log-details-dialog/log-details-dialog.component';

const LEVEL_BADGE_MAP: Record<string, string> = {
  Error: 'bg-red-50 text-red-700 border-red-200',
  Warning: 'bg-amber-50 text-amber-700 border-amber-200',
  Information: 'bg-blue-50 text-blue-700 border-blue-200'
};

const LEVEL_DOT_MAP: Record<string, string> = {
  Error: 'bg-red-500',
  Warning: 'bg-amber-500',
  Information: 'bg-blue-500'
};

const ACTION_BADGE_MAP: Record<string, string> = {
  Created: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Registered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Updated: 'bg-blue-50 text-blue-700 border-blue-200',
  Deleted: 'bg-red-50 text-red-700 border-red-200',
  LoginFailed: 'bg-red-50 text-red-700 border-red-200',
  Refunded: 'bg-rose-50 text-rose-700 border-rose-200',
  Login: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Logout: 'bg-slate-100 text-slate-700 border-slate-200'
};

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    NgClass,
    MatFormField,
    MatLabel,
    MatInput,
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
    MatButton,
    MatIconButton,
    MatIcon,
    MatTooltip
  ],
  templateUrl: './admin-logs.component.html',
  styleUrl: './admin-logs.component.scss'
})
export class AdminLogsComponent implements OnInit {
  protected adminService = inject(AdminService);
  private dialog = inject(MatDialog);

  protected activeView = signal<'system' | 'audit'>('system');

  protected systemColumns = ['timestamp', 'level', 'source', 'request', 'message', 'user', 'actions'];
  protected auditColumns = ['timestamp', 'action', 'entity', 'user', 'details', 'actions'];

  protected systemSearchInput = signal('');
  protected auditSearchInput = signal('');

  protected stats = computed(() => this.adminService.logStatsResource.value());

  protected systemLogs = computed<SystemLog[]>(() => this.adminService.systemLogsResource.value()?.data ?? []);
  protected systemTotalItems = computed(() => this.adminService.systemLogsResource.value()?.count ?? 0);
  protected systemPageIndex = computed(() => this.adminService.systemLogParams().pageNumber - 1);
  protected systemPageSize = computed(() => this.adminService.systemLogParams().pageSize);
  protected selectedLevel = computed(() => this.adminService.systemLogParams().level || 'All');
  protected selectedSource = computed(() => this.adminService.systemLogParams().source || 'All');

  protected auditLogs = computed<AuditLog[]>(() => this.adminService.auditLogsResource.value()?.data ?? []);
  protected auditTotalItems = computed(() => this.adminService.auditLogsResource.value()?.count ?? 0);
  protected auditPageIndex = computed(() => this.adminService.auditLogParams().pageNumber - 1);
  protected auditPageSize = computed(() => this.adminService.auditLogParams().pageSize);
  protected selectedAction = computed(() => this.adminService.auditLogParams().action || 'All');
  protected selectedEntity = computed(() => this.adminService.auditLogParams().entityName || 'All');

  protected levelOptions = computed(() => {
    const merged = new Set(['Error', 'Warning', 'Information', ...(this.stats()?.logLevels ?? [])]);
    return Array.from(merged);
  });

  protected sourceOptions = computed(() => {
    const merged = new Set(['HTTP', 'ExceptionMiddleware', ...(this.stats()?.logSources ?? [])]);
    return Array.from(merged).sort();
  });

  protected actionOptions = computed(() => {
    const defaults = ['Created', 'Updated', 'Deleted', 'Refunded', 'Login', 'LoginFailed', 'Logout', 'Registered'];
    const merged = new Set([...defaults, ...(this.stats()?.auditActions ?? [])]);
    return Array.from(merged);
  });

  protected entityOptions = computed(() => {
    const defaults = ['Product', 'Order', 'OrderItem', 'DeliveryMethod', 'Address', 'User', 'Auth'];
    const merged = new Set([...defaults, ...(this.stats()?.auditEntities ?? [])]);
    return Array.from(merged).sort();
  });

  protected hasSystemFilters = computed(() => {
    const p = this.adminService.systemLogParams();
    return Boolean(p.level || p.source || p.search);
  });

  protected hasAuditFilters = computed(() => {
    const p = this.adminService.auditLogParams();
    return Boolean(p.action || p.entityName || p.search);
  });

  ngOnInit() {
    this.adminService.logsActive.set(true);
  }

  reload() {
    this.adminService.reloadLogsSection();
  }

  // ---------------- System Log Filters ----------------
  onSystemSearchSubmit() {
    this.adminService.systemLogParams.update(current => ({
      ...current,
      pageNumber: 1,
      search: this.systemSearchInput().trim()
    }));
  }

  clearSystemSearch() {
    this.systemSearchInput.set('');
    this.onSystemSearchSubmit();
  }

  onLevelChange(event: MatSelectChange) {
    this.adminService.systemLogParams.update(current => ({
      ...current,
      pageNumber: 1,
      level: event.value === 'All' ? '' : event.value
    }));
  }

  onSourceChange(event: MatSelectChange) {
    this.adminService.systemLogParams.update(current => ({
      ...current,
      pageNumber: 1,
      source: event.value === 'All' ? '' : event.value
    }));
  }

  onSystemPageChange(event: PageEvent) {
    this.adminService.systemLogParams.update(current => ({
      ...current,
      pageNumber: event.pageIndex + 1,
      pageSize: event.pageSize
    }));
  }

  resetSystemFilters() {
    this.systemSearchInput.set('');
    this.adminService.systemLogParams.set({
      pageNumber: 1,
      pageSize: this.systemPageSize(),
      level: '',
      source: '',
      search: ''
    });
  }

  // ---------------- Audit Log Filters ----------------
  onAuditSearchSubmit() {
    this.adminService.auditLogParams.update(current => ({
      ...current,
      pageNumber: 1,
      search: this.auditSearchInput().trim()
    }));
  }

  clearAuditSearch() {
    this.auditSearchInput.set('');
    this.onAuditSearchSubmit();
  }

  onActionChange(event: MatSelectChange) {
    this.adminService.auditLogParams.update(current => ({
      ...current,
      pageNumber: 1,
      action: event.value === 'All' ? '' : event.value
    }));
  }

  onEntityChange(event: MatSelectChange) {
    this.adminService.auditLogParams.update(current => ({
      ...current,
      pageNumber: 1,
      entityName: event.value === 'All' ? '' : event.value
    }));
  }

  onAuditPageChange(event: PageEvent) {
    this.adminService.auditLogParams.update(current => ({
      ...current,
      pageNumber: event.pageIndex + 1,
      pageSize: event.pageSize
    }));
  }

  resetAuditFilters() {
    this.auditSearchInput.set('');
    this.adminService.auditLogParams.set({
      pageNumber: 1,
      pageSize: this.auditPageSize(),
      action: '',
      entityName: '',
      search: ''
    });
  }

  // ---------------- Styling & Inspection ----------------
  getLevelBadgeClass(level: string): string {
    return LEVEL_BADGE_MAP[level] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  }

  getLevelDotClass(level: string): string {
    return LEVEL_DOT_MAP[level] ?? 'bg-gray-400';
  }

  getStatusBadgeClass(status: number | null | undefined): string {
    if (!status) return 'bg-gray-100 text-gray-600';
    if (status >= 500) return 'bg-red-50 text-red-700';
    if (status >= 400) return 'bg-amber-50 text-amber-700';
    return 'bg-emerald-50 text-emerald-700';
  }

  getActionBadgeClass(action: string): string {
    return ACTION_BADGE_MAP[action] ?? 'bg-purple-50 text-purple-700 border-purple-200';
  }

  splitColumns(raw: string | null | undefined): string[] {
    if (!raw) return [];
    return raw.split(',').map(c => c.trim()).filter(Boolean);
  }

  inspectSystemLog(log: SystemLog) {
    const data: LogDetailsDialogData = { kind: 'system', log };
    this.dialog.open(LogDetailsDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      data
    });
  }

  inspectAuditLog(log: AuditLog) {
    const data: LogDetailsDialogData = { kind: 'audit', log };
    this.dialog.open(LogDetailsDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      data
    });
  }
}
