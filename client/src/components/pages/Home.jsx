import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router';

function Home() {
  return (
    <div className="bg-gradient">
      {/* Hero Section */}
      <section className="py-5 hero-glow">
          <Container>
            <Row className="justify-content-center text-center">
              <Col lg={8}>
                <h1 className="display-2 fw-bold mb-3 hero-title text-light">
                  Game of Misfortune
                </h1>
                <h2 className="h3 text-info mb-4">
                  When AI Becomes Our Reality
                </h2>
                <p className="lead text-light">
                  Navigate the existential maze of artificial intelligence gone crazy. 
                  From surveillance dystopias to consciousness uploads, from algorithmic bias to human obsolescence.
                  <br />
                  <em className="text-warning">What happens when the machines we build reshape the very meaning of existence?</em>
                </p>
              </Col>
            </Row>
          </Container>
        </section>

        {/* Play button */}
        <Container className="mb-5">
          <Row className="justify-content-center">
            <Col md={8} className="text-center">
              <div className="d-grid d-md-block gap-3">
                <Button 
                  as={Link} 
                  to="/game"
                  variant="primary" 
                  size="lg" 
                  className="me-md-3 mb-3 px-5 rounded-pill shadow hover-lift"
                >
                  Play
                </Button>
              </div>
              <p className="mt-4 text-muted">
                <small className="text-light">
                  💾 Registered users can play full games and track their history of existential encounters
                </small>
              </p>
            </Col>
          </Row>
        </Container>

        {/* Game Description */}
        <Container className="my-5">
          <Row className="justify-content-center">
            <Col lg={10}>
              <Card className="shadow-lg border-primary game-card">
                <Card.Body className="p-5">
                  <Row>
                    <Col md={6}>
                      <h3 className="mb-4 text-primary">🎮 How to Play</h3>
                      <p className="text-light mb-3">
                        The game is single-player and simple to understand!
                      </p>
                      <div className="d-grid gap-3">
                        <div className="p-3 bg-dark rounded border-start border-info border-3">
                          <strong className="text-info">🎯 Objective:</strong> <span className="text-light">Collect 6 cards representing AI-driven existential scenarios</span>
                        </div>
                        <div className="p-3 bg-dark rounded border-start border-warning border-3">
                          <strong className="text-warning">⏰ Each Round:</strong> <span className="text-light">You have 30 seconds to place a new scenario among your existing cards</span>
                        </div>
                        <div className="p-3 bg-dark rounded border-start border-primary border-3">
                          <strong className="text-primary">📊 Strategy:</strong> <span className="text-light">Cards are ranked by "misfortune index" from 1-100</span>
                        </div>
                        <div className="p-3 bg-dark rounded border-start border-success border-3">
                          <strong className="text-success">🏆 Victory:</strong> <span className="text-light">Correctly place scenarios to reach 6 cards</span>
                        </div>
                        <div className="p-3 bg-dark rounded border-start border-danger border-3">
                          <strong className="text-danger">💀 Defeat:</strong> <span className="text-light">Three wrong placements end the game</span>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <h3 className="mb-4 text-warning">🤖 The AI Scenarios</h3>
                      <p className="text-light mb-3">
                        Experience the spectrum of AI-induced existential dread:
                      </p>
                      <ul className="list-unstyled">
                        <li className="mb-2 p-2 bg-dark rounded">
                          <strong className="text-danger">Surveillance States:</strong> <span className="text-light">When privacy becomes extinct</span>
                        </li>
                        <li className="mb-2 p-2 bg-dark rounded">
                          <strong className="text-warning">Human Obsolescence:</strong> <span className="text-light">The day machines surpass us</span>
                        </li>
                        <li className="mb-2 p-2 bg-dark rounded">
                          <strong className="text-info">Consciousness Upload:</strong> <span className="text-light">Digital immortality or endless pain?</span>
                        </li>
                        <li className="mb-2 p-2 bg-dark rounded">
                          <strong className="text-primary">Algorithmic Control:</strong> <span className="text-light">When code decides your fate</span>
                        </li>
                        <li className="mb-2 p-2 bg-dark rounded">
                          <strong className="text-secondary">Post-Human Society:</strong> <span className="text-light">The end of humanity as we know it</span>
                        </li>
                      </ul>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
    </div>
  );
}

export default Home;
