using Blackjack_praeses_api.Models.Entities;
using Blackjack_praeses_api.Persistence;
using static Blackjack_praeses_api.Persistence.GameState;

namespace Blackjack_praeses_api.Services
{
    public class GameService
    {
        public GameState StartGame(int decks = 1, int playerCount = 1, bool dealerHitsSoft17 = false)
        {
            var shoe = new Deck(decks);
            shoe.Shuffle();
            var gameState = new GameState
            {
                Shoe = shoe,
                DeckCount = decks,
                DealerHitsSoft17 = dealerHitsSoft17,
                CurrentPlayerIndex = 0
            };

            // Randomize human player position
            var random = new Random();
            int humanPosition = random.Next(0, playerCount);

            // Create players with human at random position
            for (int i = 0; i < playerCount; i++)
            {
                bool isHuman = i == humanPosition;
                string name = isHuman ? "You" : $"Player {i + 1}";
                gameState.Players.Add(new Player(i, name, isHuman));
                gameState.PlayerResults.Add(new List<GameResult> { GameResult.InProgress });
            }
            return gameState;
        }

        public void PlayerHit(GameState gameState)
        {
            if (!gameState.IsPlayerTurn) throw new InvalidOperationException("Not player's turn");
            var player = gameState.CurrentPlayer;
            if (player.HandsDoubledDown[player.CurrentHandIndex])
                throw new InvalidOperationException("Cannot hit after doubling down");

            var hand = player.CurrentHand;
            hand.Add(gameState.Shoe.Draw());

            if (hand.IsBust())
            {
                gameState.PlayerResults[gameState.CurrentPlayerIndex][player.CurrentHandIndex] = GameResult.PlayerBust;
                SettleBet(player, player.CurrentHandIndex, GameResult.PlayerBust, false);
                MoveToNextHandOrPlayer(gameState);
            }
            else if (hand.BestValue() == 21)
            {
               MoveToNextHandOrPlayer(gameState);
            }
        }

        public void PlayerStand(GameState gameState)
        {
            if (!gameState.IsPlayerTurn) throw new InvalidOperationException("Not player's turn");
            MoveToNextHandOrPlayer(gameState);
        }

        public void PlayerDouble(GameState gameState)
        {
            if (!gameState.IsPlayerTurn) throw new InvalidOperationException("Not player's turn");
            var player = gameState.CurrentPlayer;
            var hand = player.CurrentHand;
            if (hand.Cards.Count != 2) throw new InvalidOperationException("Can only double down on initial two cards");

            decimal additionalBet = player.HandBets[player.CurrentHandIndex];
            if (player.Balance < additionalBet)
                throw new InvalidOperationException("Insufficient balance to double down");

            player.Balance -= additionalBet;
            player.HandBets[player.CurrentHandIndex] *= 2;

            // Mark this hand as doubled down
            player.HandsDoubledDown[player.CurrentHandIndex] = true;

            hand.Add(gameState.Shoe.Draw());

            if (hand.IsBust())
            {
                gameState.PlayerResults[gameState.CurrentPlayerIndex][player.CurrentHandIndex] = GameResult.PlayerBust;
                SettleBet(player, player.CurrentHandIndex, GameResult.PlayerBust, false);
            }

            MoveToNextHandOrPlayer(gameState);
        }

        public void PlayerSplit(GameState gameState)
        {
            if (!gameState.IsPlayerTurn) throw new InvalidOperationException("Not player's turn");
            var player = gameState.CurrentPlayer;
            var hand = player.CurrentHand;
            if (hand.Cards.Count != 2) throw new InvalidOperationException("Can only split initial two cards");
            if (hand.Cards[0].Rank != hand.Cards[1].Rank) throw new InvalidOperationException("Can only split pairs");

            decimal splitBet = player.HandBets[player.CurrentHandIndex];
            if (player.Balance < splitBet)
                throw new InvalidOperationException("Insufficient balance to split");

            player.Balance -= splitBet;

            var newHand = new Hand();
            newHand.Add(hand.Cards[1]);
            hand.Cards.RemoveAt(1);

            hand.Add(gameState.Shoe.Draw());
            newHand.Add(gameState.Shoe.Draw());

            player.Hands.Insert(player.CurrentHandIndex + 1, newHand);
            gameState.PlayerResults[gameState.CurrentPlayerIndex].Insert(player.CurrentHandIndex + 1, GameResult.InProgress);
            player.HandsDoubledDown.Insert(player.CurrentHandIndex + 1, false);
            player.HandBets.Insert(player.CurrentHandIndex + 1, splitBet);

            // Special rule for splitting aces: only one card per ace and cannot draw again
            if (hand.Cards[0].IsAce)
            {
                // Check both hands for blackjack but won't pay 3:2, just 1:1
                if (hand.IsBust())
                {
                    gameState.PlayerResults[gameState.CurrentPlayerIndex][player.CurrentHandIndex] = GameResult.PlayerBust;
                    SettleBet(player, player.CurrentHandIndex, GameResult.PlayerBust, false);
                }
                if (newHand.IsBust())
                {
                    gameState.PlayerResults[gameState.CurrentPlayerIndex][player.CurrentHandIndex + 1] = GameResult.PlayerBust;
                    SettleBet(player, player.CurrentHandIndex + 1, GameResult.PlayerBust, false);
                }

                player.CurrentHandIndex = player.Hands.Count;
                MoveToNextHandOrPlayer(gameState);
            }
        }

