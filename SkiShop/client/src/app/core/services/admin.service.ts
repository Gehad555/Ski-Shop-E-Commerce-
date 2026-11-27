import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OrderParams } from '../models/order-params';
import { HttpClient, HttpParams, httpResource } from '@angular/common/http';
import { Pagination } from '../../shared/models/pagination';
import { Order } from '../../shared/models/order';
import { Product } from '../../shared/models/product';
import { ShopParams } from '../../shared/models/shopParams';
import { tap } from 'rxjs';

export type SupportCaseStatus = 'Open' | 'InProgress' | 'Resolved';

export interface SupportCaseMeta {
  caseStatus: SupportCaseStatus;
  note: string;
  updatedAt: string;
}

export type ProductPayload = Omit<Product, 'id'>;

const SUPPORT_CASES_STORAGE_KEY = 'skishop_admin_support_cases';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl : `${environment.apiUrl}/`;
  private http = inject(HttpClient);

  // ---------------- Orders ----------------
  orderParams = signal<OrderParams>({
    pageNumber: 1,
    pageSize: 10,
    status: ''
  });

  readonly ordersResource = httpResource<Pagination<Order>>(() => {
    const { pageNumber, pageSize, status } = this.orderParams();

    let params = new HttpParams();
    if (status && status !== 'All') params = params.append('status', status);
    params = params.append('pageIndex', pageNumber);
    params = params.append('pageNumber', pageNumber);
    params = params.append('pageSize', pageSize);

    return {
      url: `${this.baseUrl}admin/orders`,
      params
    };
  });

  getOrderById(id: number) {
    return this.http.get<Order>(`${this.baseUrl}admin/orders/${id}`);
  }

  refundOrder(id: number) {
    return this.http.post<Order>(`${this.baseUrl}admin/orders/refund/${id}`, {}).pipe(
      tap(() => {
        this.ordersResource.reload();
        if (this.supportActive()) {
          this.supportOrdersResource.reload();
        }
      })
    );
  }

  // ---------------- Catalog ----------------
  catalogActive = signal(false);

  catalogParams = signal<ShopParams>({
    brands: [],
    types: [],
    sort: 'name',
    pageNumber: 1,
    pageSize: 10,
    search: ''
  });

  readonly productsResource = httpResource<Pagination<Product>>(() => {
    if (!this.catalogActive()) return undefined;

    const { brands, types, sort, pageNumber, pageSize, search } = this.catalogParams();
    let params = new HttpParams();

    if (brands.length > 0) params = params.append('brands', brands.join(','));
    if (types.length > 0) params = params.append('types', types.join(','));
    params = params.append('sort', sort);
    params = params.append('pageIndex', pageNumber);
    params = params.append('pageNumber', pageNumber);
    params = params.append('pageSize', pageSize);
    if (search && search.trim()) params = params.append('search', search.trim());

    return {
      url: `${this.baseUrl}products`,
      params
    };
  });

  createProduct(product: ProductPayload) {
    return this.http.post<Product>(`${this.baseUrl}products`, product).pipe(
      tap(() => this.productsResource.reload())
    );
  }

  updateProduct(product: Product) {
    return this.http.put<void>(`${this.baseUrl}products/${product.id}`, product).pipe(
      tap(() => this.productsResource.reload())
    );
  }

  deleteProduct(id: number) {
    return this.http.delete<void>(`${this.baseUrl}products/${id}`).pipe(
      tap(() => this.productsResource.reload())
    );
  }

  // ---------------- Customer Service ----------------
  supportActive = signal(false);

  readonly supportOrdersResource = httpResource<Pagination<Order>>(() => {
    if (!this.supportActive()) return undefined;

    const params = new HttpParams()
      .append('pageIndex', 1)
      .append('pageSize', 50);

    return {
      url: `${this.baseUrl}admin/orders`,
      params
    };
  });

  private supportCasesMap = signal<Record<number, SupportCaseMeta>>(this.loadSupportCases());
  readonly supportCases = this.supportCasesMap.asReadonly();

  getSupportCase(order: Order): SupportCaseMeta {
    const existing = this.supportCasesMap()[order.id];
    if (existing) return existing;

    const defaultStatus: SupportCaseStatus =
      order.status === 'Pending' || order.status === 'PaymentFailed' ? 'Open' : 'Resolved';

    return {
      caseStatus: defaultStatus,
      note: '',
      updatedAt: order.orderDate
    };
  }

  saveSupportCase(orderId: number, caseStatus: SupportCaseStatus, note: string) {
    const updated: Record<number, SupportCaseMeta> = {
      ...this.supportCasesMap(),
      [orderId]: {
        caseStatus,
        note: note.trim(),
        updatedAt: new Date().toISOString()
      }
    };
    this.supportCasesMap.set(updated);
    this.persistSupportCases(updated);
  }

  private loadSupportCases(): Record<number, SupportCaseMeta> {
    try {
      const raw = localStorage.getItem(SUPPORT_CASES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private persistSupportCases(data: Record<number, SupportCaseMeta>) {
    try {
      localStorage.setItem(SUPPORT_CASES_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage quota errors
    }
  }
}
