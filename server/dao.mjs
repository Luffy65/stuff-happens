import sqlite from 'sqlite3';
import crypto from 'crypto';
import dayjs from 'dayjs';
import { Card, Game, GameRound } from './models.mjs';

// Open the DB
const db = new sqlite.Database('db.sqlite', (err) => {
  if (err) throw err;
});

//===========================================
// USER OPERATIONS
//===========================================

// Get user by username and verify password
export const getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) { 
        reject(err); 
      }
      else if (row === undefined) { 
        resolve(false); 
      }
      else { // User found, verify password
        const user = {id: row.id, username: row.username};
        
        crypto.scrypt(password, row.salt, 16, function(err, hashedPassword) {
          if (err) reject(err);
          if(!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashedPassword))
            resolve(false);
          else
            resolve(user);
        });
      }
    });
  });
};

//===========================================
// CARD OPERATIONS
//===========================================

// Get a random card not in the excluded list
export const getRandomCard = async (excludeIds = [], includeMisfortuneIndex = false) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM cards';
    let params = [];
    
    if (excludeIds.length > 0) {
      const placeholders = excludeIds.map(() => '?').join(',');
      query += ` WHERE id NOT IN (${placeholders})`;
      params = excludeIds;
    }
    
    query += ' ORDER BY RANDOM() LIMIT 1';
    
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (row) {
          // Hide misfortune_index for active gameplay to prevent cheating
          const misfortuneIndex = includeMisfortuneIndex ? row.misfortune_index : undefined;
          resolve(new Card(row.id, row.name, row.image_url, misfortuneIndex, row.image_author));
        } else {
          resolve(null);
        }
      }
    });
  });
};

// Get card by ID, optionally including misfortune_index to prevent cheating
export const getCardById = async (id, includeMisfortuneIndex = true) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM cards WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (row) {
          // Hide misfortune_index for active gameplay to prevent cheating
          const misfortuneIndex = includeMisfortuneIndex ? row.misfortune_index : undefined;
          resolve(new Card(row.id, row.name, row.image_url, misfortuneIndex, row.image_author));
        } else {
          resolve(null);
        }
      }
    });
  });
};

//===========================================
// GAME OPERATIONS
//===========================================

// Create a completed game record
export const createGame = async (userId, status, initialCards) => {
  return new Promise((resolve, reject) => {
    const initialCardsStr = JSON.stringify(initialCards); // Store initial cards as JSON string
    const completedAt = dayjs().toISOString();
    
    db.run(
      'INSERT INTO games (user_id, status, initial_cards, completed_at) VALUES (?, ?, ?, ?)',
      [userId, status, initialCardsStr, completedAt],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(new Game(this.lastID, userId, status, initialCardsStr, completedAt));
        }
      }
    );
  });
};

// Get all games for a user, ordered by completion date
export const getGames = async (userId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, user_id, status, initial_cards, completed_at
      FROM games 
      WHERE user_id = ?
      ORDER BY completed_at DESC
    `;
    
    db.all(query, [userId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      const games = rows.map(row => {
        // Parse initial_cards JSON string back to array
        let initialCards = [];
        try {
          initialCards = row.initial_cards ? JSON.parse(row.initial_cards) : [];
        } catch (e) {
          console.error('Error parsing initial_cards for game', row.id, ':', e);
          initialCards = [];
        }
        
        return new Game(row.id, row.user_id, row.status, initialCards, row.completed_at);
      });
      
      resolve(games);
    });
  });
};

//===========================================
// GAME ROUND OPERATIONS
//===========================================

// Create a new round record
export const createGameRound = async (gameId, roundNumber, cardId, correctPosition, playerGuessPosition = null) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO game_rounds (game_id, round_number, card_id, correct_position, player_guess_position) VALUES (?, ?, ?, ?, ?)',
      [gameId, roundNumber, cardId, correctPosition, playerGuessPosition],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
};

// Get all rounds for a specific game, with card objects populated, but without misfortune_index
export const getRounds = async (gameId) => {
  return new Promise(async (resolve, reject) => {
    const query = `
      SELECT id, game_id, round_number, card_id, correct_position, player_guess_position
      FROM game_rounds 
      WHERE game_id = ?
      ORDER BY round_number ASC
    `;
    
    try {
      db.all(query, [gameId], async (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Get card objects for each round, without  misfortune_index
        const rounds = [];
        for (const row of rows) {
          const card = await getCardById(row.card_id, false);
          
          const round = new GameRound(
            row.id,
            row.game_id,
            row.round_number,
            row.correct_position,
            card, // actual card object
            row.player_guess_position
          );
          
          rounds.push(round);
        }
        resolve(rounds);
      });
    } catch (error) {
      reject(error);
    }
  });
};