        private void MoveToNextHandOrPlayer(GameState gameState)
        {
            var player = gameState.CurrentPlayer;
            player.CurrentHandIndex++;

            if (player.CurrentHandIndex < player.Hands.Count)
            {
                if (!player.IsHuman)
                {
                    ProcessCpuTurn(gameState);
                }
                return;
            }

            gameState.CurrentPlayerIndex++;

            if (gameState.CurrentPlayerIndex < gameState.Players.Count)
            {
                if (!gameState.Players[gameState.CurrentPlayerIndex].IsHuman)
                {
                    ProcessCpuTurn(gameState);
                }
            }
            else
            {
                // All players done, move to dealer
                gameState.IsDealerTurn = true;
                ResolveDealerPlay(gameState);
            }
        }

        private void ProcessCpuTurn(GameState gameState)
        {
            if (!gameState.IsPlayerTurn || gameState.CurrentPlayerIndex >= gameState.Players.Count)
                return;

            var player = gameState.CurrentPlayer;
            if (player.IsHuman)
                return; 

            var hand = player.CurrentHand;

            // Get dealer's up card 
            int dealerUpCard = gameState.DealerHand.Cards[0].Value;

            // Check what actions are available
            bool canDouble = hand.Cards.Count == 2;
            bool canSplit = hand.Cards.Count == 2 && hand.Cards[0].Rank == hand.Cards[1].Rank;

            // Make a decision
            var action = CpuPlayerStrategy.GetAction(hand, dealerUpCard, canDouble, canSplit);

            switch (action)
            {
                case CpuPlayerStrategy.Action.Hit:
                    PlayerHit(gameState);
                    // If not bust and still CPU's turn, continue
                    if (gameState.IsPlayerTurn && gameState.CurrentPlayerIndex < gameState.Players.Count && !gameState.CurrentPlayer.IsHuman)
                    {
                        ProcessCpuTurn(gameState);
                    }
                    break;

                case CpuPlayerStrategy.Action.Stand:
                    PlayerStand(gameState);
                    break;

                case CpuPlayerStrategy.Action.Double:
                    PlayerDouble(gameState);
                    break;

                case CpuPlayerStrategy.Action.Split:
                    PlayerSplit(gameState);
                    // After split, if still CPU's turn, continue with first split hand
                    if (gameState.IsPlayerTurn && gameState.CurrentPlayerIndex < gameState.Players.Count && !gameState.CurrentPlayer.IsHuman)
                    {
                        ProcessCpuTurn(gameState);
                    }
                    break;
            }
        }

        private void ResolveDealerPlay(GameState gameState)
        {
            // Check if all player hands are bust - if so, dealer doesn't play
            if (AllPlayerHandsBust(gameState))
            {
                gameState.IsDealerTurn = false;
                return;
            }

            DealerDrawCards(gameState);
            gameState.IsDealerTurn = false;

            EvaluateAndSettleAllHands(gameState);
        }

        //Edge but possible
        private bool AllPlayerHandsBust(GameState gameState)
        {
            return gameState.PlayerResults.All(playerResults =>
                playerResults.All(r => r == GameResult.PlayerBust));
        }

