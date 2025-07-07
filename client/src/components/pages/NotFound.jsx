import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router';
import dayjs from 'dayjs';

function NotFound() {
  return (
    <div className="bg-gradient d-flex align-items-center justify-content-center" style={{ minHeight: '50vh' }}>
      <Container>
        <Row className="justify-content-center text-center">
          <Col lg={8}>
              <div className="hero-glow py-5">
                {/* 404 Error Display */}
                <h1 className="display-1 fw-bold mb-3 hero-title text-light">
                  404
                </h1>
                <h2 className="h2 text-info mb-4">
                  Page Not Found
                </h2>
                <p className="lead text-light mb-4">
                  The AI has encountered an existential paradox. The page you're looking for has been 
                  consumed by the digital void, lost in the infinite loops of machine consciousness.
                </p>

                <Card className="shadow-lg border-warning game-card">
                    <Card.Body className="p-4">
                    <Row className="align-items-center">
                        <Col md={8} className="text-start">
                        <h5 className="text-warning mb-2">🎮 Escape Through Gaming</h5>
                        <p className="text-light small mb-0">
                            Sometimes the only way out of a digital maze is to play the game.
                            Face your existential fears head-on.
                        </p>
                        </Col>
                        <Col md={4} className="text-end">
                        <Button 
                            as={Link} 
                            to="/game"
                            variant="warning" 
                            size="lg" 
                            className="px-4 rounded-pill shadow hover-lift"
                        >
                            Play Game
                        </Button>
                        </Col>
                    </Row>
                    </Card.Body>
                </Card>

                {/* Error Code Message */}
                <div className="mt-5">
                  <small className="text-muted">
                    <code className="text-info">
                      TIMESTAMP: {dayjs().toISOString()} | 
                      STATUS: REALITY_UNCERTAIN
                    </code>
                  </small>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
    </div>
  );
}

export default NotFound;
