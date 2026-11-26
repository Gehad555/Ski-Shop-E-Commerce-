import { Directive, effect, inject, TemplateRef, ViewContainerRef } from '@angular/core';
import { AccountService } from '../../core/services/account.service';

@Directive({
  selector: '[appIsAdmin]', // *appIsAdmin
})
export class IsAdmin {
  private accountService = inject(AccountService);
  private viewContainerRef = inject(ViewContainerRef);
  private templateRef = inject(TemplateRef);

  constructor() {
    effect(() => {
      if (this.accountService.isAdmin()) {
        if (this.viewContainerRef.length === 0) {
          this.viewContainerRef.createEmbeddedView(this.templateRef);
        }
      } else {
        this.viewContainerRef.clear();
      }
    });
  }
}
