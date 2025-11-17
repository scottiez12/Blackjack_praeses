using Blackjack_praeses_api.Models.Entities;

namespace Blackjack_praeses_api.Persistence
{
    public class GameState
    {
        public enum GameResult { InProgress, PlayerBust, DealerBust, PlayerWin, DealerWin, Push }

            public Guid Id { get; set; } = Guid.NewGuid();
            public Deck Shoe { get; set; }
            public int DeckCount { get; set; } = 1;
            public List<Player> Players { get; set; } = new();
            public Hand DealerHand { get; set; } = new() { IsDealer = true };
            public int CurrentPlayerIndex { get; set; } = 0;
            public bool IsDealerTurn { get; set; } = false;
            public List<List<GameResult>> PlayerResults { get; set; } = new();
            public bool DealerHitsSoft17 { get; set; } = false;

            // Helper properties
            public Player CurrentPlayer => Players[CurrentPlayerIndex];
            public bool IsPlayerTurn => !IsDealerTurn && CurrentPlayerIndex < Players.Count;

    }
}
