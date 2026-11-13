import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { Product } from './shared/models/product';
import { HttpClient } from '@angular/common/http';
import { Pagination } from './shared/models/pagination';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App implements OnInit {
  baseUrl = 'https://localhost:5001/api/';
  products = signal<Product[]>([]);
  http = inject(HttpClient);
  title = 'Skinet';

ngOnInit() {
    this.http.get<Pagination<Product>>(this.baseUrl + 'products').subscribe({
      next: response => this.products.set(response.data),
      error: error => console.error(error),
      complete: () => console.log('complete')
    })
  }

}
