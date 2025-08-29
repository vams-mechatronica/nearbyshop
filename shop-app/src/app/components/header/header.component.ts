import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthComponent } from '../auth/auth.component';
import { UserInfoComponent } from '../user-info/user-info.component';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
})
export class HeaderComponent implements OnInit{
  searchQuery = '';
  userName = 'John Doe';
  showProfileDropdown = false;


  constructor(private router: Router,
     private modalService: NgbModal,
     private userService: UserService,
     @Inject(PLATFORM_ID) private platformId: Object) { }

  get isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!sessionStorage.getItem('access_token');
    }
    return false;
  }

  ngOnInit(): void {
    if (this.isLoggedIn) {
      this.getUserInfo();
    }
  }

  getUserInfo() {
    this.userService.getUserInfo().subscribe({
      next: (res) =>{
        this.userName = res.username;
        console.log(res);
      },
      error: (err) => {console.error(err);}
    });
  }


  loginSignup(): void {
    this.modalService.open(AuthComponent, { centered: true, size: 'sm' });
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
    }
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  userProfile(): void {
    this.modalService.open(UserInfoComponent, { centered: true, size: 'md' });
  }

  logout(): void {
    sessionStorage.removeItem('access_token');
    this.showProfileDropdown = false;
    this.router.navigate(['/']);
  }

  get subscriptionCount(): number {
    if (isPlatformBrowser(this.platformId)) {
      return 0;
    }
    return 0;
  }
  get cartCount(): number{
    return 0;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-nav') && this.showProfileDropdown) {
      this.showProfileDropdown = false;
    }
  }
}
