import { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

function Login({ handleLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    
    try {
      await handleLogin({
        username: formData.username,
        password: formData.password
      });
    } catch (error) {
      // Error will be handled by DefaultLayout through handleLogin
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: 'white' }}>🔐 Login</h2>
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label className='text-light'>Username</Form.Label>
          <Form.Control
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className='text-light'>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            required
            minLength={6}
          />
        </Form.Group>

        {/* Login button */}
        <Button
          variant="primary"
          type="submit"
          disabled={isLoading}
          className="w-100 mb-3"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </Form>
    </div>
  );
}

export default Login;
