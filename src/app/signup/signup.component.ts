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

  onSignup(): void {
    this.error = '';
    this.success = '';

    // Basic validation
    if (!this.username?.trim() || !this.password?.trim()) {
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

    // Check for suspicious patterns (same as login)
    const suspiciousPatterns = [
      /['"]/g,
      /;\s*drop\s/i,
      /;\s*delete\s/i,
      /;\s*insert\s/i,
      /;\s*update\s/i,
      /<script/i,
      /javascript:/i
    ];

    if (suspiciousPatterns.some(pattern => 
        pattern.test(this.username) || pattern.test(this.password) || pattern.test(this.email))) {
      this.error = 'Invalid characters detected';
      return;
    }

    this.loading = true;

    this.auth.signup(this.username.trim(), this.password, this.email || undefined).subscribe({
      next: (response) => {
        this.success = 'Account created successfully! Redirecting to login...';
        
        // Clear sensitive data
        this.password = '';
        this.confirmPassword = '';
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        // Clear passwords on error
        this.password = '';
        this.confirmPassword = '';
        this.error = error.message;
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onCloseWindow(): void {
    // Clear sensitive data
    this.username = '';
    this.password = '';
    this.confirmPassword = '';
    this.email = '';
    this.error = '';
    this.success = '';
    
    // Navigate to root
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    // Clear sensitive data when component is destroyed
    this.password = '';
    this.confirmPassword = '';
  }
}