import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Modal, Badge, Spinner } from 'react-bootstrap';
import { getRandomCards, getRandomSingleCard, verifyGuess, getImageUrl } from '../../API.mjs';
import Timer from '../Timer.jsx';
import GameCard from '../GameCard.jsx';
import '../../styles/CardPositioning.css';

function Game({ loggedIn }) {  
  // Core game states
  const [playerCards, setPlayerCards] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [roundNumber, setRoundNumber] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [hoveredPosition, setHoveredPosition] = useState(null);
  const [showResult, setShowResult] = useState(false); // Modal for round results
  const [lastRoundResult, setLastRoundResult] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Derived game states
  const demoComplete = !loggedIn && showResult && roundNumber >= 1;
  const gameComplete = playerCards.length >= 6 || mistakes >= 3 || demoComplete;
  
  const gameWon = gameComplete && (
    playerCards.length >= 6 ||             // Normal game win condition
    (demoComplete && lastRoundResult?.won) // Demo game win condition
  );
  const showConfirmButton = selectedPosition !== null && timerActive;

  // Inizialize game on component mount (runs only once)
  useEffect(() => {
    initializeGame();
  }, []);

  // Handle game completion - this effect runs when game ends
  useEffect(() => {
    if (gameComplete && loggedIn && roundNumber > 0) {
      endGame(gameWon);
    }
  }, [gameComplete, gameWon, loggedIn, roundNumber]);

  const initializeGame = async () => {
    try {
      setIsInitializing(true);

      // Get 3 random starting cards
      const startingCards = await getRandomCards();
      
      // Sort cards by misfortune index
      const sortedCards = startingCards.sort((a, b) => a.misfortune_index - b.misfortune_index);
      
      setPlayerCards(sortedCards);
      setIsInitializing(false);
      
    } catch (error) {
      console.error('Error initializing game:', error);
      setIsInitializing(false);
    }
  };

  const startNewRound = async () => {
    if (gameComplete) return;

    try {
      const nextRound = roundNumber + 1;

      // Get a random card not in player's possession (STARTS THE SERVER-SIDE TIMER)
      const newCard = await getRandomSingleCard();

      setCurrentCard(newCard); // Set the new card for this round
      setRoundNumber(nextRound);
      setSelectedPosition(null);
      setHoveredPosition(null);
      setTimerActive(true); // Start client timer
      setShowResult(false);
    } catch (error) {
      console.error('Error starting new round:', error);
    }
  };

  const handleTimeUp = () => {
    // Prevent multiple calls to handleTimeUp
    if (!timerActive) {
      return;
    }

    setTimerActive(false);
    if (currentCard && !gameComplete) {
      processRound(null); // Process round with no selection (timed out)
    }
  };

  const handlePositionSelect = (position) => {
    if (!timerActive || gameComplete) return;
    setSelectedPosition(position);
  };

  const handlePositionHover = (position) => {
    if (!timerActive || gameComplete) return;
    setHoveredPosition(position);
  };

  const handlePositionLeave = () => {
    setHoveredPosition(null);
  };

  const handleConfirmChoice = () => {
    if (selectedPosition === null || !timerActive) return;
    setTimerActive(false);
    processRound(selectedPosition);
  };

  const handleResultModalClose = () => {
    setShowResult(false);
    
    // Reset selection state for the next round (game is not complete if modal is showing)
    setSelectedPosition(null);
    setHoveredPosition(null);
    setTimeout(() => { // After 100ms delay, start the next round
      startNewRound();
    }, 100);
  };

  const processRound = async (playerGuess) => {
    try {
      // Validate that we have a current card
      if (!currentCard || !currentCard.id) {
        throw new Error('No current card available');
      }
      
      // Use server-side validation to check player's guess
      const validationResult = await verifyGuess(playerGuess);
      
      // Extract results from server response
      const { card, correct_position, is_correct } = validationResult;
      const isCorrect = is_correct;
      const correctPosition = correct_position;
      
      // Update game state
      const roundResult = {
        round_number: roundNumber,
        card_id: card.id,
        card: card,
        correct_position: correctPosition,
        player_guess_position: playerGuess,
        won: isCorrect,
        timed_out: playerGuess === null
      };

      setLastRoundResult(roundResult);

      let newPlayerCards = playerCards;
      let newMistakes = mistakes;

      if (isCorrect) {
        // Player wins the card - add it to player's cards in correct position
        newPlayerCards = [...playerCards];
        newPlayerCards.splice(correctPosition, 0, card);
        setPlayerCards(newPlayerCards);
      } else {
        // Player makes a mistake
        newMistakes = mistakes + 1;
        setMistakes(newMistakes);
      }

      // Only show modal for intermediate rounds, not when game is complete
      if (!gameComplete && !(isCorrect && newPlayerCards.length >= 6) && !(newMistakes >= 3)) {
        setShowResult(true);
      }

    } catch (error) {
      console.error('Error processing round:', error);
      console.error('Current card:', currentCard);
      console.error('Player guess:', playerGuess);
      console.error('Round number:', roundNumber);
    }
  };

  const handleNextRound = () => {
    setShowResult(false); // Close the modal first
    // Reset selection state for the next round
    setSelectedPosition(null);
    setHoveredPosition(null);
    
    // This function should only be called when the game is NOT complete
    if (!gameComplete) {
      // Add a small delay to ensure modal closes before starting next round
      setTimeout(() => { // After 100ms delay, start the next round
        startNewRound();
      }, 100);
    }
  };

  const endGame = async (won) => {
    // Clear current card to end the game state
    setCurrentCard(null);
  };

  const handleNewGame = () => {
    // Reset all game state
    setPlayerCards([]);
    setCurrentCard(null);
    setRoundNumber(0);
    setMistakes(0);
    setTimerActive(false);
    setSelectedPosition(null);
    setHoveredPosition(null);
    setShowResult(false);
    setLastRoundResult(null);

    // Start new game
    initializeGame();
  };

  const getPositionLabel = (index) => {
    if (index === 0) return 'Before all cards';
    if (index === playerCards.length) return 'After all cards';
    return `Between card ${index} and ${index + 1}`;
  };

  // Determine the class for card shifting based on selected or hovered position
  const getCardShiftClass = (cardIndex) => {
    const activePosition = selectedPosition !== null ? selectedPosition : hoveredPosition;
    if (activePosition === null) return '';
    
    if (activePosition === cardIndex) {
      return 'shift-right';
    } else if (activePosition === cardIndex + 1) {
      return 'shift-left';
    }
    return '';
  };

  if (isInitializing) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 text-center text-light">
        <div>
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h4>Loading your game...</h4>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="flex-grow-1">
        <Container className="py-4">
          {loggedIn && (
            <Row className="mb-4">
              <Col>
                <Card className="bg-primary text-white">
                  <Card.Body>
                    <div className="d-flex flex-wrap gap-2">
                      {roundNumber > 0 && (
                        <Badge bg="light" text="dark">
                          Round {roundNumber}
                        </Badge>
                      )}
                      <Badge bg="light" text="dark">
                        Cards: {playerCards.length}/6
                      </Badge>
                      <Badge bg={mistakes >= 2 ? 'danger' : 'warning'} text="dark">
                        Mistakes: {mistakes}/3
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Game Over Screen - Show when game is complete */}
          {gameComplete && (
            <Row className="mb-4">
              <Col>
                <Card className={`border-${gameWon ? 'success' : 'danger'}`}>
                  <Card.Header className={`bg-${gameWon ? 'success' : 'danger'} text-white text-center`}>
                    <h3 className="mb-0">
                      {gameWon ? '🎉 Congratulations!' : 'Game Over'}
                    </h3>
                  </Card.Header>
                  <Card.Body className="text-center p-4">
                    {!loggedIn ? (
                      // Demo mode messages
                      gameWon ? (
                        <div>
                          <h5 className="text-success mb-3">Great job! You correctly placed the card!</h5>
                          <p className="mb-3">That was just a demo round. Ready to play the full game?</p>
                        </div>
                      ) : (
                        <div>
                          <h5 className="text-warning mb-3">Oops! You didn't place the card correctly, but that's okay - it was just a demo!</h5>
                          <p className="mb-3">Ready to try the full game? Log In!</p>
                        </div>
                      )
                    ) : (
                      // Full game messages
                      gameWon ? (
                        <div>
                          <h5 className="text-success mb-3">You collected 6 cards and won the game!</h5>
                        </div>
                      ) : (
                        <div>
                          <h5 className="text-danger mb-3">You made 3 mistakes and lost the game.</h5>
                          <p className="mb-3">Better luck next time!</p>
                        </div>
                      )
                    )}
                    
                    <div className="mb-4">
                      <h4 className="mb-2">
                        <Badge bg="primary" className="fs-5">
                          Final Score: {playerCards.length} cards collected
                        </Badge>
                      </h4>
                      {!loggedIn && (
                        <p className="text-muted mb-0">
                          <em>Ready to play the full game? <strong>Log in</strong> to save your progress!</em>
                        </p>
                      )}
                    </div>

                    <div className="d-grid d-md-block gap-3">
                      <Button 
                        variant="primary" 
                        size="lg" 
                        onClick={handleNewGame} 
                        className="me-md-3 mb-3 mb-md-0 px-4"
                      >
                        🎮 Play Again
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Current Round - Only show if game is actively playing (not complete and has current card) */}
          {currentCard && !showResult && !gameComplete && (
            <Row className="mb-4">
              <Col>
                <Card className="border-warning">
                  <Card.Header className="bg-warning text-dark text-center">
                    <h5 className="mb-0">Round {roundNumber}: Place this card in your collection!</h5>
                  </Card.Header>
                  <Card.Body className="text-center">
                    <div className="d-flex justify-content-center mb-3">
                      <GameCard 
                        card={currentCard}
                        size="large"
                        showMisfortuneIndex={false}
                        style={{ width: '250px' }}
                        imageStyle={{ height: '200px', objectFit: 'cover' }}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Player's Cards - Interactive Layout for Positioning */}
          {currentCard && !showResult && !gameComplete ? (
            <Row className="mb-4">
              <Col>
                <div className="card-positioning-container">
                  {/* First drop zone - before all cards */}
                  <div 
                    className={`drop-zone first ${selectedPosition === 0 ? 'selected' : ''}`}
                    onMouseEnter={() => handlePositionHover(0)}
                    onMouseLeave={handlePositionLeave}
                    onClick={() => handlePositionSelect(0)}
                  >
                    <div className="drop-zone-indicator">
                      {selectedPosition === 0 ? 'Selected!' : 'Place First'}
                    </div>
                  </div>

                  {playerCards.map((card, index) => (
                    <div key={card.id} style={{ display: 'flex', alignItems: 'center' }}>
                      {/* Player card */}
                      <div className={`player-card-slot ${getCardShiftClass(index)}`}>
                        <GameCard 
                          card={card}
                          size="medium"
                          showMisfortuneIndex={true}
                          className="player-card"
                          style={{ width: '180px', height: '220px' }}
                          imageStyle={{ height: '120px', objectFit: 'cover' }}
                          bodyClassName="p-2"
                          titleClassName="small mb-1"
                        />
                      </div>

                      {/* Drop zone after this card */}
                      <div 
                        className={`drop-zone ${index === playerCards.length - 1 ? 'last' : ''} ${selectedPosition === index + 1 ? 'selected' : ''}`}
                        onMouseEnter={() => handlePositionHover(index + 1)}
                        onMouseLeave={handlePositionLeave}
                        onClick={() => handlePositionSelect(index + 1)}
                      >
                        <div className="drop-zone-indicator">
                          {selectedPosition === index + 1 ? 'Selected!' : 
                           index === playerCards.length - 1 ? 'Place Last' : 'Place Here'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Col>
            </Row>
          ) : ( // Else display static cards
            /* Static cards display when not positioning, or when game has ended */
            <Row className="mb-4">
              <Col>
                <h4 className="text-light text-center">
                  {gameComplete ? 'Final Collection' : 'Your Cards'}
                </h4>
                <Row className="g-3 justify-content-center">
                  {playerCards.map((card, index) => (
                    <Col key={card.id} md={4} lg={2} className="mb-3">
                      <GameCard 
                        card={card}
                        size="medium"
                        showMisfortuneIndex={true}
                        className="h-100"
                        imageStyle={{ height: '150px', objectFit: 'cover' }}
                        bodyClassName="d-flex flex-column"
                        titleClassName="small"
                      />
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          )}

          {/* Start First Round Button */}
          {roundNumber === 0 && (
            <Row className="mb-4">
              <Col className="text-center">
                <Card className="border-success">
                  <Card.Body className="p-4">
                    <h4 className="text-success mb-3">🎯 Ready to Start?</h4>
                    <p className="mb-4">
                      Take your time to examine your starting cards above. They are sorted by their misfortune index (1-100).
                      <br />
                      When you're ready to begin the first round, click the button below!
                    </p>
                    <Button 
                      variant="success" 
                      size="lg" 
                      onClick={startNewRound}
                      className="px-5"
                    >
                      🚀 Start First Round
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Floating confirm button */}
          {showConfirmButton && selectedPosition !== null && (
            <Button
              variant="success"
              size="lg"
              className="position-confirm-button"
              onClick={handleConfirmChoice}
              disabled={!timerActive}
            >
              ✓ Confirm Position {selectedPosition + 1}
            </Button>
          )}
        </Container>
      </div>

      {/* Timer Component */}
      <Timer 
        isActive={timerActive}
        onTimeUp={handleTimeUp}
      />

      {/* Round Result Modal - Only show for intermediate rounds, not when game is complete */}
      <Modal show={showResult && !gameComplete} onHide={handleResultModalClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {lastRoundResult?.won ? '🎉 Correct!' : '❌ Incorrect'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {lastRoundResult && (
            <div>
              <div className="text-center mb-3">
                <img 
                  src={getImageUrl(lastRoundResult.card.image_url)}
                  alt={lastRoundResult.card.name}
                  style={{ height: '150px', objectFit: 'cover' }}
                  className="rounded"
                />
              </div>
              
              <h5>{lastRoundResult.card.name}</h5>
              <p><strong>Misfortune Index:</strong> {lastRoundResult?.won ? lastRoundResult.card.misfortune_index : 'Hidden!'}</p>
              
              {lastRoundResult.timed_out ? (
                <Alert variant="danger">Time ran out! You didn't make a choice. {3 - mistakes} mistakes remaining.</Alert>
              ) : (
                <div>
                  <p><strong>Your guess:</strong> {getPositionLabel(lastRoundResult.player_guess_position)}</p>
                  <p><strong>Correct position:</strong> {lastRoundResult?.won ? getPositionLabel(lastRoundResult.correct_position) : 'Hidden!'}</p>
                </div>
              )}
              
              {lastRoundResult.won ? (
                <Alert variant="success">
                  You guessed correctly! This card is now added to your collection.
                </Alert>
              ) : (!lastRoundResult.timed_out) && (
                <Alert variant="danger">
                  Wrong guess! You made a mistake. {3 - mistakes} mistakes remaining.
                </Alert>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleNextRound}>
            ➡️ Next Round
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Game;
