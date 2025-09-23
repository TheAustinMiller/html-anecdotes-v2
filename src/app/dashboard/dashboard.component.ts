import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { PostService, Post } from '../services/post.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  posts: Post[] = [];
  loading = false;
  error = '';
  success = '';
  
  // Post creation
  showNewPostDialog = false;
  newPostTitle = '';
  newPostContent = '';
  creatingPost = false;
  
  // Post editing
  editingPost: Post | null = null;
  editTitle = '';
  editContent = '';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private auth: AuthService, 
    private postService: PostService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserData();
    this.loadPosts();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadUserData(): void {
    const userSub = this.auth.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
    this.subscriptions.push(userSub);
  }

  loadPosts(): void {
    this.loading = true;
    this.error = '';
    
    const postsSub = this.postService.getPosts().subscribe({
      next: (response) => {
        this.posts = response.posts;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load posts: ' + error.message;
        this.loading = false;
      }
    });
    this.subscriptions.push(postsSub);
  }

  onNewPost(): void {
    this.showNewPostDialog = true;
    this.newPostTitle = '';
    this.newPostContent = '';
    this.error = '';
    this.success = '';
  }

  onCancelNewPost(): void {
    this.showNewPostDialog = false;
    this.newPostTitle = '';
    this.newPostContent = '';
  }

  onCreatePost(): void {
    if (!this.newPostTitle.trim() || !this.newPostContent.trim()) {
      this.error = 'Title and content are required';
      return;
    }

    this.creatingPost = true;
    this.error = '';

    const createSub = this.postService.createPost(this.newPostTitle.trim(), this.newPostContent.trim()).subscribe({
      next: (response) => {
        this.success = 'Post created successfully!';
        this.showNewPostDialog = false;
        this.newPostTitle = '';
        this.newPostContent = '';
        this.loadPosts(); // Refresh the list
        this.creatingPost = false;
        
        // Clear success message after 3 seconds
        setTimeout(() => this.success = '', 3000);
      },
      error: (error) => {
        this.error = 'Failed to create post: ' + error.message;
        this.creatingPost = false;
      }
    });
    this.subscriptions.push(createSub);
  }

  onEditPost(post: Post): void {
    this.editingPost = post;
    this.editTitle = post.title;
    this.editContent = post.content;
    this.error = '';
  }

  onCancelEdit(): void {
    this.editingPost = null;
    this.editTitle = '';
    this.editContent = '';
  }

  onSaveEdit(): void {
    if (!this.editingPost || !this.editTitle.trim() || !this.editContent.trim()) {
      this.error = 'Title and content are required';
      return;
    }

    const editSub = this.postService.updatePost(this.editingPost.id, this.editTitle.trim(), this.editContent.trim()).subscribe({
      next: (response) => {
        this.success = 'Post updated successfully!';
        this.editingPost = null;
        this.editTitle = '';
        this.editContent = '';
        this.loadPosts(); // Refresh the list
        
        // Clear success message after 3 seconds
        setTimeout(() => this.success = '', 3000);
      },
      error: (error) => {
        this.error = 'Failed to update post: ' + error.message;
      }
    });
    this.subscriptions.push(editSub);
  }

  canEditPost(post: Post): boolean {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const postCreated = new Date(post.createdAt);
  return postCreated > thirtyMinutesAgo;
}

  onDeletePost(post: Post): void {
    if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
      const deleteSub = this.postService.deletePost(post.id).subscribe({
        next: () => {
          this.success = 'Post deleted successfully!';
          this.loadPosts(); // Refresh the list
          
          // Clear success message after 3 seconds
          setTimeout(() => this.success = '', 3000);
        },
        error: (error) => {
          this.error = 'Failed to delete post: ' + error.message;
        }
      });
      this.subscriptions.push(deleteSub);
    }
  }

  onLogout(): void {
    if (confirm('Are you sure you want to log out?')) {
      const logoutSub = this.auth.logout().subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.error = 'Logout failed: ' + error.message;
        }
      });
      this.subscriptions.push(logoutSub);
    }
  }

  onCloseWindow(): void {
    this.router.navigate(['/']);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  clearMessages(): void {
    this.error = '';
    this.success = '';
  }

  trackByPostId(index: number, post: Post): number {
    return post.id;
  }
}