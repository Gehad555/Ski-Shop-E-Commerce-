import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Address, LoginData, RegisterData, User } from '../../shared/models/user';
import { tap, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  private baseUrl = 'https://localhost:7076/api';
  currentUser = signal<User | null>(null);

  login(data: LoginData) {
    let params = new HttpParams();
    params = params.append('useCookies', 'true');
    return this.http.post<void>(`${this.baseUrl}/login`, data, { params }).pipe(
      switchMap(() => this.getUserInfo())
    );
  }

  register(data: RegisterData) {
    return this.http.post(`${this.baseUrl}/account/register`, data);
  }

  getUserInfo() {
    return this.http.get<User>(`${this.baseUrl}/account/user-info`).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  logout() {
    return this.http.post(`${this.baseUrl}/account/logout`, {}).pipe(
      tap(() => this.currentUser.set(null))
    );
  }

  updateAddress(address: any) {
    const addressDto: Address = {
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode ?? address.postal_code,
    };
    return this.http.post<Address>(`${this.baseUrl}/account/address`, addressDto).pipe(
      tap(() => {
        this.currentUser.update(user => {
          if (user) user.address = addressDto;
          return user;
        });
      })
    );
  }
}
