namespace Blackjack_praeses_api.Models.Entities
{
    // Models/Hand.cs
    public class Hand
    {
        public List<Card> Cards { get; } = new();
        public bool IsDealer { get; set; } = false;
        public void Add(Card c) => Cards.Add(c);

        public int BestValue()
        {
            // Sum treating aces as 1 then try to add 10 if any ace and it doesn't bust
            int sum = Cards.Sum(c => c.Value);
            int aceCount = Cards.Count(c => c.IsAce);
            // Promote one ace from 1->11 (adds 10) while <=21
            for (int i = 0; i < aceCount; i++)
            {
                if (sum + 10 <= 21) sum += 10;
            }
            return sum;
        }
        public bool IsBust() => BestValue() > 21;
        public bool IsBlackjack() => Cards.Count == 2 && BestValue() == 21;
    }
}
