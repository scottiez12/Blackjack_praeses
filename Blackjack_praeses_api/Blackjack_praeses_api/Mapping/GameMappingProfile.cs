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
            // GameState -> GameStateDTO
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
                // Backward compatibility fields
                .ForMember(dest => dest.PlayerHand, opt => opt.MapFrom(src =>
                    src.Players.Count > 0 ? src.Players[0].CurrentHand.Cards.Select(c => MapCard(c, IsGameOver(src), false)).ToList() : new List<CardDTO>()))
                .ForMember(dest => dest.PlayerValue, opt => opt.MapFrom(src =>
                    src.Players.Count > 0 ? src.Players[0].CurrentHand.BestValue() : 0))
                .ForMember(dest => dest.Winner, opt => opt.MapFrom(src =>
                    GetOverallWinner(src)))
                .ForMember(dest => dest.CanSplit, opt => opt.MapFrom(src =>
                    CanSplit(src, src.Players.Count > 0 ? src.Players[0] : null)))
                .ForMember(dest => dest.CanDouble, opt => opt.MapFrom(src =>
                    CanDouble(src, src.Players.Count > 0 ? src.Players[0] : null)))
                .ForMember(dest => dest.CurrentHandIndex, opt => opt.MapFrom(src =>
                    src.Players.Count > 0 ? src.Players[0].CurrentHandIndex : 0))
                .ForMember(dest => dest.TotalHands, opt => opt.MapFrom(src =>
                    src.Players.Count > 0 ? src.Players[0].Hands.Count : 0));
        }

        private static bool IsGameOver(GameState src)
        {
            return src.CurrentPlayerIndex >= src.Players.Count && !src.IsDealerTurn;
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

        private static bool CanSplit(GameState state, Player? player)
        {
            if (player == null) return false;
            if (state.CurrentPlayerIndex >= state.Players.Count) return false;
            if (state.CurrentPlayer.PlayerId != player.PlayerId) return false;
            if (player.CurrentHandIndex >= player.Hands.Count) return false;
            var hand = player.CurrentHand;
            return hand.Cards.Count == 2 && hand.Cards[0].Rank == hand.Cards[1].Rank;
        }

        private static bool CanDouble(GameState state, Player? player)
        {
            if (player == null) return false;
            if (state.CurrentPlayerIndex >= state.Players.Count) return false;
            if (state.CurrentPlayer.PlayerId != player.PlayerId) return false;
            if (player.CurrentHandIndex >= player.Hands.Count) return false;
            var hand = player.CurrentHand;
            return hand.Cards.Count == 2;
        }

        private static string? GetOverallWinner(GameState state)
        {
            if (state.PlayerResults.Count == 0) return null;
            var firstPlayerResults = state.PlayerResults[0];

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
    }
}

