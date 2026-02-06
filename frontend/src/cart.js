import api from './api';
import auth from './auth';

// Add token to all API requests
api.interceptors.request.use((config) => {
  const token = auth.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function getCart() {
  const res = await api.get('/api/v1/cart');
  return res.data;
}

async function createOrReplaceCart(payload) {
  const res = await api.post('/api/v1/cart', payload);
  return res.data;
}

async function addOrUpdateItem(product, quantity) {
  const payload = {
    productId: product.id,
    name: product.name,
    price: product.price,
    quantity
  };
  const res = await api.put('/api/v1/cart/items', payload);
  return res.data;
}

async function removeItem(productId) {
  const res = await api.delete(`/api/v1/cart/items/${productId}`);
  return res.data;
}

async function applyCoupon(code, discount = 0) {
  const res = await api.post('/api/v1/cart/coupons', { code, discount });
  return res.data;
}

async function removeCoupon(code) {
  const res = await api.delete(`/api/v1/cart/coupons/${code}`);
  return res.data;
}

async function setAddress(address) {
  const res = await api.put('/api/v1/cart/address', address);
  return res.data;
}

async function setPaymentMethod(paymentMethod) {
  const res = await api.put('/api/v1/cart/payment', paymentMethod);
  return res.data;
}

async function clearCart() {
  const res = await api.post('/api/v1/cart/clear');
  return res.data;
}

function cartCount(cart) {
  if (!cart || !Array.isArray(cart.items)) return 0;
  return cart.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
}

export default {
  getCart,
  createOrReplaceCart,
  addOrUpdateItem,
  removeItem,
  applyCoupon,
  removeCoupon,
  setAddress,
  setPaymentMethod,
  clearCart,
  cartCount
};
