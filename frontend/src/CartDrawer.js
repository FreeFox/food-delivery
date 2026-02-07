import { useState } from 'react';
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
  Divider,
  useToast
} from '@chakra-ui/react';
import cartApi from './cart';
import CartItems from './components/checkout/CartItems';
import CouponsSection from './components/checkout/CouponsSection';
import AddressForm from './components/checkout/AddressForm';
import PaymentSelector from './components/checkout/PaymentSelector';
import CartSummary from './components/checkout/CartSummary';

export default function CartDrawer({ isOpen, onClose, cart, setCart, setCartCount }) {
  const [couponCode, setCouponCode] = useState('');
  const [addressForm, setAddressForm] = useState({
    country: 'Ukraine',
    city: '',
    street: '',
    number: '',
    apartment: '',
    entrance: '',
    floor: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('Credit card');
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
    if (!addressForm.city || !addressForm.street || !addressForm.number) {
      toast({ title: 'Please fill City, Street, and Number', status: 'warning', duration: 2000 });
      return;
    }
    try {
      const updated = await cartApi.setAddress(addressForm);
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
      const pm = { method: paymentMethod };
      const updated = await cartApi.setPaymentMethod(pm);
      setCart(updated);
      setCartCount(cartApi.cartCount(updated));
      toast({ title: 'Payment method saved', status: 'success', duration: 1500 });
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
    // Validate required checkout info
    if (!cart || !cart.items || cart.items.length === 0) {
      toast({ title: 'Cart is empty', status: 'warning', duration: 2000 });
      return;
    }
    if (!cart.address) {
      toast({ title: 'Please set delivery address', status: 'warning', duration: 2000 });
      return;
    }
    if (!cart.paymentMethod) {
      toast({ title: 'Please select payment method', status: 'warning', duration: 2000 });
      return;
    }

    try {
      await clearAll();
      toast({ title: 'Checkout complete (demo)', status: 'success', duration: 2000 });
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader>Your Cart</DrawerHeader>
        <DrawerBody>
          <VStack align="stretch" spacing={4}>
            <CartItems items={cart?.items} onUpdateQty={updateQty} onRemove={remove} />
            <Divider />
            <CouponsSection
              coupons={cart?.coupons}
              couponCode={couponCode}
              onCouponCodeChange={setCouponCode}
              onApplyCoupon={applyCoupon}
            />
            <Divider />
            <AddressForm
              savedAddress={cart?.address}
              addressForm={addressForm}
              onAddressChange={setAddressForm}
              onSaveAddress={saveAddress}
            />
            <Divider />
            <PaymentSelector
              savedPayment={cart?.paymentMethod}
              paymentMethod={paymentMethod}
              onPaymentChange={setPaymentMethod}
              onSavePayment={savePayment}
            />
            <Divider />
            <CartSummary subtotal={subtotal(cart)} />
          </VStack>
        </DrawerBody>
        <DrawerFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={clearAll}>
              Clear
            </Button>
            <Button colorScheme="green" onClick={checkout}>
              Checkout
            </Button>
          </HStack>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
