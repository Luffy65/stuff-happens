function Card(id, name, imageUrl, misfortuneIndex, imageAuthor = null) {
    this.id = id;
    this.name = name;
    this.image_url = imageUrl;
    this.misfortune_index = misfortuneIndex;
    this.image_author = imageAuthor;
}

function Game(id, userId, status, initialCards = [], completedAt = null) {
    this.id = id;
    this.user_id = userId;
    this.status = status;
    this.initial_cards = initialCards; // Array of 3 card IDs
    this.completed_at = completedAt;
}

function GameRound(id, gameId, roundNumber, correctPosition, card, playerGuessPosition = null) {
    this.id = id;
    this.game_id = gameId;
    this.round_number = roundNumber; // Da 1 a 5 (max 5 rounds per game)
    this.card = card; // Full Card object
    this.correct_position = correctPosition;
    this.player_guess_position = playerGuessPosition;
}

export { Card, Game, GameRound };
