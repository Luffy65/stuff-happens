import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { check, validationResult } from 'express-validator';
import dayjs from 'dayjs';
// DAO
import { getUser, getRandomCard, getCardById, getGames, getRounds } from './dao.mjs';
// Auth
import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';
// Utils
import { validateRoundTimer, calculateCorrectPosition, updateGameState, handleGameCompletion } from './utils.mjs';

// init express
const app = new express();
const port = 3001;

// Simple in-memory storage for round timers and complete game state per user
const activeRounds = new Map(); // userId -> { startTime, cardId }
const userGameState = new Map(); // userId -> { usedCardIds, initialCards, ownedCards, rounds, roundsServed, misses }

// Helper function to get consistent user ID for userGameState
const getUserId = (req) => {
  if (req.user?.id) {
    return req.user.id;
  }
  
  // For anonymous users, create or retrieve session-based ID
  if (!req.session.anonymousUserId) { // express-session will create req.session if it doesn't exist
    req.session.anonymousUserId = `anonymous_${Math.random().toString(36).substring(2, 15)}`;
  }
  
  return req.session.anonymousUserId;
};

// middleware
app.use(express.json()); // parse JSON bodies
app.use(morgan('dev')); // log requests to the console

const corsOptions = {
  origin: 'http://localhost:5173', // Allow requests from the React app
  optionsSuccessState: 200,
  credentials: true // Allow credentials for session management
};

app.use(cors(corsOptions));

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  try {
    const user = await getUser(username, password);
    if(!user)
      return cb(null, false, { message: 'Incorrect username or password.' });
      
    return cb(null, user);
  } catch (error) {
    return cb(error);
  }
}));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

// To protect routes
const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}

app.use(session({
  secret: "game-of-misfortune-secret-key-2025",
  resave: false, // Don't save session if unmodified
  saveUninitialized: false, // Don't create session until something stored
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.authenticate('session'));

// Serve static files (images)
app.use('/images', express.static('public/images'));

// Routes

// ============================================
// AUTHENTICATION ROUTES
// ============================================

app.post('/api/sessions', [
  check('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 1, max: 50 }).withMessage('Username must be between 1 and 50 characters')
    .trim() // sanitize input: trim whitespace
    .escape(), // sanitize input: escape HTML characters
  check('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 100 }).withMessage('Password must be between 6 and 100 characters')
], function(req, res, next) {
  // Check validation errors first
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  // Use passport.authenticate with custom callback
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (!user) {
      return res.status(401).json({ error: info.message || 'Authentication failed' });
    }
    
    // Log the user in
    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Login failed' });
      }
      return res.status(201).json(user);
    });
  })(req, res, next);
});

// GET /api/sessions/current - Get current user info
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// DELETE /api/sessions/current - User logout
app.delete('/api/sessions/current', (req, res) => {
  req.logout((err) => {
    if (err) 
      return res.status(500).json({ error: 'Could not log out' });
    res.end();
  });
});

// ============================================
// CARD ROUTES
// ============================================

