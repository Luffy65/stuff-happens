import { Card, Game, GameRound } from './models.mjs';

const SERVER_URL = "http://localhost:3001";

// Helper function to handle fetch responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Handle express-validator errors (422 status with errors array)
    if (errorData.errors && Array.isArray(errorData.errors)) {
      const errorMessages = errorData.errors.map(err => err.msg).join(', ');
      throw new Error(errorMessages);
    }
    
    // Handle single error message
    const message = errorData.error || 'Internal Server Error';
    throw new Error(message);
  }
  
  // Check if response has content before trying to parse JSON
  const text = await response.text();
  return text.trim() ? JSON.parse(text) : null; // Return null if no content
};

// ============================================
// CARD API FUNCTIONS
// ============================================

// Get random starting cards, starting the game.
const getRandomCards = async () => {
  let url = `${SERVER_URL}/api/games/new-game`;
  
  const response = await fetch(url, {
    credentials: 'include'
  });
  const cards = await handleResponse(response);
  return cards.map(card => new Card(card.id, card.name, card.image_url, card.misfortune_index, card.image_author));
};

// Get a single random card (for rounds)
const getRandomSingleCard = async () => {
  const response = await fetch(`${SERVER_URL}/api/games/new-round`, {
    credentials: 'include'
  });
  const card = await handleResponse(response);
  return card ? new Card(card.id, card.name, card.image_url, card.misfortune_index, card.image_author) : null;
};

// Validate card position guess
const verifyGuess = async (playerGuess) => {
  const response = await fetch(`${SERVER_URL}/api/games/verify-guess`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      player_guess: playerGuess
    })
  });
  return await handleResponse(response);
};

// Get a specific card by ID
const getCardById = async (cardId) => {
  let url = `${SERVER_URL}/api/cards/${cardId}`;
  
  const response = await fetch(url, {
    credentials: 'include'
  });
  const card = await handleResponse(response);
  return card ? new Card(card.id, card.name, card.image_url, card.misfortune_index, card.image_author) : null;
};

// ============================================
// GAME API FUNCTIONS
// ============================================

// Get current user's games (without rounds)
const getUserGames = async () => {
  const response = await fetch(`${SERVER_URL}/api/games`, {
    credentials: 'include'
  });
  const games = await handleResponse(response);
  
  return games.map(game => new Game(game.id, game.user_id, game.status, [], game.initial_cards, game.completed_at));
};

// Get all rounds for a specific game
const getGameRounds = async (gameId) => {
  const response = await fetch(`${SERVER_URL}/api/games/${gameId}/rounds`, {
    credentials: 'include'
  });
  const rounds = await handleResponse(response);
  
  return rounds.map(round => {
    // Create card object if it exists in the round
    let card = null;
    if (round.card) {
      card = new Card(
        round.card.id,
        round.card.name,
        round.card.image_url,
        round.card.misfortune_index,
        round.card.image_author
      );
    }
    
    // Create GameRound with the card object
    return new GameRound(
      round.id, 
      round.game_id, 
      round.round_number, 
      round.correct_position, 
      card,
      round.player_guess_position,
    );
  });
};

// ============================================
// AUTHENTICATION API FUNCTIONS
// ============================================

// User login
const logIn = async (username, password) => {
  const response = await fetch(`${SERVER_URL}/api/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      username: username,
      password: password
    })
  });
  return handleResponse(response);
};

// Get current user info
const getUserInfo = async () => {
  const response = await fetch(`${SERVER_URL}/api/sessions/current`, {
    credentials: 'include'
  });
  
  if (response.status === 401) {
    return null; // User not authenticated
  }
  
  return handleResponse(response);
};

// User logout
const logOut = async () => {
  const response = await fetch(`${SERVER_URL}/api/sessions/current`, {
    method: 'DELETE',
    credentials: 'include'
  });
  return handleResponse(response);
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Get the full URL for an image file
const getImageUrl = (imageName) => {
  return `${SERVER_URL}/images/${imageName}`;
};

// Export all API functions
export {
  getRandomCards,
  getRandomSingleCard,
  getCardById,
  verifyGuess,
  getUserGames,
  getGameRounds,
  logIn,
  getUserInfo,
  logOut,
  getImageUrl
};
