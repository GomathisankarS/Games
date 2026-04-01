import { Component, EventEmitter, Input, OnChanges, SimpleChanges, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionPayload } from '../services/socket.service';

@Component({
  selector: 'app-game-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-panel" *ngIf="question">
      <div class="timer-text" [class.timer-warn]="displayTime <= 3">
        00:{{ displayTime < 10 ? '0' + displayTime : displayTime }}
      </div>
      
      <h2 class="h1-title" style="font-size: 1.5rem; text-align: left; margin-bottom: 2rem;">
        {{question.question}}
      </h2>

      <div class="options-grid">
        <button 
          *ngFor="let opt of question.options" 
          class="option-btn"
          [class.selected]="selectedAnswer === opt && !correctAnswer"
          [class.correct]="correctAnswer === opt"
          [class.incorrect]="selectedAnswer === opt && correctAnswer && correctAnswer !== opt"
          [disabled]="hasAnswered || correctAnswer !== null"
          (click)="selectAnswer(opt)">
          {{opt}}
        </button>
      </div>
      
      <div *ngIf="correctAnswer" style="margin-top: 1.5rem; text-align: center;">
        <p class="subtitle" style="color: var(--success-color); font-weight: 600;">
          {{ correctAnswer === selectedAnswer ? '+10 Points!' : 'Correct Answer: ' + correctAnswer }}
        </p>
      </div>
    </div>
  `
})
export class GameScreenComponent implements OnChanges, OnDestroy {
  @Input() question: QuestionPayload | null = null;
  @Input() correctAnswer: string | null = null;
  
  @Output() onSubmit = new EventEmitter<string>();

  hasAnswered = false;
  selectedAnswer: string | null = null;
  displayTime = 10;
  private timerInterval: any;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['question'] && this.question) {
      this.resetRound();
    }
    if (changes['correctAnswer'] && this.correctAnswer) {
      clearInterval(this.timerInterval);
    }
  }

  resetRound() {
    this.hasAnswered = false;
    this.selectedAnswer = null;
    this.correctAnswer = null;
    this.displayTime = this.question ? this.question.time : 10;
    
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.displayTime--;
      if (this.displayTime <= 0) {
        clearInterval(this.timerInterval);
        this.displayTime = 0;
      }
    }, 1000);
  }

  selectAnswer(opt: string) {
    if (this.hasAnswered) return;
    this.hasAnswered = true;
    this.selectedAnswer = opt;
    this.onSubmit.emit(opt);
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
  }
}
