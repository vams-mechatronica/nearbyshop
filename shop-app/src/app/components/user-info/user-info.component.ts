import { Component } from '@angular/core';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html'
})
export class UserInfoComponent {
  user = {
    mobile: '9876543210',
    wallet: 500
  };
}
