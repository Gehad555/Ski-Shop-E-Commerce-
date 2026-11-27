import { Component, computed, inject } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { AuditLog, SystemLog } from '../../../shared/models/logs';

export type LogDetailsDialogData =
  | { kind: 'system'; log: SystemLog }
  | { kind: 'audit'; log: AuditLog };

export interface AuditDiffRow {
  field: string;
  oldValue: string;
  newValue: string;
  changed: boolean;
}

@Component({
  selector: 'app-log-details-dialog',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatIconButton,
    MatIcon,
    MatTooltip
  ],
  templateUrl: './log-details-dialog.component.html'
})
export class LogDetailsDialogComponent {
  private dialogRef = inject(MatDialogRef<LogDetailsDialogComponent>);
  private snackbar = inject(SnackbarService);

  protected data = inject<LogDetailsDialogData>(MAT_DIALOG_DATA);

  protected systemLog = computed(() => (this.data.kind === 'system' ? this.data.log : null));
  protected auditLog = computed(() => (this.data.kind === 'audit' ? this.data.log : null));

  protected affectedColumnsList = computed<string[]>(() => {
    const raw = this.auditLog()?.affectedColumns;
    if (!raw) return [];
    return raw
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);
  });

  protected diffRows = computed<AuditDiffRow[]>(() => {
    const audit = this.auditLog();
    if (!audit) return [];

    const oldMap = this.parseJsonRecord(audit.oldValues);
    const newMap = this.parseJsonRecord(audit.newValues);
    if (!oldMap && !newMap) return [];

    const affected = new Set(this.affectedColumnsList());
    const keys = new Set<string>([
      ...this.affectedColumnsList(),
      ...Object.keys(oldMap ?? {}),
      ...Object.keys(newMap ?? {})
    ]);

    return Array.from(keys).map(field => {
      const hasOld = oldMap != null && field in oldMap;
      const hasNew = newMap != null && field in newMap;
      const oldValue = hasOld ? this.formatValue(oldMap[field]) : '—';
      const newValue = hasNew ? this.formatValue(newMap[field]) : '—';
      return {
        field,
        oldValue,
        newValue,
        changed: affected.has(field) || (hasOld && hasNew && oldValue !== newValue)
      };
    });
  });

  copyText(text: string | null | undefined, label: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      this.snackbar.success(`${label} copied to clipboard`);
    });
  }

  close() {
    this.dialogRef.close();
  }

  private parseJsonRecord(raw: string | null | undefined): Record<string, unknown> | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : { value: parsed };
    } catch {
      return { raw };
    }
  }

  private formatValue(val: unknown): string {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }
}
