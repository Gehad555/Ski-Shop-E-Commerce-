import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Pagination } from '../../shared/models/pagination';
import { Product } from '../../shared/models/product';
import { ShopParams } from '../../shared/models/shopParams';

@Injectable({
  providedIn: 'root',
})
export class ShopService {

  baseUrl = environment.apiUrl;

  private http = inject(HttpClient);

  types = signal<string[]>([]);
  brands = signal<string[]>([]);

  getproducts(ShopParams: ShopParams) {
     
    let params = new HttpParams();

    if (ShopParams.brands.length > 0) {
      params = params.append('brands', ShopParams.brands.join(','));
    }

    if (ShopParams.types.length > 0) {
      params = params.append('types', ShopParams.types.join(','));
    }

    params = params.append('sort', ShopParams.sort);

    params = params.append('pageIndex', ShopParams.pageNumber.toString());
    params = params.append('pageNumber', ShopParams.pageNumber.toString());
    params = params.append('pageSize', ShopParams.pageSize.toString());

    if (ShopParams.search && ShopParams.search.trim()) {
      params = params.append('search', ShopParams.search.trim());
    }

    return this.http.get<Pagination<Product>>(this.baseUrl + 'products', { params: params });
  }

  getBrands() {
    if (this.brands().length > 0) return;
    return this.http.get<string[]>(this.baseUrl + 'products/brands').subscribe({
      next: response => this.brands.set(response),
    })
  }


getProductsById(id: number) {
    return this.http.get<Product>(this.baseUrl + 'products/' + id);
  }
  getTypes() {
    if (this.types().length > 0) return;
    return this.http.get<string[]>(this.baseUrl + 'products/types').subscribe({
      next: response => this.types.set(response),
    })
  }



  
}
