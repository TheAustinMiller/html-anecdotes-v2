import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, throwError, tap } from 'rxjs';

export interface User {
  id: number;
  username: string;
  email?: string;
}

export interface LoginResponse {
  ok: boolean;
  user: User;
}

export interface SignupResponse {
  message: string;
  user: {
    id: number;
    username: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(false);
  private currentUser = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) {
    // Check if user is already logged in on app start
    this.checkAuthStatus();
  }

  // Check current authentication status with server
  checkAuthStatus(): void {
    this.http.get<{ user: User }>('/api/auth/me', { withCredentials: true })
      .subscribe({
        next: (response) => {
          this.currentUser.next(response.user);
          this.loggedIn.next(true);
        },
        error: () => {
          this.currentUser.next(null);
          this.loggedIn.next(false);
        }
      });
  }

  signup(username: string, password: string, email?: string): Observable<SignupResponse> {
    const body = { username, password, email };
    
    return this.http.post<SignupResponse>('/api/auth/signup', body, { 
      withCredentials: true 
    }).pipe(
      catchError(this.handleError)
    );
  }

  login(username: string, password: string): Observable<LoginResponse> {
    const body = { username, password };
    
    return this.http.post<LoginResponse>('/api/auth/login', body, { 
      withCredentials: true 
    }).pipe(
      tap(response => {
        if (response.ok) {
          this.currentUser.next(response.user);
          this.loggedIn.next(true);
        }
      }),
      catchError(this.handleError)
    );
  }

  logout(): Observable<any> {
    return this.http.post('/api/auth/logout', {}, { 
      withCredentials: true 
    }).pipe(
      tap(() => {
        this.currentUser.next(null);
        this.loggedIn.next(false);
      }),
      catchError(this.handleError)
    );
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUser.asObservable();
  }

  getUser(): User | null {
    return this.currentUser.value;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}