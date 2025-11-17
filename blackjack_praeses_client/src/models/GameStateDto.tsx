import type { CardDto } from "./CardDto";
import type { PlayerDto } from "./PlayerDto";

export interface GameStateDto {
  gameStateSessionId: string;
  players: PlayerDto[];
  dealerHand: CardDto[];
  dealerValue: number | null;
  currentPlayerIndex: number;
  isGameOver: boolean;
  cardsRemaining: number;
  totalCards: number;
  deckCount: number;

  // Backward compatibility for single player
  playerHand: CardDto[];
  playerValue: number;
  winner: "player" | "dealer" | "push" | null;
  canSplit: boolean;
  canDouble: boolean;
  currentHandIndex: number;
  totalHands: number;
}
