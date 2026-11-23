import { computed, inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Address, User } from '../../shared/models/user';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl : `${environment.apiUrl}/`;
  private http = inject(HttpClient);

  userResource = httpResource<User>(() => ({
    url: `${this.baseUrl}account/user-info`,
    withCredentials: true
  }));

  currentUser = computed(() => this.userResource.value() ?? null);

  login(values: any) {
    let params = new HttpParams();
    params = params.append('useCookies', true);
    return this.http.post<User>(this.baseUrl + 'login', values, { params }).pipe(
      tap(() => this.userResource.reload())
    );
  }

  register(values: any) {
    return this.http.post(this.baseUrl + 'account/register', values);
  }

  logout() {
    return this.http.post(this.baseUrl + 'account/logout', {}).pipe(
      tap(() => this.userResource.set(undefined))
    );
  }

  updateAddress(address: Address) {
    return this.http.post(this.baseUrl + 'account/address', address).pipe(
      tap(() => {
        this.userResource.update(user => {
          if (user) user.address = address;
          return user;
        });
      })
    );
  }
}
