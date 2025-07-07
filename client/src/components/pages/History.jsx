import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Alert, Spinner, Accordion, Modal } from 'react-bootstrap';
import { getUserGames, getGameRounds, getCardById, getImageUrl } from '../../API.mjs';
import GameCard from '../GameCard.jsx';
import dayjs from 'dayjs';

function History({ user }) {  
  const [games, setGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImage, setModalImage] = useState({ src: '', title: '', author: '' });

  useEffect(() => {
    if (user) {
      loadGameHistory();
    }
  }, [user]);

  const loadGameHistory = async () => {
    try {
      setGamesLoading(true);
      
      // First, get all user games
      const userGames = await getUserGames();
      
      // Then, for each game, get its rounds and initial cards
      const gamesWithFullData = await Promise.all(userGames.map(async (game) => {
        try {
          // Get rounds for this game
          const rounds = await getGameRounds(game.id);
          
          // Get initial cards data
          let initialCardsData = [];
          if (game.initial_cards && game.initial_cards.length > 0) {
            const cardPromises = game.initial_cards.map(async (cardId) => {
              try {
                const card = await getCardById(cardId);
                return card;
              } catch (error) {
                console.error(`Failed to load initial card ${cardId}:`, error);
                return null;
              }
            });
            initialCardsData = (await Promise.all(cardPromises)).filter(card => card !== null);
          }
          
          return { ...game, rounds, initialCardsData };
        } catch (error) {
          console.error(`Failed to load data for game ${game.id}:`, error);
          return { ...game, rounds: [], initialCardsData: [] };
        }
      }));
      
      setGames(gamesWithFullData);
    } catch (error) {
      console.error('Error loading game history:', error);
    } finally {
      setGamesLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = dayjs(dateString);
    return date.format('MMM D, YYYY, h:mm A');
  };

  const getGameStatusBadge = (status) => {
    if (status === 'won') {
      return <Badge bg="success" className="fs-6">Won</Badge>;
    } else {
      return <Badge bg="danger" className="fs-6">Lost</Badge>;
    }
  };

  const getRoundResult = (round) => {
    if (!round.player_guess_position && round.player_guess_position !== 0) {
      return <Badge bg="warning" text="dark">⏰ Timed Out</Badge>;
    }
    
    const isCorrect = round.player_guess_position === round.correct_position;
    return isCorrect ? 
      <Badge bg="success">Won</Badge> : 
      <Badge bg="danger">Lost</Badge>;
  };

  const handleImageClick = (imageSrc, cardName, imageAuthor) => {
    setModalImage({
      src: imageSrc,
      title: cardName,
      author: imageAuthor || 'Unknown'
    });
    setShowImageModal(true);
  };

  const renderGameCard = (game, index) => {
    const totalCards = game.rounds ? game.rounds.filter(r => {
      const isCorrect = r.player_guess_position === r.correct_position;
      return isCorrect;
    }).length + 3 : 3; // 3 initial cards + won rounds

    // Validate game data integrity
    const isGameDataValid = () => {
      if (game.status === 'won') { // Won games should have 6 cards
        return totalCards === 6;
      } else if (game.status === 'lost') { // Lost games should have 3-5 cards
        return totalCards >= 3 && totalCards <= 5;
      }
      return true; // Unknown status, assume valid
    };

    const gameDataValid = isGameDataValid();

    return (
      <Accordion.Item eventKey={index.toString()} key={game.id}>
        <Accordion.Header>
          <div className="d-flex justify-content-between align-items-center w-100 me-3">
            <div>
              <strong>Game #{games.length - index}</strong>
              <span className="ms-3">{getGameStatusBadge(game.status)}</span>
              {!gameDataValid && (
                <Badge bg="warning" text="dark" className="ms-2">
                  ⚠️ Corrupted game save data
                </Badge>
              )}
            </div>
            <div className="text-end">
              <div>
                <Badge bg="info" className="me-2">
                  {totalCards} cards collected
                </Badge>
                <Badge bg="secondary">
                  {game.rounds ? game.rounds.length : 0} rounds played
                </Badge>
              </div>
              <small className="text-muted">{formatDate(game.completed_at)}</small>
            </div>
          </div>
        </Accordion.Header>
        <Accordion.Body>
          {!gameDataValid && (
            <Alert variant="warning" className="mb-3">
              <strong>⚠️ Warning:</strong> This game appears to have corrupted save data. 
              Expected {game.status === 'won' ? '6 cards for a won game' : '3-5 cards for a lost game'}, 
              but found {totalCards} cards.
            </Alert>
          )}

          {/* Initial Cards Section */}
          <div className="mb-3">
            <h6 className="text-primary mb-2">Initial Cards</h6>
            <Row className="g-2">
              {game.initialCardsData && game.initialCardsData.length > 0 ? (
                game.initialCardsData.map((card) => {
                  if (!card) return null;
                  
                  return (
                    <Col key={card.id} xs={6} md={4} lg={2}>
                      <GameCard 
                        card={card}
                        size="medium"
                        showMisfortuneIndex={true}
                        showImageAuthor={true}
                        onClick={() => handleImageClick(getImageUrl(card.image_url), card.name, card.image_author)}
                        className="border-primary"
                        imageStyle={{ height: '60px', objectFit: 'cover', cursor: 'pointer' }}
                        style={{ cursor: 'pointer', width: '100%' }}
                        titleClassName="mb-1"
                      />
                    </Col>
                  );
                })
              ) : (
                <Col>
                  <div className="text-muted text-center p-3 border rounded">
                    Initial cards data not available
                  </div>
                </Col>
              )}
            </Row>
          </div>

          {/* Rounds Section */}
          {game.rounds && game.rounds.length > 0 && (
            <div className="mb-3">
              <h6 className="text-primary mb-2">
                Rounds Played
              </h6>
              
              <Row className="g-2">
                {game.rounds.map((round) => {
                  // Use the card object from the round
                  const card = round.card;
                  
                  // Skip if card data is not available
                  if (!card) {
                    console.warn('Card data missing for round:', round);
                    return null;
                  }
                  
                  const isWon = round.player_guess_position === round.correct_position;
                  const wasTimedOut = !round.player_guess_position && round.player_guess_position !== 0;
                  
                  return (
                    <Col key={round.id} xs={6} md={4} lg={2}>
                      <div className={`h-100 border rounded ${isWon ? 'border-success' : 'border-danger'}`}>
                        {/* Round Header */}
                        <div className={`text-center ${isWon ? 'bg-success' : 'bg-danger'} text-white py-1 rounded-top`}>
                          <div>
                            <strong>R{round.round_number}</strong>
                            <span className="ms-1">{getRoundResult(round)}</span>
                          </div>
                        </div>
                        
                        {/* Game Card */}
                        <div className="p-1">
                          <GameCard 
                            card={card}
                            size="medium"
                            showMisfortuneIndex={true}
                            showImageAuthor={true}
                            onClick={() => handleImageClick(getImageUrl(card.image_url), card.name, card.image_author)}
                            className="mb-2"
                            style={{ width: '100%' }}
                            imageStyle={{ height: '60px', cursor: 'pointer' }}
                            bodyClassName="p-1"
                            titleClassName="mb-1"
                          />
                          
                          {/* Correct vs guessed position */}
                          <div className="px-1 pb-1">
                            <div><strong>Correct:</strong> Pos. {round.correct_position + 1}</div>
                            {wasTimedOut ? (
                              <div><strong>Guess:</strong> <span className="text-warning">Timeout</span></div>
                            ) : (
                              <div><strong>Guess:</strong> Pos. {(round.player_guess_position || 0) + 1}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          )}
        </Accordion.Body>
      </Accordion.Item>
    );
  };

  if (gamesLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 text-center text-light">
        <div>
          <Spinner animation="border" variant="primary" className="mb-3" />
          <h4>Loading your game history...</h4>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">      
      <div className="flex-grow-1">
        <Container className="py-4">
          {/* Page Header */}
          <div className="text-center">
            <h1 className="display-4 text-primary mb-2">Game History</h1>
            <p className="lead text-light">
              Track your progress and review past games
            </p>
          </div>

          {/* Statistics Summary */}
          {games.length > 0 && (
            <Row className="mb-4">
              <Col>
                <Card className="bg-primary text-white">
                  <Card.Body>
                    <Row className="text-center">
                      <Col md={3}>
                        <h3 className="mb-0">{games.length}</h3>
                        <small>Total Games</small>
                      </Col>
                      <Col md={3}>
                        <h3 className="mb-0">{games.filter(g => g.status === 'won').length}</h3>
                        <small>Games Won</small>
                      </Col>
                      <Col md={3}>
                        <h3 className="mb-0">{games.filter(g => g.status === 'lost').length}</h3>
                        <small>Games Lost</small>
                      </Col>
                      <Col md={3}>
                        <h3 className="mb-0">
                          {games.length > 0 ? 
                            Math.round((games.filter(g => g.status === 'won').length / games.length) * 100) : 0}%
                        </h3>
                        <small>Win Rate</small>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Games List */}
          {games.length > 0 ? (
            <Row>
              <Col>
                <Card>
                  <Card.Header className="bg-light">
                    <h4 className="mb-0 text-dark ">Your Games</h4>
                    <small className="text-muted">
                      Ordered by most recent first
                    </small>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <Accordion flush>
                      {games.map((game, index) => renderGameCard(game, index))}
                    </Accordion>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ) : (
            <Row>
              <Col>
                <Card className="text-center py-5">
                  <Card.Body>
                    <h3 className="mb-3">No Games Yet</h3>
                    <p className="mb-4">
                      You haven't completed any games yet. Start playing to see your game history here!
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Container>
      </div>

      {/* Image Modal */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)} 
        size="lg" 
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{modalImage.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-0">
          <img 
            src={modalImage.src} 
            alt={modalImage.title}
            style={{ 
              width: '100%', 
              height: 'auto',
              maxHeight: '70vh',
              objectFit: 'contain'
            }}
          />
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <small className="text-muted">
            Image by: {modalImage.author || 'Unknown'}
          </small>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default History;
