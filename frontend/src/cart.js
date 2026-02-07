import api from './api';
import auth from './auth';

// Get or create a guest ID for unauthenticated users
function getOrCreateGuestId() {
  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem('guestId', guestId);
  }
  return guestId;
}

// Add token to all API requests if authenticated
api.interceptors.request.use((config) => {
  const token = auth.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // For guest users, add guestId to request
    if (config.method === 'post' || config.method === 'put') {
      config.data = config.data || {};
      config.data.guestId = getOrCreateGuestId();
    }
  }
  return config;
});

async function getCart() {
  const res = await api.get(`/api/v1/cart?guestId=${getOrCreateGuestId()}`);
  return res.data;
}

async function createOrReplaceCart(payload) {
  const res = await api.post('/api/v1/cart', { ...payload, guestId: getOrCreateGuestId() });
  return res.data;
}

async function addOrUpdateItem(product, quantity) {
  const payload = {
    productId: product.id,
    name: product.name,
    price: product.price,
    quantity,
    guestId: getOrCreateGuestId()
  };
  const res = await api.put('/api/v1/cart/items', payload);
  return res.data;
}

async function removeItem(productId) {
  const res = await api.delete(`/api/v1/cart/items/${productId}?guestId=${getOrCreateGuestId()}`);
  return res.data;
}

async function applyCoupon(code, discount = 0) {
  const res = await api.post('/api/v1/cart/coupons', { code, discount, guestId: getOrCreateGuestId() });
  return res.data;
}

async function removeCoupon(code) {
  const res = await api.delete(`/api/v1/cart/coupons/${code}?guestId=${getOrCreateGuestId()}`);
  return res.data;
}

async function setAddress(address) {
  const res = await api.put('/api/v1/cart/address', { ...address, guestId: getOrCreateGuestId() });
  return res.data;
}

async function setPaymentMethod(paymentMethod) {
  const res = await api.put('/api/v1/cart/payment', { ...paymentMethod, guestId: getOrCreateGuestId() });
  return res.data;
}

async function clearCart() {
  const res = await api.post('/api/v1/cart/clear', { guestId: getOrCreateGuestId() });
  return res.data;
}

function cartCount(cart) {
  if (!cart || !Array.isArray(cart.items)) return 0;
  return cart.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
}

export default {
  getOrCreateGuestId,
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
