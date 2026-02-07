# REST API Documentation

## Overview

Complete REST API for the Food Delivery Platform. All endpoints use JSON for request/response bodies.

**Base URL:** `http://localhost:5000/api/v1`

**API Version:** v1 (Current)

**Authentication:** JWT Bearer Token (7-day expiration)

**Database:** MySQL 8.0

**Cache:** Redis 7 (Guest IDs, Cart persistence)

## Authentication

### JWT Token
Include the token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

**Token Details:**
- Expiration: 7 days
- Stored in: `localStorage` (browser)
- Auto-attached via: Axios request interceptor
- Algorithm: HS256

### Guest Users
- Anonymous browsing supported
- Automatic `guestId` generated and stored in localStorage
- 30-day cart persistence via Redis
- Can proceed to checkout without login

### Public Endpoints (No Authentication)
- `GET /restaurant` - Restaurant info
- `GET /categories` - Menu categories
- `GET /products` - Product listing
- `GET /products/:id` - Product details
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /health` - API status

### Protected Endpoints (Auth + Guest)
- `/cart` - All cart operations (both authenticated & guest users)
- `/cart/items` - Item management
- `/cart/address` - Delivery address
- `/cart/payment` - Payment method
- `/cart/coupons` - Coupon codes

---

## Endpoints

### Authentication Endpoints

#### Register User
```
POST /auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "userId": "user_abc123xyz",
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `409 Conflict` - User already exists
- `400 Bad Request` - Email or password missing

#### Login User
```
POST /auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "userId": "user_abc123xyz",
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Email or password missing
```

---

### Product Endpoints

#### Get All Products
```
GET /products
```

**Query Parameters:**
- None (currently returns all products)

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Margherita Pizza",
    "description": "Classic pizza with tomato, mozzarella, and basil",
    "price": 12.99,
    "image": "https://example.com/pizza.jpg",
    "rating": 4.5,
    "reviews": 42,
    "category_id": 1
  },
  {
    "id": 2,
    "name": "Carbonara Pasta",
    "description": "Traditional Italian pasta with eggs and bacon",
    "price": 14.99,
    "image": "https://example.com/pasta.jpg",
    "rating": 4.8,
    "reviews": 28,
    "category_id": 2
  }
]
```

#### Get Single Product by ID
```
GET /products/:id
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Margherita Pizza",
  "description": "Classic pizza with tomato, mozzarella, and basil",
  "price": 12.99,
  "image": "https://example.com/pizza.jpg",
  "rating": 4.5,
  "reviews": 42,
  "category_id": 1
}
```

**Errors:**
- `404 Not Found` - Product not found

---

### Category Endpoints

#### Get All Categories
```
GET /categories
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Pizzas",
    "icon": "🍕"
  },
  {
    "id": 2,
    "name": "Pasta",
    "icon": "🍝"
  },
  {
    "id": 3,
    "name": "Salads",
    "icon": "🥗"
  },
  {
    "id": 4,
    "name": "Desserts",
    "icon": "🍰"
  }
]
```

---

### Restaurant Endpoint

#### Get Restaurant Info
```
GET /restaurant
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Delicious Eats",
  "cuisine": "Italian",
  "rating": 4.7,
  "reviews": 128,
  "deliveryTime": "30-45 mins",
  "image": "https://example.com/restaurant.jpg"
}
```

---

### Cart Endpoints

#### Get Cart
```
GET /cart?guestId=<guestId>
```

**Headers:**
- `Authorization: Bearer <token>` (optional for authenticated users)

**Query Parameters:**
- `guestId` - Required for guests, auto-added by Axios interceptor

**Response (200):**
```json
{
  "userId": "guest_abc123xyz",
  "items": [
    {
      "productId": 1,
      "name": "Margherita Pizza",
      "price": 12.99,
      "quantity": 2
    }
  ],
  "coupons": [],
  "address": null,
  "paymentMethod": null,
  "updatedAt": "2026-02-07T10:30:00Z"
}
```

#### Add/Update Cart Item
```
PUT /cart/items
```

**Request:**
```json
{
  "productId": 1,
  "name": "Margherita Pizza",
  "price": 12.99,
  "quantity": 2,
  "guestId": "guest_abc123xyz"
}
```

**Response (200):**
```json
{
  "userId": "guest_abc123xyz",
  "items": [
    {
      "productId": 1,
      "name": "Margherita Pizza",
      "price": 12.99,
      "quantity": 2
    }
  ]
}
```

#### Remove Item from Cart
```
DELETE /cart/items/:productId?guestId=<guestId>
```

**Response (200):**
```json
{
  "userId": "guest_abc123xyz",
  "items": []
}
```

#### Apply Coupon
```
POST /cart/coupons
```

**Request:**
```json
{
  "code": "SAVE10",
  "discount": 10,
  "guestId": "guest_abc123xyz"
}
```

**Response (200):**
```json
{
  "userId": "guest_abc123xyz",
  "coupons": [
    {
      "code": "SAVE10",
      "discount": 10
    }
  ]
}
```

#### Save Address
```
PUT /cart/address
```

**Request:**
```json
{
  "country": "Ukraine",
  "city": "Kyiv",
  "street": "Main Street",
  "number": "123",
  "apartment": "4B",
  "entrance": "A",
  "floor": "4",
  "guestId": "guest_abc123xyz"
}
```

**Response (200):**
```json
{
  "userId": "guest_abc123xyz",
  "address": {
    "country": "Ukraine",
    "city": "Kyiv",
    "street": "Main Street",
    "number": "123",
    "apartment": "4B"
  }
}
```

#### Save Payment Method
```
PUT /cart/payment
```

**Request:**
```json
{
  "method": "Credit card",
  "guestId": "guest_abc123xyz"
}
```

**Response (200):**
```json
{
  "userId": "guest_abc123xyz",
  "paymentMethod": {
    "method": "Credit card"
  }
}
```

#### Clear Cart
```
POST /cart/clear
```

**Request:**
```json
{
  "guestId": "guest_abc123xyz"
}
```

**Response (200):**
```json
{
  "userId": "guest_abc123xyz",
  "items": [],
  "coupons": [],
  "address": null,
  "paymentMethod": null
}
```

---

### Health Check

#### API Status
```
GET /health
```

**Response (200):**
```json
{
  "status": "API is running"
}
```

---

## Error Responses

**400 - Bad Request**
```json
{
  "error": "productId and positive numeric quantity are required"
}
```

**401 - Unauthorized**
```json
{
  "error": "Invalid credentials"
}
```

**404 - Not Found**
```json
{
  "error": "Product not found"
}
```

**409 - Conflict**
```json
{
  "error": "User already exists"
}
```

**500 - Server Error**
```json
{
  "error": "Failed to fetch restaurant"
}
```

---

## Response Format

All endpoints return JSON responses. Arrays are returned directly (no wrapper), while single resources are also returned directly.

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized  
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

---

## Database Tables

Data is stored in MySQL with the following tables:
- `restaurants` - Single restaurant record
- `categories` - Menu categories (4 default)
- `products` - Menu items (4 default)
- `product_ratings` - Reviews & ratings
- `users` - User accounts (bcrypt hashed passwords)
- `assets` - File uploads

---

## Caching Strategy

- **Redis**: Cart & session storage (30-day TTL)
- **Guest IDs**: Auto-generated & persisted in localStorage
- **JWT Tokens**: 7-day expiration
- **Database**: All persistent data in MySQL
