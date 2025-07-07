import dayjs from 'dayjs';
import { getCardById, createGame, createGameRound } from './dao.mjs';

// ============================================
// HELPER FUNCTIONS FOR GAME LOGIC
// ============================================

// Validate active round and timer
const validateRoundTimer = (activeRounds, userId, cardId, playerGuessBody) => {
  const roundData = activeRounds.get(userId);
  if (!roundData) {
    throw new Error('No active round found');
  }
  
  // This should always match since we're getting cardId from the server-side round data
  if (roundData.cardId !== cardId) {
    throw new Error('Internal error: Card ID mismatch in active round');
  }
  
  // Check if timer has expired
  const elapsedTime = dayjs().valueOf() - roundData.startTime;
  const TIMER_LIMIT = 30 * 1000; // 30 seconds
  const BUFFER_TIME = 2 * 1000; // 2 second buffer
  
  let finalGuess = playerGuessBody.player_guess;
  if (elapsedTime > TIMER_LIMIT + BUFFER_TIME) {
    activeRounds.delete(userId);
    finalGuess = null; // Timeout
  } else {
    activeRounds.delete(userId); // Clean up
  }
  
  return finalGuess;
};

// Calculate correct position for a card
const calculateCorrectPosition = async (card, playerCardIds) => {
  const playerCardsData = await Promise.all(
    playerCardIds.map(id => getCardById(id, true))
  );
  
  // Sort player cards by misfortune_index
  const sortedPlayerCards = playerCardsData
    .filter(card => card !== null)
    .sort((a, b) => a.misfortune_index - b.misfortune_index);
  
  let correctPosition = sortedPlayerCards.length; // Default to last position
  for (let i = 0; i < sortedPlayerCards.length; i++) {
    if (card.misfortune_index < sortedPlayerCards[i].misfortune_index) {
      correctPosition = i;
      break;
    }
  }
  
  return correctPosition;
};

// Update game state with round result
const updateGameState = (gameState, cardId, correctPosition, playerGuess, card) => {
  const isCorrect = playerGuess === correctPosition;
  
  gameState.roundsServed += 1;
  
  if (!isCorrect) {
    gameState.misses += 1;
  } else {
    gameState.ownedCards.push(card);
  }
  
  gameState.rounds.push({
    round_number: gameState.roundsServed,
    card_id: cardId,
    correct_position: correctPosition,
    player_guess_position: playerGuess
  });
  
  return isCorrect;
};

// Check if game is complete and save to database if needed
const handleGameCompletion = async (activeRounds, userGameState, gameState, userId, user) => {
  const isGameComplete = gameState.ownedCards.length >= 6 || gameState.misses === 3 || (typeof userId === 'string' && gameState.roundsServed === 1); // String if user is not logged in
  
  if (isGameComplete && user && user.id) {
    const status = gameState.ownedCards.length >= 6 ? 'won' : 'lost';
    const initialCardIds = gameState.initialCards.map(card => card.id);
    
    const savedGame = await createGame(user.id, status, initialCardIds);
    
    for (const round of gameState.rounds) {
      await createGameRound(
        savedGame.id,
        round.round_number,
        round.card_id,
        round.correct_position,
        round.player_guess_position
      );
    }
    
    userGameState.delete(userId);
    activeRounds.delete(userId);
  }
  
  return;
};

export {
  validateRoundTimer,
  calculateCorrectPosition,
  updateGameState,
  handleGameCompletion
};
