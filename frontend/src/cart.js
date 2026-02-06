import api from './api';

function getOrCreateCustomerId() {
  let id = localStorage.getItem('customerId');
  if (!id) {
    id = 'guest_' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem('customerId', id);
  }
  return id;
}

async function getCart() {
  const customerId = getOrCreateCustomerId();
  const res = await api.get(`/api/v1/cart/${customerId}`);
  return res.data; // may be null
}

async function createOrReplaceCart(payload) {
  const customerId = getOrCreateCustomerId();
  const res = await api.post(`/api/v1/cart/${customerId}`, payload);
  return res.data;
}

async function addOrUpdateItem(product, quantity) {
  const customerId = getOrCreateCustomerId();
  const payload = {
    productId: product.id,
    name: product.name,
    price: product.price,
    quantity
  };
  const res = await api.put(`/api/v1/cart/${customerId}/items`, payload);
  return res.data;
}

async function removeItem(productId) {
  const customerId = getOrCreateCustomerId();
  const res = await api.delete(`/api/v1/cart/${customerId}/items/${productId}`);
  return res.data;
}

async function applyCoupon(code, discount = 0) {
  const customerId = getOrCreateCustomerId();
  const res = await api.post(`/api/v1/cart/${customerId}/coupons`, { code, discount });
  return res.data;
}

async function removeCoupon(code) {
  const customerId = getOrCreateCustomerId();
  const res = await api.delete(`/api/v1/cart/${customerId}/coupons/${code}`);
  return res.data;
}

async function setAddress(address) {
  const customerId = getOrCreateCustomerId();
  const res = await api.put(`/api/v1/cart/${customerId}/address`, address);
  return res.data;
}

async function setPaymentMethod(paymentMethod) {
  const customerId = getOrCreateCustomerId();
  const res = await api.put(`/api/v1/cart/${customerId}/payment`, paymentMethod);
  return res.data;
}

async function clearCart() {
  const customerId = getOrCreateCustomerId();
  const res = await api.post(`/api/v1/cart/${customerId}/clear`);
  return res.data;
}

function cartCount(cart) {
  if (!cart || !Array.isArray(cart.items)) return 0;
  return cart.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
}

export default {
  getOrCreateCustomerId,
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
