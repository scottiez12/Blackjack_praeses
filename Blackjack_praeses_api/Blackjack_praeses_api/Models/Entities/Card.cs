namespace Blackjack_praeses_api.Models.Entities
{
    public enum Suit { Clubs, Diamonds, Hearts, Spades }
    public enum Rank
    {
        Two = 2, Three, Four, Five, Six, Seven, Eight, Nine, Ten,
        Jack = 10, Queen = 10, King = 10, Ace = 1 
    }

    public record Card(Suit Suit, string Rank, int Value, bool IsAce)
    {
        public override string ToString() => $"{Rank} of {Suit}";
    }
}
