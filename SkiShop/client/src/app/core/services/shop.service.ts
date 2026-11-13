import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Pagination } from '../../shared/models/pagination';
import { Product } from '../../shared/models/product';
import { ShopParams } from '../../shared/models/shopParams';

@Injectable({
  providedIn: 'root',
})
export class ShopService {

  baseUrl = 'https://localhost:7076/api/';

  private http = inject(HttpClient);

  types: string[] = [];
  brands: string[] = [];

  getproducts(ShopParams: ShopParams) {
     
    let params = new HttpParams();

    if (ShopParams.brands.length > 0) {
      params = params.append('brands', ShopParams.brands.join(','));
    }

    if (ShopParams.types.length > 0) {
      params = params.append('types', ShopParams.types.join(','));
    }

    params = params.append('sort', ShopParams.sort);

    params = params.append('pageNumber', ShopParams.pageNumber.toString());
    params = params.append('pageSize', ShopParams.pageSize.toString());

    if (ShopParams.search) {
      params = params.append('search', ShopParams.search);
    }

    return this.http.get<Pagination<Product>>(this.baseUrl + 'products', { params: params });
  }

  getBrands() {
    if(this.brands.length > 0) return ;
    return this.http.get<string[]>(this.baseUrl + 'products/brands').subscribe({
      next: response => this.brands = response,
    })
  }

  getTypes() {
    if(this.types.length > 0) return ;
    return this.http.get<string[]>(this.baseUrl + 'products/types').subscribe({
      next: response => this.types = response,
    })
  }



  
}
