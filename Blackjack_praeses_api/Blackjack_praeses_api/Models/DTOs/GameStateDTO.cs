namespace Blackjack_praeses_api.Models.DTOs
{
    public class GameStateDTO
    {
        public Guid GameStateSessionId { get; set; }
        public List<PlayerDTO> Players { get; set; }
        public List<CardDTO> DealerHand { get; set; }
        public int? DealerValue { get; set; }
        public int CurrentPlayerIndex { get; set; }
        public bool IsGameOver { get; set; }

        // Shoe information
        public int CardsRemaining { get; set; }
        public int TotalCards { get; set; }
        public int DeckCount { get; set; }

        // Backward compatibility for single player (player at index 0)
        public List<CardDTO> PlayerHand { get; set; }
        public int PlayerValue { get; set; }
        public string? Winner { get; set; }
        public bool CanSplit { get; set; }
        public bool CanDouble { get; set; }
        public int CurrentHandIndex { get; set; }
        public int TotalHands { get; set; }
    }
}

