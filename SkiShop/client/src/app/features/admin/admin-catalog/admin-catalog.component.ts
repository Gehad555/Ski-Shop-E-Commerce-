import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
import { ShopService } from '../../../core/services/shop.service';
import { DialogService } from '../../../core/services/dialog.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Product } from '../../../shared/models/product';
import { ProductDialogComponent, ProductDialogData } from '../product-dialog/product-dialog.component';

@Component({
  selector: 'app-admin-catalog',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    NgClass,
    RouterLink,
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
  templateUrl: './admin-catalog.component.html',
  styleUrl: './admin-catalog.component.scss'
})
export class AdminCatalogComponent implements OnInit {
  protected adminService = inject(AdminService);
  protected shopService = inject(ShopService);
  private dialog = inject(MatDialog);
  private dialogService = inject(DialogService);
  private snackbar = inject(SnackbarService);

  protected displayedColumns: string[] = [
    'no',
    'product',
    'brand',
    'type',
    'price',
    'stock',
    'actions'
  ];

  protected sortOptions = [
    { label: 'Name (A–Z)', value: 'name' },
    { label: 'Price: Low to High', value: 'priceAsc' },
    { label: 'Price: High to Low', value: 'priceDesc' }
  ];

  protected searchInput = signal('');

  protected products = computed<Product[]>(() => this.adminService.productsResource.value()?.data ?? []);
  protected totalItems = computed(() => this.adminService.productsResource.value()?.count ?? 0);
  protected pageIndex = computed(() => this.adminService.catalogParams().pageNumber - 1);
  protected pageSize = computed(() => this.adminService.catalogParams().pageSize);

  protected selectedBrand = computed(() => this.adminService.catalogParams().brands[0] ?? 'All');
  protected selectedType = computed(() => this.adminService.catalogParams().types[0] ?? 'All');
  protected selectedSort = computed(() => this.adminService.catalogParams().sort);

  protected lowStockCount = computed(() =>
    this.products().filter(p => p.quantityInStock > 0 && p.quantityInStock <= 10).length
  );

  protected outOfStockCount = computed(() =>
    this.products().filter(p => p.quantityInStock === 0).length
  );

  protected hasActiveFilters = computed(() => {
    const p = this.adminService.catalogParams();
    return Boolean(p.search || p.brands.length || p.types.length || p.sort !== 'name');
  });

  ngOnInit() {
    this.shopService.getBrands();
    this.shopService.getTypes();
    this.adminService.catalogActive.set(true);
  }

  onSearchSubmit() {
    this.adminService.catalogParams.update(current => ({
      ...current,
      pageNumber: 1,
      search: this.searchInput().trim()
    }));
  }

  clearSearch() {
    this.searchInput.set('');
    this.onSearchSubmit();
  }

  onBrandChange(event: MatSelectChange) {
    const brand = event.value;
    this.adminService.catalogParams.update(current => ({
      ...current,
      pageNumber: 1,
      brands: brand && brand !== 'All' ? [brand] : []
    }));
  }

  onTypeChange(event: MatSelectChange) {
    const type = event.value;
    this.adminService.catalogParams.update(current => ({
      ...current,
      pageNumber: 1,
      types: type && type !== 'All' ? [type] : []
    }));
  }

  onSortChange(event: MatSelectChange) {
    this.adminService.catalogParams.update(current => ({
      ...current,
      pageNumber: 1,
      sort: event.value
    }));
  }

  onPageChange(event: PageEvent) {
    this.adminService.catalogParams.update(current => ({
      ...current,
      pageNumber: event.pageIndex + 1,
      pageSize: event.pageSize
    }));
  }

  resetFilters() {
    this.searchInput.set('');
    this.adminService.catalogParams.set({
      brands: [],
      types: [],
      sort: 'name',
      pageNumber: 1,
      pageSize: this.pageSize(),
      search: ''
    });
  }

  reload() {
    this.adminService.productsResource.reload();
  }

  openCreateDialog() {
    const data: ProductDialogData = {
      mode: 'create',
      brands: this.shopService.brands(),
      types: this.shopService.types()
    };
    this.dialog.open(ProductDialogComponent, {
      width: '620px',
      maxWidth: '95vw',
      data
    });
  }

  openEditDialog(product: Product) {
    const data: ProductDialogData = {
      mode: 'edit',
      product,
      brands: this.shopService.brands(),
      types: this.shopService.types()
    };
    this.dialog.open(ProductDialogComponent, {
      width: '620px',
      maxWidth: '95vw',
      data
    });
  }

  async confirmDelete(product: Product) {
    const confirmed = await this.dialogService.confirm(
      'Delete product',
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    this.adminService.deleteProduct(product.id).subscribe({
      next: () => {
        this.snackbar.success(`Deleted "${product.name}"`);
      }
    });
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith('/images/placeholder.png')) {
      img.src = '/images/placeholder.png';
    }
  }
}
