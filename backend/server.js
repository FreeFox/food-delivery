const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const redis = require('redis');

const app = express();

app.use(cors());
app.use(express.json());

// ===== CONFIG =====
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

// ===== REDIS CLIENT =====
const redisClient = redis.createClient({
  host: REDIS_HOST,
  port: REDIS_PORT
});

redisClient.on('error', (err) => console.log('Redis error:', err));
redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.connect().catch(console.error);

// ===== MOCK DATA =====
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

// In-memory users store (in production, use a proper database)
const users = {};

// ===== HELPERS =====
function findProduct(productId) {
  return featuredProducts.find((p) => String(p.id) === String(productId));
}

async function getCartFromRedis(userId) {
  const cartKey = `cart:${userId}`;
  const data = await redisClient.get(cartKey);
  return data ? JSON.parse(data) : null;
}

async function saveCartToRedis(userId, cart) {
  const cartKey = `cart:${userId}`;
  await redisClient.setEx(cartKey, 30 * 24 * 60 * 60, JSON.stringify(cart)); // 30 days TTL
  return cart;
}

function createCart(userId) {
  return {
    userId,
    items: [],
    coupons: [],
    address: null,
    paymentMethod: null,
    updatedAt: new Date().toISOString()
  };
}

// ===== JWT MIDDLEWARE =====
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.email = decoded.email;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// ===== PUBLIC ROUTES =====
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

app.get('/', (req, res) => {
  res.send('<h1>Food Delivery API</h1><p>API is running. See <a href="/api/v1/health">/api/v1/health</a></p>');
});

// ===== AUTH ROUTES =====
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }
    if (users[email]) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'user_' + Math.random().toString(36).slice(2, 9);
    users[email] = { userId, email, password: hashedPassword };

    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ userId, email, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const user = users[email];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.userId, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ userId: user.userId, email, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ===== PROTECTED CART ROUTES =====
app.get('/api/v1/cart', verifyToken, async (req, res) => {
  try {
    const cart = await getCartFromRedis(req.userId);
    res.json(cart || createCart(req.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

app.post('/api/v1/cart', verifyToken, async (req, res) => {
  try {
    const payload = req.body || {};
    let cart = await getCartFromRedis(req.userId) || createCart(req.userId);
    cart.items = Array.isArray(payload.items) ? payload.items : cart.items;
    cart.coupons = Array.isArray(payload.coupons) ? payload.coupons : cart.coupons;
    cart.address = payload.address || cart.address;
    cart.paymentMethod = payload.paymentMethod || cart.paymentMethod;
    cart.updatedAt = new Date().toISOString();
    cart = await saveCartToRedis(req.userId, cart);
    res.status(201).json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save cart' });
  }
});

app.put('/api/v1/cart/items', verifyToken, async (req, res) => {
  try {
    const { productId, name, price, quantity } = req.body || {};
    if (!productId || typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ error: 'productId and positive numeric quantity are required' });
    }

    const product = findProduct(productId);
    if (!product) {
      return res.status(404).json({ error: `Product with ID ${productId} not found` });
    }

    let cart = await getCartFromRedis(req.userId) || createCart(req.userId);
    const existing = cart.items.find((i) => i.productId === productId);

    if (existing) {
      existing.quantity = quantity;
      existing.price = price || existing.price;
      existing.name = name || existing.name;
    } else {
      cart.items.push({ productId, name: name || product.name, price: price || product.price, quantity });
    }

    cart.updatedAt = new Date().toISOString();
    cart = await saveCartToRedis(req.userId, cart);
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

app.delete('/api/v1/cart/items/:productId', verifyToken, async (req, res) => {
  try {
    const { productId } = req.params;
    let cart = await getCartFromRedis(req.userId) || createCart(req.userId);
    cart.items = cart.items.filter((i) => String(i.productId) !== String(productId));
    cart.updatedAt = new Date().toISOString();
    cart = await saveCartToRedis(req.userId, cart);
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

app.post('/api/v1/cart/coupons', verifyToken, async (req, res) => {
  try {
    const { code, discount } = req.body || {};
    if (!code) return res.status(400).json({ error: 'coupon code required' });

    let cart = await getCartFromRedis(req.userId) || createCart(req.userId);
    if (!cart.coupons.find((c) => c.code === code)) {
      cart.coupons.push({ code, discount: discount || 0 });
    }
    cart.updatedAt = new Date().toISOString();
    cart = await saveCartToRedis(req.userId, cart);
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to apply coupon' });
  }
});

app.delete('/api/v1/cart/coupons/:code', verifyToken, async (req, res) => {
  try {
    const { code } = req.params;
    let cart = await getCartFromRedis(req.userId) || createCart(req.userId);
    cart.coupons = cart.coupons.filter((c) => c.code !== code);
    cart.updatedAt = new Date().toISOString();
    cart = await saveCartToRedis(req.userId, cart);
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove coupon' });
  }
});

app.put('/api/v1/cart/address', verifyToken, async (req, res) => {
  try {
    const address = req.body || null;
    let cart = await getCartFromRedis(req.userId) || createCart(req.userId);
    cart.address = address;
    cart.updatedAt = new Date().toISOString();
    cart = await saveCartToRedis(req.userId, cart);
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save address' });
  }
});

app.put('/api/v1/cart/payment', verifyToken, async (req, res) => {
  try {
    const paymentMethod = req.body || null;
    let cart = await getCartFromRedis(req.userId) || createCart(req.userId);
    cart.paymentMethod = paymentMethod;
    cart.updatedAt = new Date().toISOString();
    cart = await saveCartToRedis(req.userId, cart);
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save payment' });
  }
});

app.post('/api/v1/cart/clear', verifyToken, async (req, res) => {
  try {
    const cart = createCart(req.userId);
    await saveCartToRedis(req.userId, cart);
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
