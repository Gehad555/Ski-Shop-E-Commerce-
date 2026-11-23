import { inject, Injectable } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Order, OrderToCreate } from '../../shared/models/order';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private baseUrl = environment.apiUrl;
  private http = inject(HttpClient);

  readonly ordersResource = httpResource<Order[]>(() => `${this.baseUrl}orders`);

  getOrderDetailed(id: number) {
    return this.http.get<Order>(`${this.baseUrl}orders/${id}`);
  }

  createOrder(order: OrderToCreate) {
    return this.http.post<Order>(`${this.baseUrl}orders`, order);
  }
}
