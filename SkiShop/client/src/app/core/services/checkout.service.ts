import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { DeliveryMethod } from '../../shared/models/delivery';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  deliveryMethods = signal<DeliveryMethod[]>([]);

  getDeliveryMethods() {
    return this.http.get<DeliveryMethod[]>(`${this.baseUrl}payments/delivery-methods`).pipe(
      map(methods => {
        this.deliveryMethods.set(methods.sort((a, b) => b.price - a.price));
        return methods;
      })
    );
  }
}
