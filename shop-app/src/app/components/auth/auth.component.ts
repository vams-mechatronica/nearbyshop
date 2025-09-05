import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, EventEmitter, Output, OnInit, Injectable } from '@angular/core';
import { RouterModule, ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { StorageService } from '../../services/storage.service';


@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})

@Injectable({
  providedIn: 'root'
})
export class AuthComponent implements OnInit {
  phone: string = '';
  otp: string = '';
  showOtpInput = false;
  redirectTo: string |null= null;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    public activeModal: NgbActiveModal,
    private toastrService: ToastrService,
    private storage: StorageService
  ) { }

  ngOnInit(): void {
    this.redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
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
          this.storage.setItem('access_token', access);
          this.storage.setItem('refresh_token', refresh);
          this.storage.setItem('phone', this.phone);
        }

        // ✅ Close the modal after login
        this.activeModal.close('logged-in');
        
        this.toastrService.success('User logged in successfully','Login Success');
        // ✅ Redirect only if redirectTo is provided
        if (this.redirectTo) {
          this.router.navigateByUrl(this.redirectTo);
        }

      },
      error: (err) => {
        this.toastrService.error('Please try again', 'OTP verification failed');
      },
    });
  }
}

