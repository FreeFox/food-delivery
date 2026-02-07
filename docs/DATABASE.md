# Database Schema Documentation

## Overview

The food delivery platform uses **MySQL 8.0** as its primary relational database. This document describes the complete database schema including tables, relationships, and constraints.

**Database:** food_delivery
**User:** app_user
**Engine:** InnoDB (default)
**Charset:** utf8mb4

---

## Auto-Initialization

The database schema is automatically created and seeded on server startup via `backend/initDB.js`:

1. Connects to MySQL
2. Checks if tables exist
3. Creates tables if missing (idempotent)
4. Seeds default data (restaurant, categories, products)
5. No manual migration needed

---

## Tables

### 1. Restaurants

Restaurant/business information (typically 1 record).

```sql
CREATE TABLE restaurants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  cuisine VARCHAR(100),
  rating DECIMAL(3, 1) DEFAULT 4.5,
  reviews INT DEFAULT 0,
  deliveryTime VARCHAR(50) DEFAULT '30-45 mins',
  image LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_name (name)
);
```

**Default Data:**
```json
{
  "id": 1,
  "name": "Delicious Eats",
  "cuisine": "Italian",
  "rating": 4.7,
  "reviews": 128,
  "deliveryTime": "30-45 mins",
  "image": "https://..."
}
```

---

### 2. Categories

Product categories for menu organization.

```sql
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(10) DEFAULT '📎',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_name (name)
);
```

**Default Data:**
```
id=1, name="Pizzas", icon="🍕"
id=2, name="Pasta", icon="🍝"
id=3, name="Salads", icon="🥗"
id=4, name="Desserts", icon="🍰"
```

---

### 3. Products

Menu items/dishes.

```sql
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description LONGTEXT,
  price DECIMAL(10, 2) NOT NULL,
  image LONGTEXT,
  rating DECIMAL(3, 1) DEFAULT 4.5,
  reviews INT DEFAULT 0,
  category_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_category_id (category_id),
  INDEX idx_price (price),
  INDEX idx_name (name)
);
```

**Default Data:**
```
id=1, name="Margherita Pizza", price=12.99, category_id=1, rating=4.5
id=2, name="Spaghetti Carbonara", price=14.99, category_id=2, rating=4.8
id=3, name="Caesar Salad", price=10.99, category_id=3, rating=4.6
id=4, name="Tiramisu", price=8.99, category_id=4, rating=4.9
```

---

### 4. Users

User accounts with hashed passwords.

```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email)
);
```

**Notes:**
- `id`: User-generated ID (e.g., "user_abc123xyz")
- `password`: Bcrypt hashed (never plain text)
- Used for authentication & JWT claims

**Example:**
```json
{
  "id": "user_abc123xyz",
  "email": "john@example.com",
  "password": "$2a$10$...(bcrypt hash)"
}
```

---

### 5. Product Ratings

User reviews and ratings for products (reserved for future use).

```sql
CREATE TABLE product_ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  user_id VARCHAR(50),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_product_id (product_id),
  INDEX idx_user_id (user_id)
);
```

---

### 6. Assets

File uploads and media (reserved for future image upload feature).

```sql
CREATE TABLE assets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  size_kb INT,
  uploaded_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_created_at (created_at)
);
```

---

## Relationships

```
Restaurants (1) ─────→ (N) - (None directly)

Categories (1) ─────→ (N) Products
      │
      │ category_id (FK)
      ↓
   Products
      ├─ (N) Product Ratings
      └─ (1) Category

Users (1) ─────→ (N) Product Ratings
      │ id (user_id in ratings)
      ↓
   Stores: Authentication & authorization
```

---

## Data Flow

### Product Query
```sql
-- Get all products with category info
SELECT p.* FROM products p
JOIN categories c ON p.category_id = c.id
ORDER BY c.id, p.name;
```

### User Authentication
```sql
-- Check user credentials
SELECT id, password FROM users WHERE email = ?;
-- Then: bcrypt.compare(inputPassword, hashedPassword)
```

### Cart (Redis, not MySQL)
```javascript
// Cart structure stored in Redis
{
  userId: "guest_abc123xyz" or "user_xyz",
  items: [
    { productId: 1, name: "Pizza", price: 12.99, quantity: 2 }
  ],
  coupons: [],
  address: { country, city, street, ...},
  paymentMethod: { method: "Credit card" },
  updatedAt: "2026-02-07T10:30:00Z"
}
```

---

## Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| restaurants | idx_name | name | Quick restaurant lookup |
| categories | idx_name | name | Category filtering |
| products | idx_category_id | category_id | Products by category |
| products | idx_price | price | Sorting/filtering |
| products | idx_name | name | Search products |
| users | idx_email | email | User login lookup |
| product_ratings | idx_product_id | product_id | Reviews per product |
| product_ratings | idx_user_id | user_id | Reviews by user |
| assets | idx_created_at | created_at | Recent uploads |

---

## Data Type Conventions

- **IDs**: INT AUTO_INCREMENT (except users: VARCHAR string)
- **UUIDs**: VARCHAR(50) for generated IDs (e.g., "user_abc123xyz")
- **Money**: DECIMAL(10, 2) - Exact decimal for currency
- **Email**: VARCHAR(255) UNIQUE - Standardized length
- **Text Short**: VARCHAR(255) - Names, titles
- **Text Long**: LONGTEXT - Descriptions, comments
- **Timestamps**: TIMESTAMP - Automatic update on modifications
- **Enums**: VARCHAR(20) - Flexible, no need for native ENUM

---

## Storage & Volumes

### MySQL Data Persistence
```yaml
Docker Volume: mysql_data
Location: /var/lib/mysql (in container)
Host Mount: Named volume (docker-compose managed)
Persistence: Survives container restarts
Backup: Regular snapshots recommended
```

### Data Backup
```bash
# Full backup
docker exec food-delivery-mysql mysqldump \
  -u app_user -p app_password_12345 \
  food_delivery > backup.sql

# Restore
docker exec -i food-delivery-mysql mysql \
  -u app_user -p app_password_12345 \
  food_delivery < backup.sql
```

---

## Connection Pool

**Configuration (in `backend/db.js`):**
```javascript
const pool = mysql.createPool({
  connectionLimit: 10,      // Max concurrent connections
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  enableKeepAlive: true,    // Prevent connection timeout
  waitForConnections: true
});
```

**Benefits:**
- Reuses database connections
- Reduces overhead of connection setup/teardown
- Limits resource usage
- Auto-reconnect on failure

---

## Query Performance

### Best Practices
1. **Always use indexes** - Queries on indexed columns are 1000x faster
2. **Prepared statements** - All queries use `?` placeholders (mysql2)
3. **Limit results** - Use LIMIT for pagination
4. **Avoid N+1 queries** - Fetch related data in single query when possible
5. **Check execution plans** - Use EXPLAIN to analyze slow queries

### Common Queries
```sql
-- Get all products (with categories)
SELECT id, name, description, price, image, rating, reviews, category_id 
FROM products 
ORDER BY id;

-- Get products by category
SELECT * FROM products 
WHERE category_id = ? 
ORDER BY name;

-- User login
SELECT id, password FROM users 
WHERE email = ? 
LIMIT 1;

-- Insert new user
INSERT INTO users (id, email, password) 
VALUES (?, ?, ?);
```

---

## Scalability Considerations

### Current Setup
- Single MySQL instance
- Single server
- No replication

### To Scale
1. **Read Replicas** - Slave MySQL for read-heavy analytics
2. **Sharding** - Partition users by ID ranges if millions of users
3. **Connection Pooling** - Already implemented (10 connections max)
4. **Query Optimization** - Monitor slow query logs
5. **Caching** - Redis for frequent queries (already done)

---

## Future Tables (Reserved)

### Orders (for order management)
```sql
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(50),
  items JSON,              -- Array of cart items
  address JSON,            -- Delivery address
  total DECIMAL(10, 2),
  status ENUM('pending', 'confirmed', 'preparing', 'delivered'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Coupons (for discount codes)
```sql
CREATE TABLE coupons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE,
  discount_percent DECIMAL(5, 2),
  valid_until DATE,
  max_usage INT,
  current_usage INT DEFAULT 0
);
```

---

## Access & Administration

### Connect to MySQL
```bash
# Inside container
docker exec -it food-delivery-mysql mysql -u app_user -p food_delivery
Password: app_password_12345

# Useful commands
SHOW TABLES;
DESC users;
SHOW INDEXES FROM products;
EXPLAIN SELECT * FROM products WHERE category_id = 1;
```

### View Data
```bash
# List all users
SELECT * FROM users\G

# Count products
SELECT COUNT(*) FROM products;

# Check ratings
SELECT * FROM product_ratings;
```

---

## Maintenance

### Regular Tasks
1. **Backup** - Daily automated backups
2. **Optimize** - OPTIMIZE TABLE after deletes
3. **Monitor** - Check slow query log
4. **Clean** - Archive old ratings/reviews

### Optimization
```sql
-- Rebuild indexes
OPTIMIZE TABLE products, categories, users;

-- Check table integrity
CHECK TABLE products, categories;

-- Repair if needed
REPAIR TABLE products;
```
