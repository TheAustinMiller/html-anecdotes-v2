import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  username = '';
  password = '';
  confirmPassword = '';
  email = '';
  loading = false;
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) { }

  onSignup() {
    this.error = '';
    this.success = '';

    // Validation
    if (!this.username || !this.password) {
      this.error = 'Username and password are required';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters long';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;

    this.auth.signup(this.username, this.password, this.email || undefined).subscribe({
      next: (response) => {
        this.success = response.message;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
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