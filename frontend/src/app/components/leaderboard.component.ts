import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../services/socket.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-panel text-center">
      <h2 class="h1-title" style="margin-bottom: 2rem;">Game Over!</h2>

      <ul class="player-list">
        <li class="player-item" *ngFor="let p of sortedPlayers; let i = index">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span style="font-weight: 800; color: var(--accent-color)">#{{i + 1}}</span>
            <span>{{p.name}}</span>
          </div>
          <span style="font-weight: 600">{{p.score}} pts</span>
        </li>
      </ul>

      <p class="subtitle" style="margin-top: 2rem">Thanks for playing.</p>
    </div>
  `
})
export class LeaderboardComponent implements OnChanges {
  @Input() players: Player[] = [];

  sortedPlayers: Player[] = [];

  ngOnChanges() {
    this.sortedPlayers = [...this.players].sort((a, b) => b.score - a.score);
  }
}
