import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserInfoComponent } from '../user-info/user-info.component';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  imports: [CommonModule,FormsModule],
})

export class HeaderComponent {
  searchQuery: string = '';

  constructor(private router: Router) {}

  loginSignup() {
    this.router.navigate(['/login']);
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
    }
  }
}
