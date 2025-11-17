namespace Blackjack_praeses_api.Models.DTOs
{
    public class PlayerDTO
    {
        public int PlayerId { get; set; }
        public string Name { get; set; }
        public bool IsHuman { get; set; }
        public List<List<CardDTO>> Hands { get; set; }
        public List<int> HandValues { get; set; }
        public int CurrentHandIndex { get; set; }
        public List<string?> Results { get; set; }

        // Betting properties
        public decimal Balance { get; set; }
        public decimal CurrentBet { get; set; }
        public List<decimal> BetsPerHand { get; set; } // Bet amount for each hand (important for splits)
    }
}

