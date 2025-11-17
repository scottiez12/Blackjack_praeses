import type { CardDto } from "./CardDto";

export interface PlayerDto {
  playerId: number;
  name: string;
  isHuman: boolean;
  hands: CardDto[][];
  handValues: number[];
  currentHandIndex: number;
  results: (string | null)[];
  balance: number;
  currentBet: number;
  betsPerHand: number[];
}
