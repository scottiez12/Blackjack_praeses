namespace Blackjack_praeses_api.Models.Entities
{
    // Models/Deck.cs
    public class Deck
    {
        private List<Card> _cards;
        private Random _rng = new Random();
        public Deck(int numberOfDecks = 1)
        {
            _cards = BuildCardShoe(numberOfDecks);
        }

        private List<Card> BuildCardShoe(int decks)
        {
            var list = new List<Card>();
            var suits = Enum.GetValues(typeof(Suit)).Cast<Suit>();

            var ranks = new[] {
                ("A", 1, true),  
                ("2",2,false),("3",3,false),("4",4,false),("5",5,false),("6",6,false),
                ("7",7,false),("8",8,false),("9",9,false),("10",10,false),
                ("J",10,false),("Q",10,false),("K",10,false)  
            };

            // Create cards 
            for (int deckIndex = 0; deckIndex < decks; deckIndex++)
            {
                // Suits
                foreach (var suit in suits)
                {
                    // Ranks
                    foreach (var (rank, value, isAce) in ranks)
                    {
                        list.Add(new Card(suit, rank, value, isAce));
                    }
                }
            }
            return list;
        }


        // Fisher-Yates shuffle algorithm - common for shuffling cards but may have other options
        public void Shuffle()
        {
            int cardCount = _cards.Count;

            // Fisher-Yates shuffle: iterate backwards through the deck
            for (int currentIndex = cardCount - 1; currentIndex > 0; currentIndex--)
            {
                // Pick a random card from the remaining unshuffled portion (0 to currentIndex)
                int randomIndex = _rng.Next(currentIndex + 1);

                // Swap the current card with the randomly selected card
                var temp = _cards[currentIndex];
                _cards[currentIndex] = _cards[randomIndex];
                _cards[randomIndex] = temp;
            }
        }
        public Card Draw()
        {
            if (!_cards.Any()) throw new InvalidOperationException("Deck empty");
            var c = _cards[0];
            _cards.RemoveAt(0);
            return c;
        }
        public int Remaining => _cards.Count;
    }

}
