using AutoMapper;
using Blackjack_praeses_api.Models.DTOs;
using Blackjack_praeses_api.Persistence;
using Blackjack_praeses_api.Services;
using Microsoft.AspNetCore.Mvc;
using static Blackjack_praeses_api.Persistence.GameState;

namespace Blackjack_praeses_api.Controllers
{
    [ApiController]
    [Route("api/game")]
    public class GameController : ControllerBase
    {
        private readonly GameManager _manager;
        private readonly GameService _gameService;
        private readonly IMapper _mapper;

        public GameController(GameManager manager, GameService gameService, IMapper mapper)
        {
            _manager = manager;
            _gameService = gameService;
            _mapper = mapper;
        }



        // Helper/wrapper to consolidate common logic for game actions
        private IActionResult ExecuteGameAction(Guid id, Action<GameState> action)
        {
            var gameState = _manager.Get(id);
            if (gameState == null) return NotFound();

            try
            {
                action(gameState);
                _manager.Update(gameState);
                return Ok(_mapper.Map<GameStateDTO>(gameState));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("start")]
        public IActionResult Start([FromBody] GameInitDTO gameInitDto)
        {
            int decks = gameInitDto.Decks ?? 1;
            int players = gameInitDto.Players ?? 1;

            if (players < 1 || players > 7)
                return BadRequest(new { error = "Player count must be between 1 and 7" });

            var gameState = _manager.Create(decks, players);
            return Ok(_mapper.Map<GameStateDTO>(gameState));
        }

        [HttpGet("{id:guid}")]
        public IActionResult Get(Guid id)
        {
            var gameState = _manager.Get(id);
            if (gameState == null) return NotFound();
            return Ok(_mapper.Map<GameStateDTO>(gameState));
        }

        [HttpPost("{id:guid}/hit")]
        public IActionResult Hit(Guid id) => ExecuteGameAction(id, _gameService.PlayerHit);

        [HttpPost("{id:guid}/stand")]
        public IActionResult Stand(Guid id) => ExecuteGameAction(id, _gameService.PlayerStand);

        [HttpPost("{id:guid}/double")]
        public IActionResult Double(Guid id) => ExecuteGameAction(id, _gameService.PlayerDouble);

        [HttpPost("{id:guid}/split")]
        public IActionResult Split(Guid id) => ExecuteGameAction(id, _gameService.PlayerSplit);

        [HttpPost("{id:guid}/bet")]
        public IActionResult PlaceBet(Guid id, [FromBody] PlaceBetDTO betDto)
        {
            return ExecuteGameAction(id, gameState =>
            {
                var humanPlayer = gameState.Players.FirstOrDefault(p => p.IsHuman);
                if (humanPlayer == null)
                    throw new InvalidOperationException("No human player found");

                _gameService.PlaceBet(gameState, humanPlayer.PlayerId, betDto.Amount);
            });
        }

        [HttpPost("{id:guid}/deal")]
        public IActionResult Deal(Guid id) => ExecuteGameAction(id, _gameService.DealCards);

        [HttpPost("{id:guid}/newhand")]
        public IActionResult NewHand(Guid id)
        {
            var gameState = _manager.Get(id);
            if (gameState == null) return NotFound();

            try
            {
                var newGameState = _gameService.NewHand(gameState);
                _manager.Update(newGameState);
                return Ok(_mapper.Map<GameStateDTO>(newGameState));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