        private void DealerDrawCards(GameState gameState)
        {
            while (ShouldDealerDraw(gameState))
            {
                gameState.DealerHand.Add(gameState.Shoe.Draw());

                if (gameState.DealerHand.IsBust())
                {
                    // Dealer bust 
                    ProcessAllPlayerHands(gameState, (p, h) =>
                    {
                        if (gameState.PlayerResults[p][h] != GameResult.PlayerBust)
                        {
                            gameState.PlayerResults[p][h] = GameResult.DealerBust;
                            SettleBet(gameState.Players[p], h, GameResult.DealerBust, false);
                        }
                    });
                    return;
                }
            }
        }

        private bool ShouldDealerDraw(GameState gameState)
        {
            int val = gameState.DealerHand.BestValue();
            if (val < 17) return true;

            if (val == 17 && gameState.DealerHitsSoft17)
            {
       
                bool isSoft = gameState.DealerHand.Cards.Any(c => c.IsAce) &&
                             gameState.DealerHand.BestValue() - gameState.DealerHand.Cards.Sum(c => c.Value) >= 10;
                return isSoft;
            }

            return false;
        }

        private void EvaluateAndSettleAllHands(GameState gameState)
        {
            ProcessAllPlayerHands(gameState, (p, h) =>
            {
                if (gameState.PlayerResults[p][h] == GameResult.InProgress)
                {
                    gameState.PlayerResults[p][h] = EvaluateFinal(gameState.Players[p].Hands[h], gameState.DealerHand);
                    SettleBet(gameState.Players[p], h, gameState.PlayerResults[p][h], gameState.DealerHand.IsBlackjack());
                }
            });
        }

        private void ProcessAllPlayerHands(GameState gameState, Action<int, int> action)
        {
            for (int p = 0; p < gameState.Players.Count; p++)
            {
                for (int h = 0; h < gameState.Players[p].Hands.Count; h++)
                {
                    action(p, h);
                }
            }
        }

        private GameResult EvaluateFinal(Hand playerHand, Hand dealerHand)
        {
            if (playerHand.IsBlackjack() && !dealerHand.IsBlackjack()) return GameResult.PlayerWin;
            if (!playerHand.IsBlackjack() && dealerHand.IsBlackjack()) return GameResult.DealerWin;
            if (playerHand.IsBust()) return GameResult.PlayerBust;
            if (dealerHand.IsBust()) return GameResult.DealerBust;

            int p = playerHand.BestValue();
            int d = dealerHand.BestValue();
            if (p > d) return GameResult.PlayerWin;
            if (p < d) return GameResult.DealerWin;
            return GameResult.Push;
        }

        // Betting methods
        public void PlaceBet(GameState gameState, int playerId, decimal amount)
        {
            // Validate bet amount (must be multiple of 25)
            if (amount <= 0 || amount % 25 != 0)
                throw new InvalidOperationException("Bet must be a positive multiple of 25");

            var player = gameState.Players.FirstOrDefault(p => p.PlayerId == playerId);
            if (player == null)
                throw new InvalidOperationException("Player not found");

            // Can only bet before cards are dealt or at start of new hand
            if (player.Hands[0].Cards.Count > 0)
                throw new InvalidOperationException("Cannot place bet after cards are dealt");

           // Handle bet change
            if (player.CurrentBet > 0)
            {
                player.Balance += player.CurrentBet;
            }

            // Validate sufficient balance for new bet
            if (player.Balance < amount)
                throw new InvalidOperationException("Insufficient balance");

            // Deduct new bet from balance
            player.Balance -= amount;
            player.CurrentBet = amount;
            player.HandBets[0] = amount;

            // Auto-bet for CPU players (they bet 25 if they have balance)
            foreach (var cpuPlayer in gameState.Players.Where(p => !p.IsHuman && p.CurrentBet == 0))
            {
                decimal cpuBet = Math.Min(25m, cpuPlayer.Balance);
                if (cpuBet >= 25m)
                {
                    cpuPlayer.Balance -= cpuBet;
                    cpuPlayer.CurrentBet = cpuBet;
                    cpuPlayer.HandBets[0] = cpuBet;
                }
            }
        }

