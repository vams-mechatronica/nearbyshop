import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { CategoryService } from '../../services/category.service';


@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule],
})
export class HomeComponent implements OnInit{
  categories: any[] = [];
  recentVisits = ['Groceries', 'Rice', 'Wheat'];

  constructor(
    private router: Router,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe((res: any) => {
      this.categories = res.results;
    });
  }

  selectCategory(cat: any) {
    this.router.navigate(['/products', cat.id]);
  }
}
