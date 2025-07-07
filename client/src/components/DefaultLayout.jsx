import { Container, Row, Alert } from 'react-bootstrap';
import { Outlet } from 'react-router';
import Header from './Header';
import Footer from './Footer';

function DefaultLayout({ message, setMessage, handleLogout, loggedIn }) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header loggedIn={loggedIn} handleLogout={handleLogout} />
      
      <main className="flex-grow-1" style={{ paddingTop: '76px' }}>
        <Container fluid className="mt-3">
          {message && (
            <Row>
              <Alert 
                variant={message.type} 
                onClose={() => setMessage('')} 
                dismissible
              >
                {message.msg}
              </Alert>
            </Row>
          )}
          <Outlet />
        </Container>
      </main>

      <Footer />
    </div>
  );
}

export default DefaultLayout;
