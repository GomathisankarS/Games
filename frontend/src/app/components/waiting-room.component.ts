import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../services/socket.service';

@Component({
  selector: 'app-waiting-room',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-panel text-center">
      <h2 class="h1-title" style="font-size: 2rem">Room: {{roomId}}</h2>
      <p class="subtitle">Waiting for players...</p>

      <ul class="player-list">
        <li class="player-item" *ngFor="let p of players">
          <span>{{p.name}}</span>
          <span *ngIf="p.isHost" class="badge badge-host">HOST</span>
        </li>
      </ul>

      <div *ngIf="isHost">
        <button class="btn-primary" (click)="startGame()">Start Game</button>
      </div>
      <div *ngIf="!isHost">
        <p class="subtitle" style="margin: 0; font-size: 0.9rem;">Waiting for host to start...</p>
      </div>
    </div>
  `
})
export class WaitingRoomComponent {
  @Input() roomId: string = '';
  @Input() players: Player[] = [];
  @Input() isHost: boolean = false;
  
  @Output() onStart = new EventEmitter<void>();

  startGame() {
    this.onStart.emit();
  }
}
