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

// Legacy routes (v1 is now the default, but keep for backward compatibility if needed)
app.get('/api/restaurant', (req, res) => {
  res.redirect(301, '/api/v1/restaurant');
});

app.get('/api/categories', (req, res) => {
  res.redirect(301, '/api/v1/categories');
});

app.get('/api/products', (req, res) => {
  res.redirect(301, '/api/v1/products');
});

app.get('/api/health', (req, res) => {
  res.redirect(301, '/api/v1/health');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
