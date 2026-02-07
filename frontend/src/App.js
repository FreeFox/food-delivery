import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  Image,
  Stack,
  Text,
  Heading,
  HStack,
  VStack,
  Spinner,
  Icon,
  Flex,
  Badge,
  useToast,
  useDisclosure
} from '@chakra-ui/react';
import { StarIcon, TimeIcon, PhoneIcon } from '@chakra-ui/icons';
import api from './api';
import cartApi from './cart';
import CartDrawer from './CartDrawer';
import auth from './auth';
import LoginModal from './LoginModal';

function App() {
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const toast = useToast();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated());
  const [user, setUser] = useState(auth.getUserInfo());
  const { isOpen: isLoginOpen, onOpen: onLoginOpen, onClose: onLoginClose } = useDisclosure();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resRes, catRes, prodRes] = await Promise.all([
          api.get('/api/v1/restaurant'),
          api.get('/api/v1/categories'),
          api.get('/api/v1/products')
        ]);
        // Validate responses before setting state to avoid runtime errors
        const resData = resRes && typeof resRes.data === 'object' ? resRes.data : null;
        const cats = Array.isArray(catRes && catRes.data) ? catRes.data : [];
        const prods = Array.isArray(prodRes && prodRes.data) ? prodRes.data : [];

        if (!Array.isArray(catRes && catRes.data)) {
          console.warn('Expected /api/categories to return an array, got:', catRes && catRes.data);
        }
        if (!Array.isArray(prodRes && prodRes.data)) {
          console.warn('Expected /api/products to return an array, got:', prodRes && prodRes.data);
        }

        setRestaurant(resData);
        setCategories(cats);
        setProducts(prods);

        // Fetch cart (works for both authenticated users and guests)
        try {
          const existingCart = await cartApi.getCart();
          setCart(existingCart);
          setCartCount(cartApi.cartCount(existingCart));
        } catch (e) {
          console.warn('Unable to fetch cart:', e);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <>
      <Box bg="gray.50" minH="100vh">
      {/* Header */}
      <Box bg="white" boxShadow="sm" py={4} mb={8}>
        <Container maxW="container.lg">
          <HStack justify="space-between" align="center">
            <Heading size="lg" color="red.500">
              🍽️ Food Delivery
            </Heading>
            <HStack spacing={4}>
              {isAuthenticated ? (
                <>
                  <Text fontSize="sm">Hi, {user?.email}</Text>
                  <Button
                    colorScheme="red"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      auth.logout();
                      setIsAuthenticated(false);
                      setUser(null);
                      setCart(null);
                      setCartCount(0);
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button colorScheme="red" size="sm" variant="outline" onClick={onLoginOpen}>
                  Sign In
                </Button>
              )}
              <Button colorScheme="red" size="sm" onClick={() => setIsCartOpen(true)}>
                Cart ({cartCount})
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Hero Banner */}
      {restaurant && (
        <Box
          bgImage={restaurant.image}
          bgSize="cover"
          bgPos="center"
          h="400px"
          mb={8}
          position="relative"
          _after={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bg: 'blackAlpha.400'
          }}
        >
          <Container maxW="container.lg" h="full">
            <VStack
              h="full"
              justify="flex-end"
              align="start"
              pb={8}
              position="relative"
              zIndex={1}
            >
              <Heading size="2xl" color="white">
                {restaurant.name}
              </Heading>
              <Text color="white" fontSize="lg">
                {restaurant.cuisine} Cuisine
              </Text>
              <HStack spacing={6} color="white" wrap="wrap">
                <HStack>
                  <StarIcon />
                  <Text>{restaurant.rating} ({restaurant.reviews} reviews)</Text>
                </HStack>
                <HStack>
                  <TimeIcon />
                  <Text>{restaurant.deliveryTime}</Text>
                </HStack>
              </HStack>
            </VStack>
          </Container>
        </Box>
      )}

      <Container maxW="container.lg" pb={12}>
        {/* Categories */}
        <Box mb={12}>
          <Heading mb={6} size="lg">
            Categories
          </Heading>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            {categories.map((cat) => (
              <Card
                key={cat.id}
                cursor="pointer"
                _hover={{ boxShadow: 'lg', transform: 'translateY(-4px)' }}
                transition="all 0.3s"
                bg="white"
              >
                <CardBody>
                  <VStack spacing={2}>
                    <Text fontSize="3xl">{cat.icon}</Text>
                    <Text fontWeight="bold" textAlign="center">
                      {cat.name}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>

        {/* Featured Products */}
        <Box>
          <Heading mb={6} size="lg">
            Featured Items
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            {products.map((product) => (
              <Card
                key={product.id}
                bg="white"
                _hover={{ boxShadow: 'lg', transform: 'translateY(-4px)' }}
                transition="all 0.3s"
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  h="200px"
                  objectFit="cover"
                />
                <CardBody>
                  <Stack spacing={2}>
                    <Heading size="md">{product.name}</Heading>
                    <HStack>
                      <StarIcon color="orange.400" />
                      <Text fontSize="sm">{product.rating}</Text>
                    </HStack>
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="bold" fontSize="lg" color="red.500">
                        ${product.price}
                      </Text>
                      <Button
                        colorScheme="red"
                        size="sm"
                        onClick={async () => {
                          try {
                            const existingQty = (cart && cart.items && cart.items.find((i) => String(i.productId) === String(product.id))?.quantity) || 0;
                            const updatedCart = await cartApi.addOrUpdateItem(product, Number(existingQty) + 1);
                            setCart(updatedCart);
                            setCartCount(cartApi.cartCount(updatedCart));
                            toast({ title: 'Added to cart', status: 'success', duration: 1500, isClosable: true });
                          } catch (e) {
                            console.error('Add to cart failed', e);
                            toast({ title: 'Unable to add to cart', status: 'error', duration: 2000, isClosable: true });
                          }
                        }}
                      >
                        Add
                      </Button>
                    </Flex>
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>
      </Container>
      </Box>
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
    </>
  );
}

export default App;
