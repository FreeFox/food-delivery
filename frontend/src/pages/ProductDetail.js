import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Button,
  HStack,
  VStack,
  Text,
  Heading,
  Image,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { StarIcon, ArrowBackIcon } from '@chakra-ui/icons';
import api from '../api';
import cartApi from '../cart';

export default function ProductDetail({ cart, setCart, setCartCount }) {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const toast = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get('/api/v1/products');
        const products = Array.isArray(res.data) ? res.data : [];
        const found = products.find((p) => String(p.id) === String(productId));
        if (found) {
          setProduct(found);
        } else {
          toast({ title: 'Product not found', status: 'error', duration: 2000 });
          navigate('/');
        }
      } catch (e) {
        console.error('Failed to fetch product', e);
        toast({ title: 'Failed to load product', status: 'error', duration: 2000 });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, navigate, toast]);

  const handleAddToCart = async () => {
    if (quantity <= 0) {
      toast({ title: 'Quantity must be at least 1', status: 'warning', duration: 2000 });
      return;
    }

    try {
      const existingQty =
        (cart && cart.items && cart.items.find((i) => String(i.productId) === String(product.id))?.quantity) || 0;
      const updatedCart = await cartApi.addOrUpdateItem(product, Number(existingQty) + Number(quantity));
      setCart(updatedCart);
      setCartCount(cartApi.cartCount(updatedCart));
      toast({ title: 'Added to cart', status: 'success', duration: 1500, isClosable: true });
      setQuantity(1);
    } catch (e) {
      console.error('Add to cart failed', e);
      toast({ title: 'Unable to add to cart', status: 'error', duration: 2000, isClosable: true });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (!product) {
    return (
      <Container maxW="container.lg" py={12}>
        <Text>Product not found</Text>
      </Container>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh" py={12}>
      <Container maxW="container.lg">
        <Button leftIcon={<ArrowBackIcon />} mb={6} onClick={() => navigate('/')}>
          Back to Home
        </Button>

        <Box bg="white" borderRadius="lg" overflow="hidden" boxShadow="md">
          <HStack align="start" spacing={8}>
            {/* Product Image */}
            <Box flex="1" minH="400px">
              <Image
                src={product.image}
                alt={product.name}
                w="100%"
                h="100%"
                objectFit="cover"
              />
            </Box>

            {/* Product Info */}
            <VStack align="start" flex="1" spacing={4} p={6}>
              <Heading size="xl">{product.name}</Heading>

              <HStack>
                <StarIcon color="orange.400" />
                <Text fontSize="lg">{product.rating}</Text>
                <Text fontSize="sm" color="gray.600">
                  {product.reviews || 0} reviews
                </Text>
              </HStack>

              <Text fontSize="2xl" fontWeight="bold" color="red.500">
                ${product.price}
              </Text>

              {product.description && (
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Description
                  </Text>
                  <Text color="gray.700">{product.description}</Text>
                </Box>
              )}

              <Box w="100%">
                <Text fontWeight="bold" mb={2}>
                  Quantity
                </Text>
                <HStack>
                  <Button
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <Box
                    borderWidth="1px"
                    borderRadius="md"
                    px={4}
                    py={2}
                    minW="60px"
                    textAlign="center"
                  >
                    {quantity}
                  </Box>
                  <Button size="sm" onClick={() => setQuantity(quantity + 1)}>
                    +
                  </Button>
                </HStack>
              </Box>

              <Button
                w="100%"
                colorScheme="red"
                size="lg"
                onClick={handleAddToCart}
              >
                Add to Cart
              </Button>

              {product.category && (
                <Box w="100%" borderTop="1px solid" borderColor="gray.200" pt={4}>
                  <Text fontSize="sm" color="gray.600">
                    Category: <Text as="span" fontWeight="bold">{product.category}</Text>
                  </Text>
                </Box>
              )}
            </VStack>
          </HStack>
        </Box>
      </Container>
    </Box>
  );
}
