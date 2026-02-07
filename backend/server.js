require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const redis = require('redis');
const pool = require('./db');
const initializeDatabase = require('./initDB');

const app = express();

app.use(cors());
app.use(express.json());

// ===== CONFIG =====
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is not set');
  process.exit(1);
}
const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

// ===== REDIS CLIENT =====
const redisClient = redis.createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT
  }
});

redisClient.on('error', (err) => console.log('Redis error:', err));
redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.connect().catch(console.error);

// ===== INITIALIZE DATABASE =====
(async () => {
  try {
    await initializeDatabase();
    console.log('✓ Database ready');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
})();

// ===== HELPERS =====
async function findProduct(productId) {
  const [products] = await pool.execute('SELECT * FROM products WHERE id = ?', [productId]);
  return products.length > 0 ? products[0] : null;
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

// ===== IDENTIFY USER MIDDLEWARE (for both auth & guest) =====
function identifyUser(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.email = decoded.email;
      req.isAuthenticated = true;
      return next();
    } catch (err) {
      console.log('Invalid token, treating as guest');
    }
  }
  
  // Fallback to guest ID from request body or generate new one
  const guestId = req.body?.guestId || req.query?.guestId || 'guest_' + Math.random().toString(36).slice(2, 9);
  req.userId = guestId;
  req.isAuthenticated = false;
  next();
}

// ===== PUBLIC ROUTES =====
app.get('/api/v1/restaurant', async (req, res) => {
  try {
    const [restaurants] = await pool.execute('SELECT * FROM restaurants LIMIT 1');
    const restaurant = restaurants.length > 0 ? restaurants[0] : null;
    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

app.get('/api/v1/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT id, name, icon FROM categories ORDER BY id'
    );
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/v1/products', async (req, res) => {
  try {
    const [products] = await pool.execute(
      'SELECT id, name, description, price, image, rating, reviews, category_id FROM products ORDER BY id'
    );
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/v1/products/:id', async (req, res) => {
  try {
    const product = await findProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
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

    // Check if user exists
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'user_' + Math.random().toString(36).slice(2, 9);
    
    await pool.execute(
      'INSERT INTO users (id, email, password) VALUES (?, ?, ?)',
      [userId, email, hashedPassword]
    );

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

    const [users] = await pool.execute('SELECT id, password FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ userId: user.id, email, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ===== CART ROUTES (works for authenticated & guest users) =====
app.get('/api/v1/cart', identifyUser, async (req, res) => {
  try {
    const cart = await getCartFromRedis(req.userId);
    res.json(cart || createCart(req.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

app.post('/api/v1/cart', identifyUser, async (req, res) => {
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

app.put('/api/v1/cart/items', identifyUser, async (req, res) => {
  try {
    const { productId, name, price, quantity } = req.body || {};
    if (!productId || typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({ error: 'productId and positive numeric quantity are required' });
    }

    const product = await findProduct(productId);
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

app.delete('/api/v1/cart/items/:productId', identifyUser, async (req, res) => {
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

app.post('/api/v1/cart/coupons', identifyUser, async (req, res) => {
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

app.delete('/api/v1/cart/coupons/:code', identifyUser, async (req, res) => {
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

app.put('/api/v1/cart/address', identifyUser, async (req, res) => {
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

app.put('/api/v1/cart/payment', identifyUser, async (req, res) => {
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

app.post('/api/v1/cart/clear', identifyUser, async (req, res) => {
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
