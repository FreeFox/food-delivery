# Database Schema Documentation

## Overview

The food delivery platform uses PostgreSQL as its primary relational database. This document describes the complete database schema including tables, relationships, and constraints.

**Database Version:** PostgreSQL 12+

---

## Table Structure

### Users Table

Stores user account information (customers and admins).

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  role ENUM('customer', 'admin', 'delivery_person') DEFAULT 'customer',
  profile_image_url VARCHAR(500),
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,
  phone_verified BOOLEAN DEFAULT false,
  phone_verified_at TIMESTAMP,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_created_at (created_at)
);
```

### Addresses Table

Stores delivery and business addresses for users.

```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  label VARCHAR(50) NOT NULL,
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_coordinates (latitude, longitude)
);
```

### Categories Table

Product categories for menu organization.

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  image_url VARCHAR(500),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_display_order (display_order),
  INDEX idx_is_active (is_active)
);
```

### Products Table

Main products/menu items.

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  base_price DECIMAL(10, 2) NOT NULL,
  preparation_time INT DEFAULT 15,
  is_available BOOLEAN DEFAULT true,
  is_vegetarian BOOLEAN DEFAULT false,
  is_spicy BOOLEAN DEFAULT false,
  spice_level INT,
  ingredients TEXT,
  allergens TEXT,
  calories INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_category_id (category_id),
  INDEX idx_name (name),
  INDEX idx_is_available (is_available),
  INDEX idx_created_at (created_at)
);
```

### Product Variants Table

Product sizes and options (e.g., sizes, crust types).

```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  variant_type VARCHAR(100) NOT NULL,
  variant_name VARCHAR(100) NOT NULL,
  price_modifier DECIMAL(10, 2) DEFAULT 0,
  display_order INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  UNIQUE KEY unique_variant (product_id, variant_type, variant_name)
);
```

### Add-ons Table

Extra items that can be added to products (e.g., extra cheese).

```sql
CREATE TABLE add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  display_order INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_display_order (display_order)
);
```

### Cart Table

User shopping carts.

```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_items INT DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

### Cart Items Table

Individual items in a cart.

```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_cart_id (cart_id),
  INDEX idx_product_id (product_id)
);
```

### Cart Item Variants Table

Variants selected for a specific cart item.

```sql
CREATE TABLE cart_item_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_item_id UUID NOT NULL,
  variant_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cart_item_id) REFERENCES cart_items(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
  INDEX idx_cart_item_id (cart_item_id)
);
```

### Cart Item Add-ons Table

Add-ons selected for a specific cart item.

```sql
CREATE TABLE cart_item_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_item_id UUID NOT NULL,
  add_on_id UUID NOT NULL,
  quantity INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cart_item_id) REFERENCES cart_items(id) ON DELETE CASCADE,
  FOREIGN KEY (add_on_id) REFERENCES add_ons(id) ON DELETE CASCADE,
  INDEX idx_cart_item_id (cart_item_id)
);
```

### Orders Table

Main order records.

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  delivery_address_id UUID NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  promotional_code_id UUID,
  total DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'pending',
  payment_method ENUM('card', 'wallet', 'cash') NOT NULL,
  payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  special_instructions TEXT,
  assigned_delivery_person_id UUID,
  estimated_delivery_time INT,
  actual_delivery_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (delivery_address_id) REFERENCES addresses(id) ON DELETE SET NULL,
  FOREIGN KEY (promotional_code_id) REFERENCES promotional_codes(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_delivery_person_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_order_number (order_number),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_payment_status (payment_status)
);
```

### Order Items Table

Individual items in an order.

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX idx_order_id (order_id)
);
```

### Order Item Variants Table

Variants for order items.

```sql
CREATE TABLE order_item_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL,
  variant_type VARCHAR(100) NOT NULL,
  variant_name VARCHAR(100) NOT NULL,
  price_modifier DECIMAL(10, 2) DEFAULT 0,
  
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  INDEX idx_order_item_id (order_item_id)
);
```

### Order Item Add-ons Table

Add-ons for order items.

```sql
CREATE TABLE order_item_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL,
  add_on_name VARCHAR(100) NOT NULL,
  quantity INT DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
  INDEX idx_order_item_id (order_item_id)
);
```

### Reviews Table

