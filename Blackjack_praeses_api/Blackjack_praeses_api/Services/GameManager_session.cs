using System.Collections.Concurrent;
using Blackjack_praeses_api.Persistence;
using static Blackjack_praeses_api.Persistence.GameState;

namespace Blackjack_praeses_api.Services
{
    public class GameManager
    {
        private readonly ConcurrentDictionary<Guid, GameState> _games = new();
        private readonly GameService _service;

        public GameManager(GameService service)
        {
            _service = service;
        }

        public GameState Create(int decks = 1, int players = 1)
        {
            var gameState = _service.StartGame(decks, players);
            _games[gameState.Id] = gameState;
            return gameState;
        }

        public GameState? Get(Guid id) => _games.TryGetValue(id, out var gameState) ? gameState : null;

        public void Update(GameState gameState) => _games[gameState.Id] = gameState;

        public void Remove(Guid id) => _games.TryRemove(id, out _);
    }
}
