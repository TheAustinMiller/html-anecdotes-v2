import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  typingText: string = '';
  showCursor: boolean = true;
  private currentWordIndex: number = 0;
  private currentCharIndex: number = 0;
  private isDeleting: boolean = false;
  private typingTimeout: any;

  private words: string[] = [
    'note-taker.',
    'thought-jotter.',
    'idea-organizer.',
    'story-sharer.',
    'memory-keeper.',
    'life-logger.'
  ];

  ngOnInit() {
    this.startTypingAnimation();
  }

  ngOnDestroy() {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  private startTypingAnimation() {
    const currentWord = this.words[this.currentWordIndex];

    if (!this.isDeleting) {
      // Typing forward
      this.typingText = currentWord.substring(0, this.currentCharIndex + 1);
      this.currentCharIndex++;

      if (this.currentCharIndex === currentWord.length) {
        // Word complete, wait then start deleting
        this.typingTimeout = setTimeout(() => {
          this.isDeleting = true;
          this.startTypingAnimation();
        }, 2000); // Wait 2 seconds before deleting
        return;
      }
    } else {
      // Deleting backward
      this.typingText = currentWord.substring(0, this.currentCharIndex - 1);
      this.currentCharIndex--;

      if (this.currentCharIndex === 0) {
        // Word fully deleted, move to next word
        this.isDeleting = false;
        this.currentWordIndex = (this.currentWordIndex + 1) % this.words.length;
      }
    }

    // Continue animation
    const speed = this.isDeleting ? 50 : 100; // Faster when deleting
    this.typingTimeout = setTimeout(() => {
      this.startTypingAnimation();
    }, speed);
  }
}
