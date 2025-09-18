import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';

  constructor(private auth: AuthService, private router: Router) { }

  onLogin() {
    this.auth.login(this.username, this.password);
    const token = localStorage.getItem('token');
    if (token) {
      this.router.navigate(['/dashboard']);
    } else {
      alert('Login failed');
    }
  }
}