// GET /api/cards/:id - Get a specific card by ID, without misfortune_index
app.get('/api/cards/:id', [
  check('id').isInt({ min: 1 }).withMessage('Card ID must be a positive integer'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const card = await getCardById(parseInt(req.params.id), false);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GAME ROUTES
// ============================================

// GET /api/games/new-game - Start a new game and get 3 random cards
app.get('/api/games/new-game', async (req, res) => {
  const errors = validationResult(req); // Validate request parameters
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    // Generate unique identifier, both for logged in users and anonymous users
    const userId = getUserId(req);
    
    // Initialize or reset user game state for new game
    userGameState.set(userId, { 
      usedCardIds: [], 
      initialCards: [], // Store complete card objects
      ownedCards: [], // Cards currently owned by player (starts with 3, can grow to 6)
      rounds: [], // Store round information for database saving
      roundsServed: 0,
      misses: 0
    }); 
    
    // Call 3 times getRandomCard to get 3 random cards with misfortune_index
    const cards = [];
    const excludeIds = [];
    
    for (let i = 0; i < 3; i++) {
      const card = await getRandomCard(excludeIds, true);
      if (card) {
        cards.push(card);
        excludeIds.push(card.id); // Exclude this card in future calls
      }
    }
    
    // Store the 3 initial cards in user game state
    const gameState = userGameState.get(userId);
    gameState.initialCards = [...cards]; // Store complete card objects
    gameState.ownedCards = [...cards]; // Player starts with these 3 cards
    gameState.usedCardIds = [...cards.map(card => card.id)];
    
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/games/new-round - Start a new round: get a random card, start timer, save used cards
app.get('/api/games/new-round', async (req, res) => {
  try {
    const userId = getUserId(req); // Handles both logged in and demo users
    
    // Get the user's game state to know which cards are already used
    const gameState = userGameState.get(userId);
    if (!gameState) {
      return res.status(400).json({ error: 'No active game found. Please start a new game first.' });
    }
    
    // Use server-side tracking of used cards
    const excludeIds = gameState.usedCardIds;
    
    // Don't include misfortune_index for active gameplay to prevent cheating
    const card = await getRandomCard(excludeIds, false);

    // Add this card to the used cards list
    gameState.usedCardIds.push(card.id);

    // Remember card id for validation, and start server-side timer when card is fetched (round begins)
    activeRounds.set(userId, {
      startTime: dayjs().valueOf(),
      cardId: card.id // Store the card ID for validation later
    });

    // Return the card without misfortune_index
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/games/verify-guess - Verify player's card position guess, and if the game is over, save to DB
app.post('/api/games/verify-guess', [
  check('player_guess').custom((value) => {
    if (value === null) return true; // Allow null for timeout cases
    if (!Number.isInteger(value) || value < 0) {
      throw new Error('Player guess must be a non-negative integer or null for timeout');
    }
    return true;
  }).withMessage('Player guess must be a non-negative integer or null for timeout'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const userId = getUserId(req); // Handles both logged in and demo users
    
    // Get the round's card ID from the active round
    const roundData = activeRounds.get(userId);
    if (!roundData) {
      return res.status(400).json({ error: 'No active round found' });
    }
    const card_id = roundData.cardId;
    
    // Validate round and timer
    const finalPlayerGuess = validateRoundTimer(activeRounds, userId, card_id, req.body);
    
    // Get the card details, including misfortune_index
    const card = await getCardById(card_id, true);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Get gameState
    const gameState = userGameState.get(userId);
    if (!gameState) {
      return res.status(400).json({ error: 'No active game found. Please start a new game first.' });
    }
    
    // Calculate correct position
    const correctPosition = await calculateCorrectPosition(card, gameState.ownedCards.map(c => c.id));

    // Update game state
    const isCorrect = updateGameState(gameState, card_id, correctPosition, finalPlayerGuess, card);
    
    // Handle game completion
    await handleGameCompletion(activeRounds, userGameState, gameState, userId, req.user);
    
    // Return response
    const cardResponse = {
      id: card.id,
      name: card.name,
      image_url: card.image_url,
      image_author: card.image_author,
      misfortune_index: isCorrect ? card.misfortune_index : null
    };
    
    res.json({
      card: cardResponse,
      correct_position: correctPosition,
      is_correct: isCorrect
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/games - Get current user's games
app.get('/api/games', isLoggedIn, async (req, res) => {
  try {
    const games = await getGames(req.user.id);
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/games/:id/rounds - Get all rounds for a specific game
app.get('/api/games/:id/rounds', [
  check('id').isInt({ min: 1 }).withMessage('Game ID must be a positive integer')
], isLoggedIn, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const gameId = parseInt(req.params.id);
    
    // Verify the game belongs to the current user
    const games = await getGames(req.user.id);
    const game = games.find(g => g.id === gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found or does not belong to current user' });
    }
    
    const rounds = await getRounds(gameId);
    res.json(rounds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// activate the server
app.listen(port, () => {
  console.log(`API server started at http://localhost:${port}`);
});
