import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router';

function Header({ loggedIn, handleLogout }) {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm border-bottom border-primary" fixed="top">
      <Container fluid className="px-3">
        {/* Home Button */}
        <Link to ="/" className="navbar-brand d-flex align-items-center text-primary">
          <span className="me-2">🤖</span>
          Game of Misfortune
        </Link>
        
        <Navbar.Collapse id="navbar-nav">
          {/* Right side navigation */}
          <Nav className="ms-auto d-flex align-items-center">
            {/* History button */}
            <Nav.Link 
              as={loggedIn ? Link : 'span'} 
              to={loggedIn ? "/history" : undefined}
              className={`me-3 hover-lift text-info`}
              style={{ cursor: loggedIn ? 'pointer' : 'not-allowed' }}
            >
              📊 Game History
            </Nav.Link>
            
            {/* Login/User section */}
            {loggedIn ? (
              <div className="d-flex align-items-center">
                <span className="text-light me-3">
                  You're logged in
                </span>
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  className="rounded-pill px-3"
                  onClick={handleLogout}
                >
                  🚪 Logout
                </Button>
              </div>
            ) : (
              <Button 
                as={Link} // It looks like a button, but it behaves like a link
                to="/login" 
                variant="outline-primary" 
                size="sm" 
                className="rounded-pill px-4 hover-lift"
              >
                🔐 Login
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