Customer reviews for products.

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  order_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT true,
  helpful_count INT DEFAULT 0,
  not_helpful_count INT DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  moderation_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_product_id (product_id),
  INDEX idx_user_id (user_id),
  INDEX idx_rating (rating),
  INDEX idx_moderation_status (moderation_status),
  INDEX idx_created_at (created_at),
  UNIQUE KEY unique_review (product_id, order_id, user_id)
);
```

### Review Images Table

Images attached to reviews.

```sql
CREATE TABLE review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  INDEX idx_review_id (review_id)
);
```

### Review Helpfulness Table

Track user helpfulness votes on reviews.

```sql
CREATE TABLE review_helpfulness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_review_id (review_id),
  UNIQUE KEY unique_helpfulness (review_id, user_id)
);
```

### Promotional Codes Table

Discount codes and promotional offers.

```sql
CREATE TABLE promotional_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type ENUM('percentage', 'fixed') NOT NULL,
  discount_value DECIMAL(10, 2) NOT NULL,
  minimum_order_value DECIMAL(10, 2) DEFAULT 0,
  max_usage INT,
  current_usage INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_code (code),
  INDEX idx_is_active (is_active),
  INDEX idx_valid_from (valid_from),
  INDEX idx_valid_until (valid_until)
);
```

### Favorites Table

Track user favorite products.

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  UNIQUE KEY unique_favorite (user_id, product_id)
);
```

### Order Status History Table

Track order status changes.

```sql
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled') NOT NULL,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_id (order_id),
  INDEX idx_created_at (created_at)
);
```

### Payments Table

Payment transaction records.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('card', 'wallet', 'cash') NOT NULL,
  payment_gateway_id VARCHAR(255),
  status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  transaction_id VARCHAR(255) UNIQUE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_id (order_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

### Support Tickets Table

Customer support inquiries.

```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  order_id UUID,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  assigned_to UUID,
  resolution TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

---

## Relationships Diagram

```
Users (1) ──→ (N) Addresses
Users (1) ──→ (N) Orders
Users (1) ──→ (N) Carts
Users (1) ──→ (N) Reviews
Users (1) ──→ (N) Favorites

Categories (1) ──→ (N) Products

Products (1) ──→ (N) Product Variants
Products (1) ──→ (N) Add-ons
Products (1) ──→ (N) Reviews
Products (1) ──→ (N) Favorites

Carts (1) ──→ (N) Cart Items
Cart Items (N) ──→ (N) Product Variants (via cart_item_variants)
Cart Items (N) ──→ (N) Add-ons (via cart_item_add_ons)

Orders (1) ──→ (N) Order Items
Order Items (N) ──→ (N) Product Variants (via order_item_variants)
Order Items (N) ──→ (N) Add-ons (via order_item_add_ons)

Orders (1) ──→ (1) Promotional Codes
Orders (1) ──→ (N) Order Status History
Orders (1) ──→ (N) Payments

Reviews (1) ──→ (N) Review Images
Reviews (1) ──→ (N) Review Helpfulness
```

---

## Indexes

Primary indexes for performance optimization:

| Table | Index | Columns |
|-------|-------|---------|
| users | idx_email | email |
| users | idx_role | role |
| products | idx_category_id | category_id |
| products | idx_is_available | is_available |
| orders | idx_user_id | user_id |
| orders | idx_status | status |
| reviews | idx_product_id | product_id |
| reviews | idx_rating | rating |
| addresses | idx_coordinates | latitude, longitude |

---

## Data Type Conventions

- **IDs**: UUID v4 (Primary and Foreign Keys)
- **Money**: DECIMAL(10, 2)
- **Email**: VARCHAR(255) with unique constraint
- **Phone**: VARCHAR(20)
- **Timestamps**: TIMESTAMP with timezone awareness
- **Text**: TEXT for flexible length content
- **Enums**: Native PostgreSQL ENUM type

---

## Backup & Recovery

### Backup Command
```bash
pg_dump -U postgres -d food_delivery > backup.sql
```

### Restore Command
```bash
psql -U postgres -d food_delivery < backup.sql
```

---

## Query Performance Notes

1. Always use indexed columns in WHERE clauses
2. Use EXPLAIN ANALYZE for complex queries
3. Consider query caching for frequently accessed data
4. Paginate large result sets
5. Use prepared statements to prevent SQL injection

---

## Migration Strategy

All schema changes should use migration files with timestamps:
```
migrations/
├── 20260101_initial_schema.sql
├── 20260105_add_product_variants.sql
└── 20260106_add_review_images.sql
```
