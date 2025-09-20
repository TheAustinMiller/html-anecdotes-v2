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
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) { }

  onLogin() {
    if (!this.username || !this.password) {
      this.error = 'Username and password are required';
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.login(this.username, this.password).subscribe({
      next: (response) => {
        if (response.ok) {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.error = error.message;
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}