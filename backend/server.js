const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Mock restaurant data
const restaurantData = {
  name: 'Delicious Eats',
  cuisine: 'International',
  rating: 4.8,
  reviews: 342,
  deliveryTime: '30-45 mins',
  image: 'https://placehold.co/1200x400?text=Delicious+Eats'
};

const categories = [
  { id: 1, name: 'Appetizers', icon: '🥗' },
  { id: 2, name: 'Main Courses', icon: '🍔' },
  { id: 3, name: 'Desserts', icon: '🍰' },
  { id: 4, name: 'Beverages', icon: '🍹' }
];

const featuredProducts = [
  { id: 1, name: 'Burger Deluxe', price: 12.99, rating: 4.7, category: 2, image: 'https://placehold.co/300x200?text=Burger' },
  { id: 2, name: 'Caesar Salad', price: 8.99, rating: 4.5, category: 1, image: 'https://placehold.co/300x200?text=Salad' },
  { id: 3, name: 'Chocolate Cake', price: 6.99, rating: 4.9, category: 3, image: 'https://placehold.co/300x200?text=Cake' },
  { id: 4, name: 'Fresh Orange Juice', price: 4.99, rating: 4.6, category: 4, image: 'https://placehold.co/300x200?text=Juice' }
];

// Routes
app.get('/api/v1/restaurant', (req, res) => {
  res.json(restaurantData);
});

app.get('/api/v1/categories', (req, res) => {
  res.json(categories);
});

app.get('/api/v1/products', (req, res) => {
  res.json(featuredProducts);
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// In-memory carts store (keyed by customerId)
const carts = {};

// Helper: ensure cart exists
function ensureCart(customerId) {
  if (!carts[customerId]) {
    carts[customerId] = {
      customerId,
      items: [], // { productId, name, price, quantity }
      coupons: [], // { code, discount }
      address: null,
      paymentMethod: null,
      updatedAt: new Date().toISOString()
    };
  }
  return carts[customerId];
}

// Get cart
app.get('/api/v1/cart/:customerId', (req, res) => {
  const { customerId } = req.params;
  const cart = carts[customerId] || null;
  res.json(cart);
});

// Replace/Create cart (full)
app.post('/api/v1/cart/:customerId', (req, res) => {
  const { customerId } = req.params;
  const payload = req.body || {};
  const cart = ensureCart(customerId);
  cart.items = Array.isArray(payload.items) ? payload.items : cart.items;
  cart.coupons = Array.isArray(payload.coupons) ? payload.coupons : cart.coupons;
  cart.address = payload.address || cart.address;
  cart.paymentMethod = payload.paymentMethod || cart.paymentMethod;
  cart.updatedAt = new Date().toISOString();
  res.status(201).json(cart);
});

// Add or update item (upsert)
app.put('/api/v1/cart/:customerId/items', (req, res) => {
  const { customerId } = req.params;
  const { productId, name, price, quantity } = req.body || {};
  if (!productId || typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ error: 'productId and positive numeric quantity are required' });
  }
  const cart = ensureCart(customerId);
  const existing = cart.items.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity = quantity;
    existing.price = price || existing.price;
    existing.name = name || existing.name;
  } else {
    cart.items.push({ productId, name: name || 'Item', price: price || 0, quantity });
  }
  cart.updatedAt = new Date().toISOString();
  res.json(cart);
});

// Remove item
app.delete('/api/v1/cart/:customerId/items/:productId', (req, res) => {
  const { customerId, productId } = req.params;
  const cart = ensureCart(customerId);
  cart.items = cart.items.filter((i) => String(i.productId) !== String(productId));
  cart.updatedAt = new Date().toISOString();
  res.json(cart);
});

// Apply coupon
app.post('/api/v1/cart/:customerId/coupons', (req, res) => {
  const { customerId } = req.params;
  const { code, discount } = req.body || {};
  if (!code) return res.status(400).json({ error: 'coupon code required' });
  const cart = ensureCart(customerId);
  if (!cart.coupons.find((c) => c.code === code)) {
    cart.coupons.push({ code, discount: discount || 0 });
  }
  cart.updatedAt = new Date().toISOString();
  res.json(cart);
});

// Remove coupon
app.delete('/api/v1/cart/:customerId/coupons/:code', (req, res) => {
  const { customerId, code } = req.params;
  const cart = ensureCart(customerId);
  cart.coupons = cart.coupons.filter((c) => c.code !== code);
  cart.updatedAt = new Date().toISOString();
  res.json(cart);
});

// Set address
app.put('/api/v1/cart/:customerId/address', (req, res) => {
  const { customerId } = req.params;
  const address = req.body || null;
  const cart = ensureCart(customerId);
  cart.address = address;
  cart.updatedAt = new Date().toISOString();
  res.json(cart);
});

// Set payment method
app.put('/api/v1/cart/:customerId/payment', (req, res) => {
  const { customerId } = req.params;
  const paymentMethod = req.body || null;
  const cart = ensureCart(customerId);
  cart.paymentMethod = paymentMethod;
  cart.updatedAt = new Date().toISOString();
  res.json(cart);
});

// Clear cart
app.post('/api/v1/cart/:customerId/clear', (req, res) => {
  const { customerId } = req.params;
  carts[customerId] = {
    customerId,
    items: [],
    coupons: [],
    address: null,
    paymentMethod: null,
    updatedAt: new Date().toISOString()
  };
  res.json(carts[customerId]);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
