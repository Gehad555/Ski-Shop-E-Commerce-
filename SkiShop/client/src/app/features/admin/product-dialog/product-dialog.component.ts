import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions, MatDialogTitle } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { AdminService } from '../../../core/services/admin.service';
import { ShopService } from '../../../core/services/shop.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Product } from '../../../shared/models/product';

export interface ProductDialogData {
  mode: 'create' | 'edit';
  product?: Product;
  brands: string[];
  types: string[];
}

const PRODUCT_IMAGE_PRESETS = [
  { label: 'Board — Angular 1', url: '/images/products/sb-ang1.png' },
  { label: 'Board — Angular 2', url: '/images/products/sb-ang2.png' },
  { label: 'Board — NetCore 1', url: '/images/products/sb-core1.png' },
  { label: 'Board — NetCore 2', url: '/images/products/sb-core2.png' },
  { label: 'Board — React', url: '/images/products/sb-react1.png' },
  { label: 'Board — Typescript', url: '/images/products/sb-ts1.png' },
  { label: 'Boots — Angular 1', url: '/images/products/boot-ang1.png' },
  { label: 'Boots — Angular 2', url: '/images/products/boot-ang2.png' },
  { label: 'Boots — NetCore 1', url: '/images/products/boot-core1.png' },
  { label: 'Boots — NetCore 2', url: '/images/products/boot-core2.png' },
  { label: 'Boots — React', url: '/images/products/boot-react1.png' },
  { label: 'Boots — Redis', url: '/images/products/boot-redis1.png' },
  { label: 'Gloves — VS Code 1', url: '/images/products/glove-code1.png' },
  { label: 'Gloves — VS Code 2', url: '/images/products/glove-code2.png' },
  { label: 'Gloves — NetCore', url: '/images/products/glove-core1.png' },
  { label: 'Gloves — React 1', url: '/images/products/glove-react1.png' },
  { label: 'Gloves — React 2', url: '/images/products/glove-react2.png' },
  { label: 'Hat — NetCore', url: '/images/products/hat-core1.png' },
  { label: 'Hat — React 1', url: '/images/products/hat-react1.png' },
  { label: 'Hat — React 2', url: '/images/products/hat-react2.png' }
];

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatSelect,
    MatOption,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatButton,
    MatIconButton,
    MatIcon
  ],
  templateUrl: './product-dialog.component.html',
  styleUrl: './product-dialog.component.scss'
})
export class ProductDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProductDialogComponent>);
  private adminService = inject(AdminService);
  private shopService = inject(ShopService);
  private snackbar = inject(SnackbarService);

  protected data = inject<ProductDialogData>(MAT_DIALOG_DATA);
  protected imagePresets = PRODUCT_IMAGE_PRESETS;
  protected saving = signal(false);

  protected form = this.fb.group({
    name: [this.data.product?.name ?? '', [Validators.required, Validators.minLength(2)]],
    brand: [this.data.product?.brand ?? '', Validators.required],
    type: [this.data.product?.type ?? '', Validators.required],
    price: [this.data.product?.price ?? null as number | null, [Validators.required, Validators.min(0.01)]],
    quantityInStock: [this.data.product?.quantityInStock ?? 10, [Validators.required, Validators.min(0)]],
    pictureUrl: [this.data.product?.pictureUrl ?? '/images/products/sb-ang1.png', Validators.required],
    description: [this.data.product?.description ?? '', [Validators.required, Validators.minLength(5)]]
  });

  onPresetSelected(event: MatSelectChange) {
    if (event.value) {
      this.form.patchValue({ pictureUrl: event.value });
    }
  }

  onPreviewError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith('/images/placeholder.png')) {
      img.src = '/images/placeholder.png';
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  onSubmit() {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name!.trim(),
      brand: raw.brand!.trim(),
      type: raw.type!.trim(),
      price: Number(raw.price),
      quantityInStock: Math.floor(Number(raw.quantityInStock)),
      pictureUrl: raw.pictureUrl!.trim(),
      description: raw.description!.trim()
    };

    this.saving.set(true);

    if (this.data.mode === 'edit' && this.data.product) {
      const updatedProduct: Product = { id: this.data.product.id, ...payload };
      this.adminService.updateProduct(updatedProduct).subscribe({
        next: () => {
          this.syncBrandAndType(payload.brand, payload.type);
          this.saving.set(false);
          this.snackbar.success(`Updated "${payload.name}"`);
          this.dialogRef.close(true);
        },
        error: () => this.saving.set(false)
      });
    } else {
      this.adminService.createProduct(payload).subscribe({
        next: () => {
          this.syncBrandAndType(payload.brand, payload.type);
          this.saving.set(false);
          this.snackbar.success(`Added "${payload.name}" to catalog`);
          this.dialogRef.close(true);
        },
        error: () => this.saving.set(false)
      });
    }
  }

  private syncBrandAndType(brand: string, type: string) {
    if (brand && !this.shopService.brands().includes(brand)) {
      this.shopService.brands.update(list => [...list, brand].sort());
    }
    if (type && !this.shopService.types().includes(type)) {
      this.shopService.types.update(list => [...list, type].sort());
    }
  }
}
