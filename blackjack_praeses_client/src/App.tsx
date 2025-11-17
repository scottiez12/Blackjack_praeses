import { useState } from "react";
import axios from "axios";
import CardRow from "./components/CardRow";

import type {
  GameStateDto,
  GameInitDto,
  PlayerDto,
  CardDto,
} from "./types/dtos";

const API = "http://localhost:5277/api/game";

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameStateDto | null>(null);
  const [deckCount, setDeckCount] = useState<number>(1);
  const [playerCount, setPlayerCount] = useState<number>(1);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [currentBet, setCurrentBet] = useState<number>(25);
  const [bettingPhase, setBettingPhase] = useState<boolean>(false);

  async function startGame() {
    const payload: GameInitDto = {
      decks: deckCount,
      players: playerCount,
    };

    const res = await axios.post<GameStateDto>(`${API}/start`, payload);
    setSessionId(res.data.gameStateSessionId);
    setGameState(res.data);
    setBettingPhase(true);
  }

  async function hit() {
    if (!sessionId || isAnimating) return;
    const res = await axios.post<GameStateDto>(`${API}/${sessionId}/hit`);
    setGameState(res.data);
  }

  async function stand() {
    if (!sessionId || isAnimating) return;
    setIsAnimating(true);

    const res = await axios.post<GameStateDto>(`${API}/${sessionId}/stand`);

    // Get initial dealer hand count
    const initialDealerCards = gameState?.dealerHand.length || 2;
    const finalDealerCards = res.data.dealerHand.length;

    // If dealer drew cards, animate them
    if (finalDealerCards > initialDealerCards) {
      setGameState({
        ...res.data,
        dealerHand: res.data.dealerHand.slice(0, initialDealerCards),
        dealerValue: res.data.dealerValue,
        winner: null,
      });

      await new Promise((resolve) => setTimeout(resolve, 800));

      // Then add delay
      for (let i = initialDealerCards; i < finalDealerCards; i++) {
        setGameState({
          ...res.data,
          dealerHand: res.data.dealerHand.slice(0, i + 1),
          winner: null,
        });
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    setGameState(res.data);
    setIsAnimating(false);
  }

  async function double() {
    if (!sessionId || isAnimating) return;
    setIsAnimating(true);

    try {
      const res = await axios.post<GameStateDto>(`${API}/${sessionId}/double`);

      await new Promise((resolve) => setTimeout(resolve, 400));

      const initialDealerCards = gameState?.dealerHand.length || 2;
      const finalDealerCards = res.data.dealerHand.length;

      if (finalDealerCards > initialDealerCards) {
        setGameState({
          ...res.data,
          dealerHand: res.data.dealerHand.slice(0, initialDealerCards),
          dealerValue: res.data.dealerValue,
          winner: null,
        });

        await new Promise((resolve) => setTimeout(resolve, 800));

        for (let i = initialDealerCards; i < finalDealerCards; i++) {
          setGameState({
            ...res.data,
            dealerHand: res.data.dealerHand.slice(0, i + 1),
            winner: null,
          });
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }

      setGameState(res.data);
    } catch (error) {
      console.error("Double down failed:", error);
      alert("Cannot double down in this situation");
    } finally {
      setIsAnimating(false);
    }
  }

  async function split() {
    if (!sessionId || isAnimating) return;

    try {
      const res = await axios.post<GameStateDto>(`${API}/${sessionId}/split`);
      setGameState(res.data);
    } catch (error) {
      console.error("Split failed:", error);
      alert("Cannot split in this situation");
    }
  }

  async function placeBet(amount: number) {
    if (!sessionId) return;
    try {
      const res = await axios.post<GameStateDto>(`${API}/${sessionId}/bet`, {
        amount,
      });
      setGameState(res.data);
      setCurrentBet(amount);
    } catch (error: any) {
      console.error("Bet failed:", error);
      alert(error.response?.data?.error || "Cannot place bet");
    }
  }

  async function dealCards() {
    if (!sessionId) return;
    try {
      const res = await axios.post<GameStateDto>(`${API}/${sessionId}/deal`);
      setGameState(res.data);
      setBettingPhase(false);
    } catch (error: any) {
      console.error("Deal failed:", error);
      alert(error.response?.data?.error || "Cannot deal cards");
    }
  }

  async function newHand() {
    if (!sessionId) return;
    try {
      const res = await axios.post<GameStateDto>(`${API}/${sessionId}/newhand`);
      setGameState(res.data);
      setBettingPhase(true);
      setCurrentBet(25);
    } catch (error: any) {
      console.error("New hand failed:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data ||
        "Cannot start new hand";

      // Edge case - game over
      if (errorMsg.includes("out of money") || errorMsg.includes("Game over")) {
        alert(
          "Game Over! All players are out of money. Starting a new game..."
        );
        setSessionId(null);
        setGameState(null);
        setBettingPhase(false);
      } else {
        alert(errorMsg);
      }
    }
  }

  const gameOver = gameState?.winner ?? null;

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-white overflow-y-auto">
      <div className="w-full flex flex-col items-center px-4 py-6 space-y-6 mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center">
          Blackjack
        </h1>

        {/* BEFORE game starts */}
        {!sessionId && (
          <div className="space-y-4 flex flex-col items-center">
            <div className="flex justify-center gap-6 items-center">
              <div className="flex gap-2 items-center">
                <span className="font-medium">Decks:</span>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={deckCount}
                  onChange={(e) => setDeckCount(Number(e.target.value))}
                  className="w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-center"
                />
              </div>

              <div className="flex gap-2 items-center">
                <span className="font-medium">Players:</span>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={playerCount}
                  onChange={(e) => setPlayerCount(Number(e.target.value))}
                  className="w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-center"
                />
              </div>
            </div>

            <button
              onClick={startGame}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-lg font-semibold shadow-lg"
            >
              Start Game
            </button>
          </div>
        )}

        {sessionId && gameState && (
          <div className="w-full max-w-7xl flex flex-col items-center space-y-6">
            {/* Dealer */}
            <div className="w-full flex flex-col items-center space-y-3 p-4 bg-slate-900/50 rounded-lg">
              <div className="text-xl md:text-2xl font-semibold text-center">
                Dealer
              </div>
              <div className="flex items-center justify-center py-2">
                <CardRow cards={gameState.dealerHand} />
              </div>
              <div className="text-base md:text-lg opacity-80 text-center">
                Value: {gameState.dealerValue ?? "??"}
              </div>
            </div>

            {/* Shoe Status */}
            {gameState.cardsRemaining !== undefined && gameState.totalCards && (
              <div className="w-full bg-slate-800/50 rounded-lg p-3">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-sm text-gray-400">
                    Shoe Status ({gameState.deckCount}{" "}
                    {gameState.deckCount === 1 ? "Deck" : "Decks"})
                  </div>
                  <div className="w-full max-w-md">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{gameState.cardsRemaining} cards remaining</span>
                      <span>
                        {Math.round(
                          (gameState.cardsRemaining / gameState.totalCards) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          gameState.cardsRemaining / gameState.totalCards > 0.5
                            ? "bg-green-500"
                            : gameState.cardsRemaining / gameState.totalCards >
                              0.2
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${
                            (gameState.cardsRemaining / gameState.totalCards) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    {gameState.cardsRemaining / gameState.totalCards <= 0.2 && (
                      <div className="text-xs text-yellow-400 mt-1 text-center animate-pulse">
                        ⚠️ Shoe will reshuffle after this hand
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* All Players at Table - Show seating order */}
            <div className="w-full bg-slate-900/30 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-2 text-center">
                Table Seating (Left to Right)
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                {gameState.players?.map((player) => {
                  const playerIndex = gameState.players.findIndex(
                    (p) => p.playerId === player.playerId
                  );
                  const isHuman = player.isHuman;
                  const isCurrentPlayer =
                    playerIndex === gameState.currentPlayerIndex &&
                    !gameState.isGameOver;

                  return (
                    <div
                      key={player.playerId}
                      className={`flex flex-col items-center p-2 rounded-lg text-xs transition-all ${
                        isHuman && isCurrentPlayer
                          ? "bg-slate-700 border border-yellow-400"
                          : isHuman
                          ? "bg-green-900/30 border border-green-600"
                          : "bg-slate-800/50"
                      }`}
                    >
                      <div
                        className={`font-semibold mb-1 ${
                          isHuman ? "text-green-400" : "text-blue-400"
                        }`}
                      >
                        {player.name}
                        {isHuman && (
                          <span className="ml-1 text-green-400">👤</span>
                        )}
                        {isHuman && isCurrentPlayer && (
                          <span className="ml-1 text-yellow-400">●</span>
                        )}
                      </div>
                      <div className="flex gap-2 mb-1">
                        <span
                          className={
                            player.balance < 25
                              ? "text-red-400 font-bold"
                              : player.balance < 100
                              ? "text-orange-400"
                              : "text-green-400"
                          }
                        >
                          ${player.balance}
                        </span>
                        {player.currentBet > 0 && (
                          <span className="text-yellow-400">
                            (${player.currentBet})
                          </span>
                        )}
                      </div>
                      {player.hands[0]?.length > 0 && (
                        <>
                          {/* CPU players */}
                          {!isHuman && (
                            <div className="flex gap-0.5 mb-1 flex-wrap justify-center max-w-[100px]">
                              {player.hands[0].map(
                                (card: CardDto, cardIndex: number) => (
                                  <div
                                    key={cardIndex}
                                    className={`text-[10px] px-1 py-0.5 rounded ${
                                      card.suit === "♥" || card.suit === "♦"
                                        ? "bg-red-900/50 text-red-300"
                                        : "bg-slate-700 text-white"
                                    }`}
                                  >
                                    {card.rank}
                                    {card.suit}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                          <div className="text-gray-400 mb-1">
                            Value: {player.handValues[0]}
                          </div>
                          {player.results[0] && (
                            <div className="font-bold">
                              {player.results[0] === "player" && (
                                <span className="text-green-400">Win</span>
                              )}
                              {player.results[0] === "dealer" && (
                                <span className="text-red-400">Loss</span>
                              )}
                              {player.results[0] === "push" && (
                                <span className="text-yellow-400">Push</span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Human Player */}
            {gameState.players
              ?.filter((p) => p.isHuman)
              .map((player) => {
                const playerIndex = gameState.players.findIndex(
                  (p) => p.playerId === player.playerId
                );
                return (
                  <div
                    key={player.playerId}
                    className={`space-y-3 flex flex-col items-center p-4 rounded-lg transition-all w-full ${
                      playerIndex === gameState.currentPlayerIndex &&
                      !gameState.isGameOver
                        ? "bg-slate-800 border-2 border-yellow-400"
                        : "bg-slate-900/50"
                    }`}
                  >
                    <div className="text-xl font-semibold text-center">
                      {player.name}
                      {playerIndex === gameState.currentPlayerIndex &&
                        !gameState.isGameOver && (
                          <span className="text-sm ml-2 text-yellow-400">
                            ← Your Turn
                          </span>
                        )}
                    </div>

                    {/* Balance and Bet  */}
                    <div className="flex gap-4 text-sm flex-wrap justify-center">
                      <div
                        className={
                          player.balance < 25
                            ? "text-red-400 font-bold"
                            : player.balance < 100
                            ? "text-orange-400"
                            : "text-green-400"
                        }
                      >
                        Balance: ${player.balance}
                        {player.balance < 25 && " (OUT!)"}
                      </div>
                      {player.currentBet > 0 && (
                        <div className="text-yellow-400">
                          Bet: ${player.currentBet}
                        </div>
                      )}
                    </div>

                    {/* Show all hands for this player */}
                    <div className="space-y-4 w-full">
                      {player.hands.map((hand, handIndex) => (
                        <div
                          key={handIndex}
                          className="flex flex-col items-center"
                        >
                          {player.hands.length > 1 && (
                            <div className="text-sm text-gray-400 mb-2">
                              Hand {handIndex + 1} of {player.hands.length}
                              {handIndex === player.currentHandIndex &&
                                playerIndex === gameState.currentPlayerIndex &&
                                !gameState.isGameOver && (
                                  <span className="ml-2 text-yellow-400">
                                    ← Playing
                                  </span>
                                )}
                            </div>
                          )}
                          <div className="flex items-center justify-center py-2">
                            <CardRow cards={hand} />
                          </div>
                          <div className="text-sm md:text-base opacity-80 text-center">
                            Value: {player.handValues[handIndex]}
                            {player.results[handIndex] && (
                              <span className="ml-2 font-bold">
                                {player.results[handIndex] === "player" && (
                                  <span className="text-green-400">🎉 Win</span>
                                )}
                                {player.results[handIndex] === "dealer" && (
                                  <span className="text-red-400">💀 Loss</span>
                                )}
                                {player.results[handIndex] === "push" && (
                                  <span className="text-yellow-400">
                                    🤝 Push
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

            {/* Betting Phase*/}
            {bettingPhase &&
              gameState.players &&
              (() => {
                const humanPlayer = gameState.players?.find(
                  (p: PlayerDto) => p.isHuman
                );
                if (!humanPlayer) return null;

                return (
                  <div className="w-full flex flex-col gap-4 items-center p-4 md:p-6 bg-slate-800 rounded-xl">
                    <div className="text-lg md:text-xl font-semibold">
                      Place Your Bet
                    </div>
                    <div className="text-base md:text-lg text-green-400">
                      Balance: ${humanPlayer.balance}
                    </div>

                    {/* Chip Selection */}
                    <div className="flex gap-2 md:gap-3 flex-wrap justify-center">
                      {[25, 50, 100, 200].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => placeBet(amount)}
                          disabled={humanPlayer.balance < amount}
                          className={`px-4 py-2 md:px-6 md:py-3 rounded-full font-bold shadow-lg transition-all text-sm md:text-base ${
                            currentBet === amount
                              ? "bg-yellow-500 text-black scale-110"
                              : "bg-slate-700 hover:bg-slate-600"
                          } disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>

                    {humanPlayer.currentBet > 0 && (
                      <div className="flex flex-col gap-3 items-center">
                        <div className="text-base md:text-lg text-yellow-400">
                          Current Bet: ${humanPlayer.currentBet}
                        </div>
                        <button
                          onClick={dealCards}
                          className="px-6 py-2 md:px-8 md:py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold shadow-lg text-base md:text-lg"
                        >
                          Deal Cards
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* Action Buttons */}
            {!gameState.isGameOver &&
              !bettingPhase &&
              gameState.players &&
              gameState.players[gameState.currentPlayerIndex]?.isHuman &&
              gameState.players[gameState.currentPlayerIndex]?.handValues[
                gameState.players[gameState.currentPlayerIndex]
                  ?.currentHandIndex
              ] < 21 && (
                <div className="w-full flex flex-col gap-3 md:gap-4 items-center">
                  <div className="flex gap-2 md:gap-4 justify-center flex-wrap">
                    <button
                      onClick={hit}
                      disabled={isAnimating}
                      className="px-5 py-2 md:px-6 md:py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-medium shadow-lg transition-colors text-sm md:text-base"
                    >
                      Hit
                    </button>
                    <button
                      onClick={stand}
                      disabled={isAnimating}
                      className="px-5 py-2 md:px-6 md:py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black disabled:text-gray-400 rounded-xl font-medium shadow-lg transition-colors text-sm md:text-base"
                    >
                      {isAnimating ? "Dealer's Turn..." : "Stand"}
                    </button>
                  </div>

                  <div className="flex gap-2 md:gap-4 justify-center flex-wrap">
                    {gameState.canSplit && (
                      <button
                        onClick={split}
                        disabled={isAnimating}
                        className="px-5 py-2 md:px-6 md:py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-medium shadow-lg transition-colors text-sm md:text-base"
                      >
                        Split
                      </button>
                    )}
                    {gameState.canDouble && (
                      <button
                        onClick={double}
                        disabled={isAnimating}
                        className="px-5 py-2 md:px-6 md:py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-medium shadow-lg transition-colors text-sm md:text-base"
                      >
                        Double Down
                      </button>
                    )}
                  </div>
                </div>
              )}

            {/* CPU Player Turn Indicator*/}
            {!gameState.isGameOver &&
              !bettingPhase &&
              gameState.players &&
              gameState.players[gameState.currentPlayerIndex]?.hands[0]
                ?.length > 0 &&
              !gameState.players[gameState.currentPlayerIndex]?.isHuman && (
                <div className="text-base md:text-xl text-blue-400 text-center animate-pulse">
                  {gameState.players[gameState.currentPlayerIndex]?.name} is
                  playing...
                </div>
              )}

            {/* New Hand / New Game */}
            {gameOver &&
              (() => {
                const humanPlayer = gameState.players?.find(
                  (p: PlayerDto) => p.isHuman
                );
                const isOutOfMoney = humanPlayer && humanPlayer.balance < 25;

                if (isOutOfMoney) {
                  return (
                    <div className="w-full flex flex-col gap-4 items-center p-4 md:p-6 bg-red-900/50 rounded-xl border-2 border-red-500">
                      <div className="text-2xl md:text-3xl font-bold text-red-400">
                        Game Over!
                      </div>
                      <div className="text-lg md:text-xl">
                        You're out of money!
                      </div>
                      <button
                        onClick={() => {
                          setSessionId(null);
                          setGameState(null);
                          setBettingPhase(false);
                        }}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold shadow-lg text-lg"
                      >
                        Start New Game
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="flex gap-3 md:gap-4 flex-wrap justify-center">
                    <button
                      onClick={newHand}
                      className="px-5 py-2 md:px-6 md:py-3 bg-green-600 hover:bg-green-700 rounded-xl font-semibold shadow-lg text-sm md:text-base"
                    >
                      New Hand
                    </button>
                    <button
                      onClick={() => {
                        setSessionId(null);
                        setGameState(null);
                        setBettingPhase(false);
                      }}
                      className="px-5 py-2 md:px-6 md:py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold shadow-lg text-sm md:text-base"
                    >
                      New Game
                    </button>
                  </div>
                );
              })()}
          </div>
        )}
      </div>
    </div>
  );
}
