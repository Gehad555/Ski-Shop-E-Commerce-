import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { Product } from './shared/models/product';
import { HttpClient } from '@angular/common/http';
import { Pagination } from './shared/models/pagination';
import { ShopComponent } from './features/shop/shop.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent ,ShopComponent ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  title = 'Skinet';
}