        public GameState NewHand(GameState gameState)
        {
            // Preserve player balances and create new hand with eligible players
            var preservedPlayers = gameState.Players
                .Where(p => p.Balance >= 25m) 
                .Select(p => new
                {
                    p.PlayerId,
                    p.Name,
                    p.IsHuman,
                    p.Balance
                }).ToList();

            // Edge but possible
            if (preservedPlayers.Count == 0)
                throw new InvalidOperationException("All players are out of money. Game over!");

            // Create new shoe if needed (reshuffle when < 20% remaining)
            var shoe = gameState.Shoe;
            int totalCards = 52 * gameState.DeckCount;
            if (shoe.Remaining < (totalCards * 0.2))
            {
                shoe = new Deck(gameState.DeckCount);
                shoe.Shuffle();
            }

            var newState = new GameState
            {
                Id = gameState.Id, // Keep same session ID
                Shoe = shoe,
                DeckCount = gameState.DeckCount,
                DealerHitsSoft17 = gameState.DealerHitsSoft17,
                CurrentPlayerIndex = 0
            };

            // Recreate players with preserved balances
            foreach (var p in preservedPlayers)
            {
                var player = new Player(p.PlayerId, p.Name, p.IsHuman, p.Balance);
                newState.Players.Add(player);
                newState.PlayerResults.Add(new List<GameResult> { GameResult.InProgress });
            }

            return newState;
        }

        public void DealCards(GameState gameState)
        {
            ValidateAllPlayersBet(gameState);
            DealInitialCards(gameState);
            HandleBlackjacks(gameState);
            AdvanceToFirstActivePlayer(gameState);
        }

        private void ValidateAllPlayersBet(GameState gameState)
        {
            foreach (var player in gameState.Players)
            {
                if (player.CurrentBet <= 0)
                    throw new InvalidOperationException($"Player {player.Name} must place a bet before dealing");
            }
        }

        private void DealInitialCards(GameState gameState)
        {
            // Deal two rounds: first card to each player and dealer, then second card
            for (int round = 0; round < 2; round++)
            {
                foreach (var player in gameState.Players)
                {
                    player.Hands[0].Add(gameState.Shoe.Draw());
                }
                gameState.DealerHand.Add(gameState.Shoe.Draw());
            }
        }

        private void HandleBlackjacks(GameState gameState)
        {
            bool dealerHasBlackjack = gameState.DealerHand.IsBlackjack();

            for (int i = 0; i < gameState.Players.Count; i++)
            {
                if (gameState.Players[i].Hands[0].IsBlackjack() || dealerHasBlackjack)
                {
                    gameState.PlayerResults[i][0] = EvaluateFinal(gameState.Players[i].Hands[0], gameState.DealerHand);
                    SettleBet(gameState.Players[i], 0, gameState.PlayerResults[i][0], dealerHasBlackjack);
                }
            }

            // Hand over if dealer has blackjack
            if (dealerHasBlackjack)
            {
                gameState.CurrentPlayerIndex = gameState.Players.Count;
                gameState.IsDealerTurn = false;
            }
        }

        private void AdvanceToFirstActivePlayer(GameState gameState)
        {
            // Skip players who have blackjack and advance to first player who needs to act
            while (gameState.CurrentPlayerIndex < gameState.Players.Count)
            {
                var currentPlayer = gameState.Players[gameState.CurrentPlayerIndex];

                if (currentPlayer.Hands[0].IsBlackjack())
                {
                    gameState.CurrentPlayerIndex++;
                }
                else
                {
                    // Found a player who needs to act - if CPU, process their turn
                    if (!currentPlayer.IsHuman)
                    {
                        ProcessCpuTurn(gameState);
                    }
                    return;
                }
            }

            // If all players had blackjack, move to dealer turn
            if (gameState.CurrentPlayerIndex >= gameState.Players.Count)
            {
                gameState.IsDealerTurn = true;
                ResolveDealerPlay(gameState);
            }
        }

        private void SettleBet(Player player, int handIndex, GameResult result, bool dealerHasBlackjack)
        {
            decimal bet = player.HandBets[handIndex];
            bool playerHasBlackjack = player.Hands[handIndex].IsBlackjack();

            decimal payout = result switch
            {
                // Natural blackjack (2 cards = 21) pays 3:2 (bet + bet * 1.5)
                GameResult.PlayerWin when playerHasBlackjack && !dealerHasBlackjack => bet * 2.5m,
                // Regular win or dealer bust pays 1:1 (bet + bet)
                GameResult.PlayerWin or GameResult.DealerBust => bet * 2m,
                // Push returns original bet
                GameResult.Push => bet,
                // Loss or player bust = no payout
                _ => 0m
            };

            player.Balance += payout;
        }
    }
}
