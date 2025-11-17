namespace Blackjack_praeses_api.Models.Entities
{
    public class Player
    {
        public Player(int playerId, string name, bool isHuman, decimal startingBalance = 300m)
        {
            PlayerId = playerId;
            Name = name;
            IsHuman = isHuman;
            Balance = startingBalance;
        }

        public int PlayerId { get; set; }
        public string Name { get; set; }
        public bool IsHuman { get; set; }
        public List<Hand> Hands { get; set; } = new List<Hand> { new Hand() };
        public int CurrentHandIndex { get; set; } = 0;
        public List<bool> HandsDoubledDown { get; set; } = new List<bool> { false };

        // Betting 
        public decimal Balance { get; set; } = 300m;
        public decimal CurrentBet { get; set; } = 0m;
        public List<decimal> HandBets { get; set; } = new List<decimal> { 0m };

        public Hand CurrentHand => Hands[Math.Min(CurrentHandIndex, Hands.Count - 1)];
    }
}

