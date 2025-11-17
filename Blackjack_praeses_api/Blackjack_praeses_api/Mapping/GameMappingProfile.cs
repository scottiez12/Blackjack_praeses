using AutoMapper;
using Blackjack_praeses_api.Models.DTOs;
using Blackjack_praeses_api.Models.Entities;
using Blackjack_praeses_api.Persistence;
using static Blackjack_praeses_api.Persistence.GameState;

namespace Blackjack_praeses_api.Mapping
{
    public class GameMappingProfile : Profile
    {
        public GameMappingProfile()
        {
                        CreateMap<GameState, GameStateDTO>()
                .ForMember(dest => dest.GameStateSessionId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Players, opt => opt.MapFrom(src =>
                    src.Players.Select((player, index) => MapPlayer(player, src.PlayerResults[index])).ToList()))
                .ForMember(dest => dest.DealerHand, opt => opt.MapFrom(src =>
                    src.DealerHand.Cards.Select((card, index) => MapCard(card, IsGameOver(src), index == 0)).ToList()))
                .ForMember(dest => dest.DealerValue, opt => opt.MapFrom(src =>
                    IsGameOver(src) ? src.DealerHand.BestValue() : (int?)null))
                .ForMember(dest => dest.IsGameOver, opt => opt.MapFrom(src => IsGameOver(src)))
                .ForMember(dest => dest.CardsRemaining, opt => opt.MapFrom(src => src.Shoe.Remaining))
                .ForMember(dest => dest.TotalCards, opt => opt.MapFrom(src => 52 * src.DeckCount))
                // Backward compatibility fields (use human player instead of Player 0)
                .ForMember(dest => dest.PlayerHand, opt => opt.MapFrom(src =>
                    GetHumanPlayerHand(src)))
                .ForMember(dest => dest.PlayerValue, opt => opt.MapFrom(src =>
                    GetHumanPlayerValue(src)))
                .ForMember(dest => dest.Winner, opt => opt.MapFrom(src =>
                    GetOverallWinner(src)))
                .ForMember(dest => dest.CanSplit, opt => opt.MapFrom(src =>
                    CanSplit(src, src.Players.FirstOrDefault(p => p.IsHuman))))
                .ForMember(dest => dest.CanDouble, opt => opt.MapFrom(src =>
                    CanDouble(src, src.Players.FirstOrDefault(p => p.IsHuman))))
                .ForMember(dest => dest.CurrentHandIndex, opt => opt.MapFrom(src =>
                    GetHumanPlayerCurrentHandIndex(src)))
                .ForMember(dest => dest.TotalHands, opt => opt.MapFrom(src =>
                    GetHumanPlayerTotalHands(src)));
        }

        private static bool IsGameOver(GameState gameState)
        {
            return gameState.CurrentPlayerIndex >= gameState.Players.Count && !gameState.IsDealerTurn;
        }

        private static PlayerDTO MapPlayer(Player player, List<GameResult> results)
        {
            return new PlayerDTO
            {
                PlayerId = player.PlayerId,
                Name = player.Name,
                IsHuman = player.IsHuman,
                Hands = player.Hands.Select(hand => hand.Cards.Select(card => MapCard(card, false, false)).ToList()).ToList(),
                HandValues = player.Hands.Select(hand => hand.BestValue()).ToList(),
                CurrentHandIndex = player.CurrentHandIndex,
                Results = results.Select(r => MapWinner(r)).ToList(),
                Balance = player.Balance,
                CurrentBet = player.CurrentBet,
                BetsPerHand = player.HandBets
            };
        }

        private static CardDTO MapCard(Card card, bool isGameOver, bool isFirstDealerCard)
        {
            bool hideFirstDealerCard = !isGameOver && isFirstDealerCard;
            return new CardDTO
            {
                Rank = card.Rank,
                Suit = MapSuit(card.Suit),
                IsHidden = hideFirstDealerCard
            };
        }

