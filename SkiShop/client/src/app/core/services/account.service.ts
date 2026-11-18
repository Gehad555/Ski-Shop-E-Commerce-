import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoginData, RegisterData, User } from '../../shared/models/user';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClient);
  private baseUrl = 'https://localhost:7076/api';
  currentUser = signal<User | null>(null);

  login(data: LoginData) {
    return this.http.post<User>(`${this.baseUrl}/account/login`, data).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  register(data: RegisterData) {
    return this.http.post(`${this.baseUrl}/account/register`, data);
  }

  getUserInfo() {
    return this.http.get<User>(`${this.baseUrl}/account`).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  logout() {
    return this.http.post(`${this.baseUrl}/account/logout`, {}).pipe(
      tap(() => this.currentUser.set(null))
    );
  }
}
