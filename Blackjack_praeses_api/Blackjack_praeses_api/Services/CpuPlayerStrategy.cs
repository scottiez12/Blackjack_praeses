using Blackjack_praeses_api.Models.Entities;

namespace Blackjack_praeses_api.Services
{

    public static class CpuPlayerStrategy
    {
        public enum Action { Hit, Stand, Double, Split }

        public static Action GetAction(Hand hand, int dealerUpCard, bool canDouble, bool canSplit)
        {
            int playerValue = hand.BestValue();
            bool isSoftHand = hand.Cards.Any(c => c.IsAce) && playerValue <= 21 && 
                              hand.Cards.Sum(c => c.Value) + 10 == playerValue;

            // Check for split first
            if (canSplit && hand.Cards.Count == 2)
            {
                int cardValue = hand.Cards[0].Value;
                bool isAce = hand.Cards[0].IsAce;

                // Aces and 8s
                if (isAce || cardValue == 8)
                    return Action.Split;

                // Never split 5s or 10s
                if (cardValue == 5 || cardValue == 10)
                {
                    //double/hit logic
                }
                // Split 2s, 3s, 6s, 7s against dealer 2-7
                else if ((cardValue == 2 || cardValue == 3 || cardValue == 6 || cardValue == 7) && 
                         dealerUpCard >= 2 && dealerUpCard <= 7)
                    return Action.Split;
                // Split 4s against dealer 5-6
                else if (cardValue == 4 && dealerUpCard >= 5 && dealerUpCard <= 6)
                    return Action.Split;
                // Split 9s against dealer 2-9 except 7
                else if (cardValue == 9 && dealerUpCard >= 2 && dealerUpCard <= 9 && dealerUpCard != 7)
                    return Action.Split;
            }

            
            if (isSoftHand)
            {
                // Soft 19-21
                if (playerValue >= 19)
                    return Action.Stand;

                // Soft 18: Stand against 2-8, hit against 9-A
                if (playerValue == 18)
                {
                    if (canDouble && (dealerUpCard >= 3 && dealerUpCard <= 6))
                        return Action.Double;
                    return dealerUpCard >= 9 || dealerUpCard == 1 ? Action.Hit : Action.Stand;
                }

                // Soft 17: Double against 3-6, otherwise hit
                if (playerValue == 17)
                {
                    if (canDouble && dealerUpCard >= 3 && dealerUpCard <= 6)
                        return Action.Double;
                    return Action.Hit;
                }

                // Soft 13-16: Double against 5-6, otherwise hit
                if (playerValue >= 13 && playerValue <= 16)
                {
                    if (canDouble && dealerUpCard >= 5 && dealerUpCard <= 6)
                        return Action.Double;
                    return Action.Hit;
                }

                // Soft 12 or less
                return Action.Hit;
            }

      
            if (playerValue >= 17)
                return Action.Stand;

            // 13-16: Stand against dealer 2-6, hit against 7-A
            if (playerValue >= 13 && playerValue <= 16)
                return dealerUpCard >= 2 && dealerUpCard <= 6 ? Action.Stand : Action.Hit;

            // 12: Stand against dealer 4-6, hit otherwise
            if (playerValue == 12)
                return dealerUpCard >= 4 && dealerUpCard <= 6 ? Action.Stand : Action.Hit;

            // 11: Always double if possible, otherwise hit
            if (playerValue == 11)
                return canDouble ? Action.Double : Action.Hit;

            // 10: Double against dealer 2-9, otherwise hit
            if (playerValue == 10)
            {
                if (canDouble && dealerUpCard >= 2 && dealerUpCard <= 9)
                    return Action.Double;
                return Action.Hit;
            }

            // 9: Double against dealer 3-6, otherwise hit
            if (playerValue == 9)
            {
                if (canDouble && dealerUpCard >= 3 && dealerUpCard <= 6)
                    return Action.Double;
                return Action.Hit;
            }

            // 8 or less: Always hit
            return Action.Hit;
        }
    }
}