        private static string MapSuit(Suit suit)
        {
            return suit switch
            {
                Suit.Hearts => "♥",
                Suit.Diamonds => "♦",
                Suit.Clubs => "♣",
                Suit.Spades => "♠",
                _ => suit.ToString()
            };
        }

        private static string? MapWinner(GameResult result)
        {
            return result switch
            {
                GameResult.PlayerWin => "player",
                GameResult.DealerWin => "dealer",
                GameResult.Push => "push",
                GameResult.PlayerBust => "dealer",
                GameResult.DealerBust => "player",
                GameResult.InProgress => null,
                _ => null
            };
        }

        private static bool CanSplit(GameState gameState, Player? player)
        {
            if (player == null) return false;
            if (gameState.CurrentPlayerIndex >= gameState.Players.Count) return false;
            if (gameState.CurrentPlayer.PlayerId != player.PlayerId) return false;
            if (player.CurrentHandIndex >= player.Hands.Count) return false;
            var hand = player.CurrentHand;

            // Check if hand can be split (2 cards with matching ranks)
            if (hand.Cards.Count != 2 || hand.Cards[0].Rank != hand.Cards[1].Rank)
                return false;

            // Check if player has enough balance to split (needs to match current bet)
            decimal splitBet = player.HandBets[player.CurrentHandIndex];
            return player.Balance >= splitBet;
        }

        private static bool CanDouble(GameState gameState, Player? player)
        {
            if (player == null) return false;
            if (gameState.CurrentPlayerIndex >= gameState.Players.Count) return false;
            if (gameState.CurrentPlayer.PlayerId != player.PlayerId) return false;
            if (player.CurrentHandIndex >= player.Hands.Count) return false;
            var hand = player.CurrentHand;

            // Check if hand can be doubled (2 cards only)
            if (hand.Cards.Count != 2)
                return false;

            // Check if player has enough balance to double (needs to match current bet)
            decimal additionalBet = player.HandBets[player.CurrentHandIndex];
            return player.Balance >= additionalBet;
        }

        private static string? GetOverallWinner(GameState gameState)
        {
            if (gameState.PlayerResults.Count == 0) return null;
            var firstPlayerResults = gameState.PlayerResults[0];

            // If any hand is still in progress, game is in progress
            if (firstPlayerResults.Any(r => r == GameResult.InProgress))
                return null;

            // If all hands lost, dealer wins
            if (firstPlayerResults.All(r => r == GameResult.PlayerBust || r == GameResult.DealerWin))
                return "dealer";

            // If all hands won, player wins
            if (firstPlayerResults.All(r => r == GameResult.PlayerWin || r == GameResult.DealerBust))
                return "player";

            // If all hands pushed, it's a push
            if (firstPlayerResults.All(r => r == GameResult.Push))
                return "push";

            // Mixed results
            return null;
        }

        private static List<CardDTO> GetHumanPlayerHand(GameState gameState)
        {
            var humanPlayer = gameState.Players.FirstOrDefault(p => p.IsHuman);
            if (humanPlayer == null) return new List<CardDTO>();
            return humanPlayer.CurrentHand.Cards.Select(c => MapCard(c, IsGameOver(gameState), false)).ToList();
        }

        private static int GetHumanPlayerValue(GameState gameState)
        {
            var humanPlayer = gameState.Players.FirstOrDefault(p => p.IsHuman);
            return humanPlayer?.CurrentHand.BestValue() ?? 0;
        }

        private static int GetHumanPlayerCurrentHandIndex(GameState gameState)
        {
            var humanPlayer = gameState.Players.FirstOrDefault(p => p.IsHuman);
            return humanPlayer?.CurrentHandIndex ?? 0;
        }

        private static int GetHumanPlayerTotalHands(GameState gameState)
        {
            var humanPlayer = gameState.Players.FirstOrDefault(p => p.IsHuman);
            return humanPlayer?.Hands.Count ?? 0;
        }
    }
}

