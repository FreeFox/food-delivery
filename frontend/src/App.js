import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import auth from './auth';
import HomePage from './pages/HomePage';
import ProductDetail from './pages/ProductDetail';
import Header from './components/Header';
import CartDrawer from './CartDrawer';
import LoginModal from './LoginModal';
import { useDisclosure, useToast } from '@chakra-ui/react';
import cartApi from './cart';

function App() {
  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated());
  const [user, setUser] = useState(auth.getUserInfo());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isOpen: isLoginOpen, onOpen: onLoginOpen, onClose: onLoginClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    // Load cart on mount
    const loadCart = async () => {
      try {
        const existingCart = await cartApi.getCart();
        setCart(existingCart);
        setCartCount(cartApi.cartCount(existingCart));
      } catch (e) {
        console.warn('Unable to fetch cart:', e);
      }
    };
    loadCart();
  }, []);

  const handleLogout = () => {
    auth.logout();
    setIsAuthenticated(false);
    setUser(null);
    setCart(null);
    setCartCount(0);
  };

  return (
    <Router>
      <Box bg="gray.50" minH="100vh">
        <Header
          isAuthenticated={isAuthenticated}
          user={user}
          onLoginOpen={onLoginOpen}
          onCartOpen={() => setIsCartOpen(true)}
          onLogout={handleLogout}
          cartCount={cartCount}
        />

        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                cart={cart}
                setCart={setCart}
                setCartCount={setCartCount}
                isAuthenticated={isAuthenticated}
                setIsAuthenticated={setIsAuthenticated}
                user={user}
                setUser={setUser}
              />
            }
          />
          <Route
            path="/product/:productId"
            element={
              <ProductDetail
                cart={cart}
                setCart={setCart}
                setCartCount={setCartCount}
              />
            }
          />
        </Routes>

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          setCart={setCart}
          setCartCount={setCartCount}
        />
        <LoginModal
          isOpen={isLoginOpen}
          onClose={onLoginClose}
          onLoginSuccess={(user) => {
            setIsAuthenticated(true);
            setUser(user);
            onLoginClose();
            toast({ title: `Welcome, ${user.email}!`, status: 'success', duration: 2000 });
          }}
        />
      </Box>
    </Router>
  );
}

export default App;
