import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

export interface Player {
  socketId: string;
  name: string;
  score: number;
  answered: boolean;
  isHost: boolean;
}

export interface QuestionPayload {
  question: string;
  options: string[];
  time: number;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;

  constructor() {
    const URL = window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://games-zclh.onrender.com"; 

    this.socket = io(URL);
  }

  // ---- EMITTERS ----

  joinRoom(name: string, roomId: string): void {
    this.socket.emit('joinRoom', { name, roomId });
  }

  startGame(roomId: string): void {
    this.socket.emit('startGame', { roomId });
  }

  submitAnswer(roomId: string, answer: string): void {
    this.socket.emit('submitAnswer', { roomId, answer });
  }

  // ---- LISTENERS ----

  onPlayerJoined(): Observable<{ players: Player[] }> {
    return new Observable(observer => {
      this.socket.on('playerJoined', (data) => observer.next(data));
      return () => this.socket.off('playerJoined');
    });
  }

  onGameStarted(): Observable<{}> {
    return new Observable(observer => {
      this.socket.on('gameStarted', (data) => observer.next(data));
      return () => this.socket.off('gameStarted');
    });
  }

  onNewQuestion(): Observable<QuestionPayload> {
    return new Observable(observer => {
      this.socket.on('newQuestion', (data) => observer.next(data));
      return () => this.socket.off('newQuestion');
    });
  }

  onAnswerResult(): Observable<{ correctAnswer: string }> {
    return new Observable(observer => {
      this.socket.on('answerResult', (data) => observer.next(data));
      return () => this.socket.off('answerResult');
    });
  }

  onScoreUpdated(): Observable<{ leaderboard: Player[] }> {
    return new Observable(observer => {
      this.socket.on('scoreUpdated', (data) => observer.next(data));
      return () => this.socket.off('scoreUpdated');
    });
  }

  onNextQuestion(): Observable<{}> {
    return new Observable(observer => {
      this.socket.on('nextQuestion', (data) => observer.next(data));
      return () => this.socket.off('nextQuestion');
    });
  }

  onGameOver(): Observable<{ leaderboard: Player[] }> {
    return new Observable(observer => {
      this.socket.on('gameOver', (data) => observer.next(data));
      return () => this.socket.off('gameOver');
    });
  }
}
