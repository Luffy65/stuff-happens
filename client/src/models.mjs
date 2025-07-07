function Card (id, name, imageUrl, misfortuneIndex, imageAuthor = null){
    this.id = id;
    this.name = name;
    this.image_url = imageUrl;
    this.misfortune_index = misfortuneIndex;
    this.image_author = imageAuthor;
}

function Game (id, userId, status, rounds = [], initialCards = [], completedAt = null) {
    this.id = id;
    this.user_id = userId;
    this.status = status;
    this.rounds = rounds;
    this.initial_cards = initialCards; // Array of 3 card IDs
    this.completed_at = completedAt;
}

function GameRound (id, gameId, roundNumber, correctPosition, card, playerGuessPosition = null) {
    this.id = id;
    this.game_id = gameId;
    this.round_number = roundNumber;
    this.correct_position = correctPosition;
    this.card = card; // Full Card object with all card details
    this.player_guess_position = playerGuessPosition;
}

export { Card, GameRound, Game };
