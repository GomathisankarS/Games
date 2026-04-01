import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="glass-panel">
      <h1 class="h1-title">Quiz Battle</h1>
      <p class="subtitle">Join or create a real-time room to play</p>
      
      <div class="input-group">
        <label class="input-label">Your Name</label>
        <input type="text" class="form-control" [(ngModel)]="name" placeholder="Enter your name">
      </div>
      
      <div class="input-group mb-3">
        <label class="input-label">Room ID</label>
        <input type="text" class="form-control" [(ngModel)]="roomId" placeholder="Enter Room ID to join">
      </div>
      
      <div class="options-grid" style="margin-top: 0">
        <button class="btn-primary" [disabled]="!name.trim()" (click)="createRoom()" style="background: rgba(255,255,255,0.1); color: var(--text-primary)">Create Room</button>
        <button class="btn-primary" [disabled]="!name.trim() || !roomId.trim()" (click)="joinRoom()">Join Room</button>
      </div>
    </div>
  `
})
export class LobbyComponent {
  @Output() onJoin = new EventEmitter<{name: string, roomId: string}>();
  
  name: string = '';
  roomId: string = '';

  createRoom() {
    // Generate simple 5 letter random string
    const generatedRoom = Math.random().toString(36).substring(2, 7).toUpperCase();
    this.onJoin.emit({ name: this.name, roomId: generatedRoom });
  }

  joinRoom() {
    this.onJoin.emit({ name: this.name, roomId: this.roomId.toUpperCase() });
  }
}
