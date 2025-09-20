import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface Post {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  username: string;
}

export interface PostsResponse {
  posts: Post[];
  user: string;
  count: number;
}

export interface CreatePostResponse {
  message: string;
  post: Post;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {

  constructor(private http: HttpClient) { }

  // Get all posts for current user
  getPosts(limit: number = 50, offset: number = 0): Observable<PostsResponse> {
    const params = { limit: limit.toString(), offset: offset.toString() };
    
    return this.http.get<PostsResponse>('/api/posts', { 
      params,
      withCredentials: true 
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Get a specific post
  getPost(id: number): Observable<Post> {
    return this.http.get<Post>(`/api/posts/${id}`, { 
      withCredentials: true 
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Create a new post
  createPost(title: string, content: string): Observable<CreatePostResponse> {
    const body = { title, content };
    
    return this.http.post<CreatePostResponse>('/api/posts', body, { 
      withCredentials: true 
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Update an existing post
  updatePost(id: number, title: string, content: string): Observable<CreatePostResponse> {
    const body = { title, content };
    
    return this.http.put<CreatePostResponse>(`/api/posts/${id}`, body, { 
      withCredentials: true 
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Delete a post
  deletePost(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/posts/${id}`, { 
      withCredentials: true 
    }).pipe(
      catchError(this.handleError)
    );
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