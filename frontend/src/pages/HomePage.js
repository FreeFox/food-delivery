import { useState, useEffect } from 'react';
import { Box, Container, Spinner, useToast } from '@chakra-ui/react';
import api from '../api';
import cartApi from '../cart';
import HeroBanner from '../components/HeroBanner';
import CategoriesGrid from '../components/CategoriesGrid';
import ProductsGrid from '../components/ProductsGrid';

export default function HomePage({
  cart,
  setCart,
  setCartCount
}) {
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resRes, catRes, prodRes] = await Promise.all([
          api.get('/api/v1/restaurant'),
          api.get('/api/v1/categories'),
          api.get('/api/v1/products')
        ]);
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
  }, [setCart, setCartCount]);

  const handleAddToCart = async (product) => {
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
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" h="100vh">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <>
      <HeroBanner restaurant={restaurant} />

      <Container maxW="container.lg" pb={12}>
        <CategoriesGrid categories={categories} />
        <ProductsGrid products={products} cart={cart} onAddToCart={handleAddToCart} />
      </Container>
    </>
  );
}
