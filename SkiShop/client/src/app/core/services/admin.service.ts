import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OrderParams } from '../models/order-params';
import { HttpClient, HttpParams, httpResource } from '@angular/common/http';
import { Pagination } from '../../shared/models/pagination';
import { Order } from '../../shared/models/order';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl : `${environment.apiUrl}/`;
  private http = inject(HttpClient);

  orderParams = signal<OrderParams>({
    pageNumber: 1,
    pageSize: 10,
    status: ''
  });

  readonly ordersResource = httpResource<Pagination<Order>>(() => {
    const { pageNumber, pageSize, status } = this.orderParams();

    let params = new HttpParams();

    if (status && status !== 'All') params = params.append('status', status);
    params = params.append('pageNumber', pageNumber);
    params = params.append('pageSize', pageSize);

    return {
      url: `${this.baseUrl}admin/orders`,
      params
    };
  });

  refundOrder(id: number) {
    return this.http.post<Order>(`${this.baseUrl}admin/orders/refund/${id}`, {});
  }
}
