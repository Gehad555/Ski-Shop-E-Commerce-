import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../shared/confirmation-dialog/confirmation-dialog.component';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private dialog = inject(MatDialog);

  confirm(title: string, message: string) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      width: '400px',
      maxWidth: '95vw',
      data: { title, message }
    });

    return firstValueFrom(dialogRef.afterClosed());
  }
}
