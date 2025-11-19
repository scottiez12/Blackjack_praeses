import { useState } from "react";
import axios from "axios";
import CardRow from "./components/CardRow";
import { ConfirmDialog } from "./components/ConfirmDialog";

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
  const [showNewGameConfirm, setShowNewGameConfirm] = useState<boolean>(false);

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

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Then add delay
      for (let i = initialDealerCards; i < finalDealerCards; i++) {
        setGameState({
          ...res.data,
          dealerHand: res.data.dealerHand.slice(0, i + 1),
          winner: null,
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
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

        await new Promise((resolve) => setTimeout(resolve, 1000));

        for (let i = initialDealerCards; i < finalDealerCards; i++) {
          setGameState({
            ...res.data,
            dealerHand: res.data.dealerHand.slice(0, i + 1),
            winner: null,
          });
          await new Promise((resolve) => setTimeout(resolve, 1000));
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

  function handleNewGame() {
    setSessionId(null);
    setGameState(null);
    setBettingPhase(false);
    setShowNewGameConfirm(false);
  }

  const gameOver = gameState?.isGameOver ?? false;

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
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-lg font-semibold shadow-lg"
            >
              Start Game
            </button>
          </div>
        )}

        {sessionId && gameState && (
          <div className="w-full max-w-7xl flex flex-col items-center space-y-6">
            {/* Dealer */}
            <div className="w-full flex flex-col items-center space-y-3 p-4 bg-slate-900/50 rounded-lg relative">
              {/* Shoe Status - Top Right Corner */}
              {gameState.cardsRemaining !== undefined &&
                gameState.totalCards && (
                  <div className="absolute top-2 right-2 bg-slate-800/80 rounded-lg p-2 border border-slate-700 shadow-lg">
                    <div className="flex flex-col gap-1 min-w-[180px]">
                      <div className="text-xs text-gray-400 font-semibold">
                        Shoe: {gameState.deckCount}{" "}
                        {gameState.deckCount === 1 ? "Deck" : "Decks"}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              gameState.cardsRemaining / gameState.totalCards >
                              0.5
                                ? "bg-green-500"
                                : gameState.cardsRemaining /
                                    gameState.totalCards >
                                  0.2
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${
                                (gameState.cardsRemaining /
                                  gameState.totalCards) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">
                          {Math.round(
                            (gameState.cardsRemaining / gameState.totalCards) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {gameState.cardsRemaining}/{gameState.totalCards} cards
                      </div>
                      {/* Reshuffle warning */}
                      {gameState.cardsRemaining / gameState.totalCards <=
                        0.2 && (
                        <div className="text-xs text-yellow-400 animate-pulse">
                          ⚠️ Reshuffle soon
                        </div>
                      )}
                    </div>
                  </div>
                )}

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

            {/* All Players at Table - Show seating order */}
            <div className="w-full bg-slate-900/30 rounded-lg p-3">
              <div className="text-sm text-gray-400 mb-2 text-center">
                Table Seating{" "}
                <span className="text-xs text-gray-500">
                  (Plays Right → Left)
                </span>
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

                  // Calculate turn order (right-to-left: highest index plays first)
                  const turnOrder = gameState.players.length - playerIndex;

                  // Position labels (casino terminology)
                  const positionLabel =
                    playerIndex === gameState.players.length - 1
                      ? "First Base"
                      : playerIndex === 0
                      ? "Third Base"
                      : playerIndex === gameState.players.length - 2
                      ? "Second Base"
                      : `Seat ${playerIndex + 1}`;

                  return (
                    <div
                      key={player.playerId}
                      className={`flex flex-col items-center p-2 rounded-lg text-xs transition-all ${
                        isCurrentPlayer
                          ? "bg-yellow-900/50 border-2 border-yellow-400 shadow-lg shadow-yellow-400/50"
                          : isHuman
                          ? "bg-green-900/30 border border-green-600"
                          : "bg-slate-800/50"
                      }`}
                    >
                      {/* Position Label */}
                      <div className="text-[10px] text-gray-500 mb-0.5">
                        {positionLabel}
                      </div>

                      {/* Turn Order Badge */}
                      <div className="text-[10px] text-gray-400 mb-1 bg-slate-700 px-1.5 py-0.5 rounded">
                        Turn #{turnOrder}
                      </div>

                      <div
                        className={`font-semibold mb-1 ${
                          isHuman ? "text-green-400" : "text-blue-400"
                        }`}
                      >
                        {player.name}
                        {isHuman && (
                          <span className="ml-1 text-green-400">👤</span>
                        )}
                        {isCurrentPlayer && (
                          <span className="ml-1 text-yellow-400 animate-pulse">
                            ▶
                          </span>
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

            {/* Human Player Section - Combined with Betting */}
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

                    {/* Betting Phase - Integrated into player section */}
                    {bettingPhase && (
                      <div className="w-full flex flex-col gap-4 items-center p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                        <div className="text-lg md:text-xl font-semibold text-yellow-400">
                          Place Your Bet
                        </div>

                        {/* Chip Selection */}
                        <div className="flex gap-2 md:gap-3 flex-wrap justify-center">
                          {[25, 50, 100, 200].map((amount) => {
                            const isSelected = currentBet === amount;
                            // Check if player can afford this bet (including their current bet that can be changed)
                            const totalAvailable =
                              player.balance + player.currentBet;
                            const isDisabled = totalAvailable < amount;

                            return (
                              <button
                                key={amount}
                                onClick={() => placeBet(amount)}
                                disabled={isDisabled}
                                className={`px-4 py-2 md:px-6 md:py-3 rounded-full font-bold shadow-lg transition-all text-sm md:text-base text-white border-2 focus:outline-none
                                  ${
                                    isDisabled
                                      ? "bg-gray-700 cursor-not-allowed opacity-50 text-gray-400 border-transparent"
                                      : isSelected
                                      ? "bg-slate-700 border-white"
                                      : "bg-slate-700 hover:bg-slate-600 border-transparent"
                                  }
                                `}
                              >
                                ${amount}
                              </button>
                            );
                          })}
                        </div>

                        {player.currentBet > 0 && (
                          <div className="flex flex-col gap-3 items-center">
                            <div className="text-base md:text-lg text-yellow-400">
                              Current Bet: ${player.currentBet}
                            </div>
                            <button
                              onClick={dealCards}
                              className="px-6 py-2 md:px-8 md:py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg text-base md:text-lg"
                            >
                              Deal Cards
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show all hands for this player - Only during gameplay */}
                    {!bettingPhase && (
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
                                  playerIndex ===
                                    gameState.currentPlayerIndex &&
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
                                    <span className="text-green-400">
                                      🎉 Win
                                    </span>
                                  )}
                                  {player.results[handIndex] === "dealer" && (
                                    <span className="text-red-400">
                                      💀 Loss
                                    </span>
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
                    )}
                  </div>
                );
              })}

            {/* CPU Player Turn Indicator - Reserve space to prevent layout jump */}
            <div
              className="text-base md:text-xl text-blue-400 text-center transition-opacity duration-300"
              style={{ minHeight: "2rem" }}
            >
              {!gameState.isGameOver &&
                !bettingPhase &&
                gameState.players &&
                gameState.players[gameState.currentPlayerIndex]?.hands[0]
                  ?.length > 0 &&
                !gameState.players[gameState.currentPlayerIndex]?.isHuman && (
                  <span className="animate-pulse">
                    {gameState.players[gameState.currentPlayerIndex]?.name} is
                    playing...
                  </span>
                )}
            </div>

            {/* Game Actions Container - Left: Player Actions, Right: New Hand/Game */}
            <div
              className="w-full transition-opacity duration-300"
              style={{ minHeight: "5rem" }}
            >
              <div className="w-full flex flex-col md:flex-row gap-4 items-center md:items-stretch justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                {/* Left Side: Player Actions */}
                <div className="flex-1 flex flex-col gap-2 items-center justify-center">
                  {(() => {
                    const isHumanTurn =
                      !gameState.isGameOver &&
                      !bettingPhase &&
                      gameState.players &&
                      gameState.players[gameState.currentPlayerIndex]
                        ?.isHuman &&
                      gameState.players[gameState.currentPlayerIndex]
                        ?.handValues[
                        gameState.players[gameState.currentPlayerIndex]
                          ?.currentHandIndex
                      ] < 21;

                    const canAct = isHumanTurn && !isAnimating;

                    return (
                      <>
                        <div className="text-xs text-gray-400 uppercase tracking-wide">
                          Your Actions
                        </div>
                        <div className="flex gap-2 flex-wrap justify-center">
                          <button
                            onClick={hit}
                            disabled={!canAct}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-lg font-medium shadow-lg transition-colors text-sm"
                            title={
                              !canAct ? "Not your turn" : "Draw another card"
                            }
                          >
                            Hit
                          </button>
                          <button
                            onClick={stand}
                            disabled={!canAct}
                            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-lg font-medium shadow-lg transition-colors text-sm"
                            title={
                              !canAct ? "Not your turn" : "Keep current hand"
                            }
                          >
                            {isAnimating ? "Dealer's Turn..." : "Stand"}
                          </button>
                          <button
                            onClick={double}
                            disabled={!canAct || !gameState.canDouble}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-lg font-medium shadow-lg transition-colors text-sm"
                            title={
                              !canAct
                                ? "Not your turn"
                                : !gameState.canDouble
                                ? "Cannot double down"
                                : "Double bet and take one card"
                            }
                          >
                            Double Down
                          </button>
                          <button
                            onClick={split}
                            disabled={!canAct || !gameState.canSplit}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-lg font-medium shadow-lg transition-colors text-sm"
                            title={
                              !canAct
                                ? "Not your turn"
                                : !gameState.canSplit
                                ? "Cannot split"
                                : "Split pair into two hands"
                            }
                          >
                            Split
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Right Side: New Hand / New Game */}
                <div className="flex-1 flex flex-col gap-2 items-center justify-center">
                  {(() => {
                    const humanPlayer = gameState.players?.find(
                      (p: PlayerDto) => p.isHuman
                    );
                    const isOutOfMoney =
                      humanPlayer && humanPlayer.balance < 25;

                    // Special case: Out of Money - Show Game Over message
                    if (gameOver && isOutOfMoney) {
                      return (
                        <div className="flex flex-col gap-2 items-center">
                          <div className="text-xl font-bold text-red-400">
                            Game Over!
                          </div>
                          <div className="text-sm text-gray-300">
                            You're out of money!
                          </div>
                          <button
                            onClick={handleNewGame}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-lg text-sm"
                          >
                            Start New Game
                          </button>
                        </div>
                      );
                    }

                    // Normal case: Always show both buttons, enable/disable conditionally
                    const canStartNewHand = gameOver && !isOutOfMoney;

                    return (
                      <>
                        <div className="text-xs text-gray-400 uppercase tracking-wide">
                          Game Options
                        </div>
                        <div className="flex gap-2 flex-wrap justify-center">
                          <button
                            onClick={newHand}
                            disabled={!canStartNewHand}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-lg font-semibold shadow-lg text-sm transition-colors"
                            title={
                              canStartNewHand
                                ? "Start a new hand"
                                : "Finish current hand first"
                            }
                          >
                            New Hand
                          </button>
                          <button
                            onClick={() => setShowNewGameConfirm(true)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow-lg text-sm transition-colors"
                            title="Start a completely new game"
                          >
                            New Game
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog for New Game */}
        <ConfirmDialog
          isOpen={showNewGameConfirm}
          title="Start New Game?"
          message="This will end the current game and reset all progress. Are you sure?"
          confirmText="Yes, New Game"
          cancelText="Cancel"
          variant="warning"
          onConfirm={handleNewGame}
          onCancel={() => setShowNewGameConfirm(false)}
        />
      </div>
    </div>
  );
}
