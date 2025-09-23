import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, EventEmitter, Output, OnInit, Injectable } from '@angular/core';
import { RouterModule, ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { StorageService } from '../../services/storage.service';
import { LoaderService } from '../../services/loader.service';


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
  isSendingOtp = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    public activeModal: NgbActiveModal,
    private loaderService:LoaderService,
    private toastrService: ToastrService,
    private storage: StorageService
  ) { }

  ngOnInit(): void {
    this.redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
  }

  sendOtp() {
    this.isSendingOtp = true;
    const fullPhone = `91${this.phone}`;

    if (!this.phone || this.phone.length !== 10 || !/^\d{10}$/.test(this.phone)) {
      alert('Please enter a valid 10-digit phone number.');
      this.isSendingOtp = false;
      return;
    }
    // this.loaderService.show();
    this.authService.sendLoginOtp(fullPhone).subscribe({
      next: (res) => {
        this.isSendingOtp = false;
        this.showOtpInput = true;
        // this.loaderService.hide();
      },
      error: (err) => {
        // this.loaderService.hide();
        this.isSendingOtp = false;
        alert('Failed to send OTP. Please try again later.');
      }
    });
  }

  otpControls = Array(4).fill(''); // just for *ngFor
  otpValues: string[] = ['', '', '', ''];

  onOtpInput(event: any, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, ''); // allow digits only
    input.value = value;
    this.otpValues[index] = value;

    if (value && index < this.otpControls.length - 1) {
      // focus next input
      const next = input.nextElementSibling as HTMLInputElement;
      next?.focus();
    }

    this.emitOtp();
  }

  onOtpBackspace(event: any, index: number) {
  const input = event.target as HTMLInputElement;
  if (!input.value && index > 0 && event.key === 'Backspace') {
    const prev = input.previousElementSibling as HTMLInputElement;
    prev?.focus();
  }
}


  emitOtp() {
    this.otp = this.otpValues.join('');
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

