import { Component, HostListener, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthComponent } from '../auth/auth.component';
import { UserService } from '../../services/user.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../shared/constants/api.constants';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
})
export class HeaderComponent implements OnInit {
  searchQuery = '';
  searchResults: any[] = [];  // live search results
  searchSubject = new Subject<string>(); // input stream

  userName = 'John Doe';
  showProfileDropdown = false;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private userService: UserService,
    private http: HttpClient,   // for search API calls
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

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

    // 🔹 setup live search stream
    this.searchSubject.pipe(
      debounceTime(300), // wait 300ms after typing
      distinctUntilChanged(), // only trigger if query changes
      switchMap((query: string) =>
        this.http.get<any[]>(`${API_ENDPOINTS.SEARCH}${query}`) // call your backend API
      )
    ).subscribe({
      next: (res: any) => {
        this.searchResults = res.results;
      },
      error: (err) => {
        console.error('Search error:', err);
        this.searchResults = [];
      }
    });
  }

  getUserInfo() {
    this.userService.getUserInfo().subscribe({
      next: (res) => {
        this.userName = res.username;
      },
      error: (err) => console.error(err)
    });
  }

  loginSignup(): void {
    this.modalService.open(AuthComponent, { centered: true, size: 'sm' });
  }

  // 🔹 called on input change
  onSearchChange(query: string): void {
    this.searchQuery = query;
    if (query.trim().length > 1) {
      this.searchSubject.next(query);
    } else {
      this.searchResults = [];
    }
  }

  // 🔹 when user presses Enter or clicks search button
  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
      this.searchResults = [];
    }
  }

  selectResult(item: any): void {
    // Example: navigate to product details
    this.router.navigate(['/product', item.id]);
    this.searchResults = [];
    this.searchQuery = '';
  }

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  userProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    sessionStorage.removeItem('access_token');
    this.showProfileDropdown = false;
    this.router.navigate(['/']);
  }

  get subscriptionCount(): number {
    return 0;
  }

  get cartCount(): number {
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
