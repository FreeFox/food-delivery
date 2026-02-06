import React, { useState } from 'react';
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  VStack,
  HStack,
  Text,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  Divider,
  Box,
  useToast
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import cartApi from './cart';

export default function CartDrawer({ isOpen, onClose, cart, setCart, setCartCount }) {
  const [couponCode, setCouponCode] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [paymentInput, setPaymentInput] = useState('');
  const toast = useToast();

  const subtotal = (c) => {
    if (!c || !Array.isArray(c.items)) return 0;
    return c.items.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
  };

  const updateQty = async (product, qty) => {
    try {
      if (qty <= 0) {
        const updated = await cartApi.removeItem(product.productId || product.id);
        setCart(updated);
        setCartCount(cartApi.cartCount(updated));
        return;
      }
      const updated = await cartApi.addOrUpdateItem({ id: product.productId || product.id, name: product.name, price: product.price }, qty);
      setCart(updated);
      setCartCount(cartApi.cartCount(updated));
    } catch (e) {
      console.error('Update qty failed', e);
      toast({ title: 'Unable to update item', status: 'error', duration: 2000, isClosable: true });
    }
  };

  const remove = async (productId) => {
    try {
      const updated = await cartApi.removeItem(productId);
      setCart(updated);
      setCartCount(cartApi.cartCount(updated));
    } catch (e) {
      console.error('Remove failed', e);
      toast({ title: 'Unable to remove item', status: 'error', duration: 2000, isClosable: true });
    }
  };

  const applyCoupon = async () => {
    if (!couponCode) return;
    try {
      const updated = await cartApi.applyCoupon(couponCode, 0);
      setCart(updated);
      setCartCount(cartApi.cartCount(updated));
      setCouponCode('');
      toast({ title: 'Coupon applied', status: 'success', duration: 1500 });
    } catch (e) {
      console.error(e);
      toast({ title: 'Unable to apply coupon', status: 'error', duration: 2000 });
    }
  };

  const saveAddress = async () => {
    try {
      const addr = { text: addressInput };
      const updated = await cartApi.setAddress(addr);
      setCart(updated);
      setCartCount(cartApi.cartCount(updated));
      toast({ title: 'Address saved', status: 'success', duration: 1500 });
    } catch (e) {
      console.error(e);
      toast({ title: 'Unable to save address', status: 'error', duration: 2000 });
    }
  };

  const savePayment = async () => {
    try {
      const pm = { method: paymentInput };
      const updated = await cartApi.setPaymentMethod(pm);
      setCart(updated);
      setCartCount(cartApi.cartCount(updated));
      toast({ title: 'Payment saved', status: 'success', duration: 1500 });
    } catch (e) {
      console.error(e);
      toast({ title: 'Unable to save payment', status: 'error', duration: 2000 });
    }
  };

  const clearAll = async () => {
    try {
      const updated = await cartApi.clearCart();
      setCart(updated);
      setCartCount(cartApi.cartCount(updated));
      toast({ title: 'Cart cleared', status: 'info', duration: 1500 });
    } catch (e) {
      console.error(e);
      toast({ title: 'Unable to clear cart', status: 'error', duration: 2000 });
    }
  };

  const checkout = async () => {
    // For now: simulate checkout by clearing cart
    try {
      await clearAll();
      toast({ title: 'Checkout complete (demo)', status: 'success', duration: 2000 });
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="sm">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader>Your Cart</DrawerHeader>
        <DrawerBody>
          <VStack align="stretch" spacing={4}>
            {(!cart || !cart.items || cart.items.length === 0) && (
              <Text>No items in cart.</Text>
            )}
            {cart && cart.items && cart.items.map((item) => (
              <Box key={item.productId || item.id} borderWidth="1px" borderRadius="md" p={3}>
                <HStack justify="space-between" align="start">
                  <VStack align="start">
                    <Text fontWeight="bold">{item.name}</Text>
                    <Text fontSize="sm">${item.price}</Text>
                  </VStack>
                  <VStack>
                    <NumberInput size="sm" maxW="100px" value={item.quantity} min={0} onChange={(v) => updateQty(item, Number(v))}>
                      <NumberInputField />
                    </NumberInput>
                    <IconButton aria-label="Remove" icon={<DeleteIcon />} size="sm" onClick={() => remove(item.productId || item.id)} />
                  </VStack>
                </HStack>
              </Box>
            ))}

            <Divider />

            <Box>
              <Text fontWeight="bold">Coupons</Text>
              {cart && cart.coupons && cart.coupons.length > 0 ? (
                cart.coupons.map((c) => <HStack key={c.code}><Text>{c.code}</Text></HStack>)
              ) : (
                <Text fontSize="sm">No coupons</Text>
              )}
              <HStack mt={2}>
                <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                <Button size="sm" onClick={applyCoupon}>Apply</Button>
              </HStack>
            </Box>

            <Divider />

            <Box>
              <Text fontWeight="bold">Delivery Address</Text>
              <Text fontSize="sm">{cart && cart.address ? JSON.stringify(cart.address) : 'No address set'}</Text>
              <HStack mt={2}>
                <Input placeholder="Address" value={addressInput} onChange={(e) => setAddressInput(e.target.value)} />
                <Button size="sm" onClick={saveAddress}>Save</Button>
              </HStack>
            </Box>

            <Divider />

            <Box>
              <Text fontWeight="bold">Payment Method</Text>
              <Text fontSize="sm">{cart && cart.paymentMethod ? JSON.stringify(cart.paymentMethod) : 'No payment method'}</Text>
              <HStack mt={2}>
                <Input placeholder="Card / Method" value={paymentInput} onChange={(e) => setPaymentInput(e.target.value)} />
                <Button size="sm" onClick={savePayment}>Save</Button>
              </HStack>
            </Box>

            <Divider />

            <Box>
              <Text fontWeight="bold">Subtotal: ${subtotal(cart).toFixed(2)}</Text>
            </Box>

          </VStack>
        </DrawerBody>
        <DrawerFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={clearAll}>Clear</Button>
            <Button colorScheme="green" onClick={checkout}>Checkout</Button>
          </HStack>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
