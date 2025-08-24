import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserInfoComponent } from '../user-info/user-info.component';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthComponent } from '../auth/auth.component';



@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  imports: [CommonModule,FormsModule,RouterLink, RouterLinkActive],
})

export class HeaderComponent {
  searchQuery: string = '';
  constructor(private router: Router, private modalService: NgbModal) {}

  loginSignup() {
    this.modalService.open(AuthComponent, {
      centered: true,
      size: 'sm',
    });
    // this.router.navigate(['/auth'], { queryParams: { redirectTo: this.router.url } });
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
    }
  }
}
