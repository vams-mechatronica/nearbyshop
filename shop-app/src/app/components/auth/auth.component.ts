import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent implements OnInit {
  phone: string = '';
  otp: string = '';
  showOtpInput = false;
  redirectTo: string = '/';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') || '/';
  }

  sendOtp() {
    const fullPhone = `91${this.phone}`;

    if (!this.phone || this.phone.length !== 10 || !/^\d{10}$/.test(this.phone)) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }

    this.authService.sendLoginOtp(fullPhone).subscribe({
      next: (res) => {
        this.showOtpInput = true;
        console.log('OTP sent successfully', res);
      },
      error: (err) => {
        console.error('Failed to send OTP:', err);
        alert('Failed to send OTP. Please try again later.');
      }
    });
  }


  login() {
    this.authService.verifyOtp(`91${this.phone}`, this.otp).subscribe({
      next: (res: any) => {
        const { access, refresh } = res?.token || {};

        if (access && refresh) {
          // Store tokens in session storage
          sessionStorage.setItem('access_token', access);
          sessionStorage.setItem('refresh_token', refresh);

          // Optional: store user info like phone
          sessionStorage.setItem('phone', this.phone);

          // Navigate to the redirected page
          this.router.navigateByUrl(this.redirectTo);
        } else if (res?.token) {
          // In case only one token is returned (fallback)
          sessionStorage.setItem('token', res.token);
          sessionStorage.setItem('phone', this.phone);

          this.router.navigateByUrl(this.redirectTo);
        } else {
          // Log error if no tokens are returned
          console.error('No tokens received in response.');
        }
      },
      error: (err) => {
        console.error('OTP verification failed:', err);
        alert('Invalid OTP or verification failed. Please try again.');
      }
    });
  }

}

