import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService, Player, QuestionPayload } from './services/socket.service';

import { LobbyComponent } from './components/lobby.component';
import { WaitingRoomComponent } from './components/waiting-room.component';
import { GameScreenComponent } from './components/game-screen.component';
import { LeaderboardComponent } from './components/leaderboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LobbyComponent,
    WaitingRoomComponent,
    GameScreenComponent,
    LeaderboardComponent
  ],
  template: `
    <div style="width: 100%; display: flex; justify-content: center; padding: 2rem;">
      <app-lobby 
        *ngIf="currentScreen === 'lobby'"
        (onJoin)="handleJoin($event)">
      </app-lobby>

      <app-waiting-room
        *ngIf="currentScreen === 'waiting'"
        [roomId]="roomId"
        [players]="players"
        [isHost]="isHost"
        (onStart)="handleStart()">
      </app-waiting-room>

      <app-game-screen
        *ngIf="currentScreen === 'game'"
        [question]="currentQuestion"
        [correctAnswer]="revealedAnswer"
        (onSubmit)="handleSubmit($event)">
      </app-game-screen>

      <app-leaderboard
        *ngIf="currentScreen === 'leaderboard'"
        [players]="players">
      </app-leaderboard>
    </div>
  `
})
export class AppComponent implements OnInit {
  currentScreen: 'lobby' | 'waiting' | 'game' | 'leaderboard' = 'lobby';
  
  playerName: string = '';
  roomId: string = '';
  players: Player[] = [];
  
  // Game State
  currentQuestion: QuestionPayload | null = null;
  revealedAnswer: string | null = null;

  constructor(private socket: SocketService) {}

  ngOnInit() {
    this.socket.onPlayerJoined().subscribe(({ players }) => {
      this.players = players;
    });

    this.socket.onGameStarted().subscribe(() => {
      this.currentScreen = 'game';
    });

    this.socket.onNewQuestion().subscribe((q) => {
      this.currentQuestion = q;
      this.revealedAnswer = null; // Reset previous answer
    });

    this.socket.onAnswerResult().subscribe(({ correctAnswer }) => {
      this.revealedAnswer = correctAnswer;
    });

    this.socket.onScoreUpdated().subscribe(({ leaderboard }) => {
      this.players = leaderboard;
    });

    this.socket.onNextQuestion().subscribe(() => {
      // Just visually prep or clear, though newQuestion overrides mostly
      this.revealedAnswer = null;
    });

    this.socket.onGameOver().subscribe(({ leaderboard }) => {
      this.players = leaderboard;
      this.currentScreen = 'leaderboard';
    });
  }

  get isHost(): boolean {
    const me = this.players.find(p => p.name === this.playerName);
    return me ? me.isHost : false;
  }

  handleJoin(data: {name: string, roomId: string}) {
    this.playerName = data.name;
    this.roomId = data.roomId;
    this.currentScreen = 'waiting';
    this.socket.joinRoom(this.playerName, this.roomId);
  }

  handleStart() {
    this.socket.startGame(this.roomId);
  }

  handleSubmit(answer: string) {
    this.socket.submitAnswer(this.roomId, answer);
  }
}
