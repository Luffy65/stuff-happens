// React Imports
import { Routes, Route, Navigate, useNavigate } from 'react-router';
import { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

// APIs
import { logIn, logOut, getUserInfo } from './API.mjs';

// Components
import DefaultLayout from './components/DefaultLayout';
import Home from './components/pages/Home';
import Game from './components/pages/Game';
import History from './components/pages/History';
import NotFound from './components/pages/NotFound';
import Login from './components/Login';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate(); // Only for the logout

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getUserInfo();
        if (userData) {
          setLoggedIn(true);
          setUser(userData);
        } else {
          setLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setLoggedIn(false);
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const user = await logIn(credentials.username, credentials.password);
      setLoggedIn(true);
      setUser(user);
      setMessage({msg: `Welcome back, ${user.username}!`, type: 'success'});
      return user;
    } catch(err) {
      setMessage({msg: err.message || err, type: 'danger'});
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      setLoggedIn(false);
      setUser(null);
      setMessage('');
      navigate('/'); // Navigate to home page after logout
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
      <div className="App">
        <Routes>
          <Route path="/" element={<DefaultLayout message={message} setMessage={setMessage} handleLogout={handleLogout} loggedIn={loggedIn} />}>
            <Route index element={<Home />} /> {/* child route with no path */}
            <Route path="login" element={loggedIn ? <Navigate replace to="/" /> : <Login handleLogin={handleLogin} />} />
            <Route path="game" element={<Game loggedIn={loggedIn} />} />
            <Route path="history" element={ !loggedIn ? <Navigate replace to="/" /> : <History user={user} />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </div>
  );
}

export default App
