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
  loginAttempts = 0;
  maxAttempts = 5;
  lockoutTime = 15 * 60 * 1000; // 15 minutes in milliseconds
  isLockedOut = false;
  lockoutEndTime = 0;

  constructor(private auth: AuthService, private router: Router) {
    this.checkLockoutStatus();
  }

  private checkLockoutStatus(): void {
    const lockoutData = localStorage.getItem('loginLockout');
    if (lockoutData) {
      const { attempts, lockoutEnd } = JSON.parse(lockoutData);
      const now = Date.now();
      
      if (now < lockoutEnd) {
        this.isLockedOut = true;
        this.lockoutEndTime = lockoutEnd;
        this.loginAttempts = attempts;
        this.startLockoutTimer();
      } else {
        // Lockout expired, clear data
        localStorage.removeItem('loginLockout');
        this.loginAttempts = 0;
      }
    }
  }

  private startLockoutTimer(): void {
    const updateTimer = () => {
      const now = Date.now();
      const timeRemaining = Math.max(0, this.lockoutEndTime - now);
      
      if (timeRemaining > 0) {
        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);
        this.error = `Too many failed attempts. Try again in ${minutes}:${seconds.toString().padStart(2, '0')}`;
        setTimeout(updateTimer, 1000);
      } else {
        this.isLockedOut = false;
        this.error = '';
        this.loginAttempts = 0;
        localStorage.removeItem('loginLockout');
      }
    };
    updateTimer();
  }

  private handleFailedAttempt(): void {
    this.loginAttempts++;
    
    if (this.loginAttempts >= this.maxAttempts) {
      this.isLockedOut = true;
      this.lockoutEndTime = Date.now() + this.lockoutTime;
      
      localStorage.setItem('loginLockout', JSON.stringify({
        attempts: this.loginAttempts,
        lockoutEnd: this.lockoutEndTime
      }));
      
      this.startLockoutTimer();
    } else {
      this.error = 'Invalid username or password';
    }
  }

  private resetFailedAttempts(): void {
    this.loginAttempts = 0;
    localStorage.removeItem('loginLockout');
  }

  onLogin(): void {
    if (this.isLockedOut) {
      return;
    }

    // Enhanced input validation
    this.error = '';
    
    if (!this.username?.trim() || !this.password?.trim()) {
      this.error = 'Username and password are required';
      return;
    }

    // Check for suspicious patterns
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
        pattern.test(this.username) || pattern.test(this.password))) {
      this.error = 'Invalid characters detected';
      this.handleFailedAttempt();
      return;
    }

    this.loading = true;

    this.auth.login(this.username.trim(), this.password).subscribe({
      next: (response) => {
        if (response.ok) {
          this.resetFailedAttempts();
          
          // Clear sensitive data
          this.password = '';
          
          // Navigate to dashboard
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        // Clear password on error for security
        this.password = '';
        
        // Handle specific error types
        if (error.message.includes('Invalid credentials') || 
            error.message.includes('User not found')) {
          this.handleFailedAttempt();
        } else {
          this.error = 'Login failed. Please try again.';
        }
        
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onCloseWindow(): void {
    // Clear any sensitive data
    this.username = '';
    this.password = '';
    this.error = '';
    
    // Navigate to home
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    // Clear sensitive data when component is destroyed
    this.password = '';
    this.username = '';
  }
}