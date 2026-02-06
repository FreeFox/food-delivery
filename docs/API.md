# API Documentation

## Overview

RESTful API for the Single Restaurant Food Delivery Platform. All endpoints return JSON responses.

**Base URL:** `http://localhost:5000/api`

**API Version:** v1

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Public Endpoints (No Authentication Required)
- Product listings
- Category information
- Reviews and ratings
- Restaurant information

### Protected Endpoints (Authentication Required)
- Cart operations
- Order management
- User profile
- Review submission

### Admin Endpoints (Admin Role Required)
- Product management
- Order fulfillment
- Analytics

---

## Endpoints

### 1. Authentication

#### Register User
```
POST /auth/register
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "id": "user_123",
  "email": "john@example.com",
  "token": "eyJhbGc...",
  "expiresIn": 86400
}
```

#### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "id": "user_123",
  "email": "john@example.com",
  "token": "eyJhbGc...",
  "expiresIn": 86400
}
```

#### Logout
```
POST /auth/logout
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### 2. Products

#### Get All Products
```
GET /products
```

**Query Parameters:**
- `category` (optional) - Filter by category ID
- `search` (optional) - Search by product name
- `page` (optional, default: 1) - Pagination
- `limit` (optional, default: 20) - Items per page
- `sort` (optional) - Sort by 'name', 'price', 'rating'

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "name": "Margherita Pizza",
      "description": "Classic pizza with tomato and mozzarella",
      "price": 12.99,
      "category": "pizzas",
      "image": "https://...",
      "rating": 4.5,
      "reviews": 42,
      "available": true,
      "preparationTime": 20
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

#### Get Product by ID
```
GET /products/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "prod_123",
    "name": "Margherita Pizza",
    "description": "Classic pizza with tomato and mozzarella",
    "price": 12.99,
    "category": "pizzas",
    "image": "https://...",
    "rating": 4.5,
    "reviews": 42,
    "available": true,
    "preparationTime": 20,
    "variants": [
      {
        "id": "var_1",
        "name": "Size",
        "options": ["Small", "Medium", "Large"]
      }
    ],
    "addOns": [
      {
        "id": "addon_1",
        "name": "Extra Cheese",
        "price": 2.00
      }
    ]
  }
}
```

#### Create Product (Admin)
```
POST /admin/products
```

**Request Body:**
```json
{
  "name": "Margherita Pizza",
  "description": "Classic pizza",
  "price": 12.99,
  "categoryId": "cat_1",
  "image": "https://...",
  "preparationTime": 20
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "prod_123",
    "name": "Margherita Pizza",
    "price": 12.99
  }
}
```

#### Update Product (Admin)
```
PUT /admin/products/:id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product updated successfully"
}
```

#### Delete Product (Admin)
```
DELETE /admin/products/:id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

### 3. Categories

#### Get All Categories
```
GET /categories
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_1",
      "name": "Pizzas",
      "description": "Our signature pizzas",
      "image": "https://...",
      "productCount": 15
    },
    {
      "id": "cat_2",
      "name": "Pasta",
      "description": "Italian pasta dishes",
      "image": "https://...",
      "productCount": 12
    }
  ]
}
```

#### Get Category by ID
```
GET /categories/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "cat_1",
    "name": "Pizzas",
    "description": "Our signature pizzas",
    "image": "https://...",
    "products": [
      {
        "id": "prod_123",
        "name": "Margherita Pizza",
        "price": 12.99
      }
    ]
  }
}
```

---

### 4. Reviews & Ratings

#### Get Product Reviews
```
GET /reviews/:productId
```

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)
- `sort` (optional) - 'recent', 'helpful', 'rating'

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "rev_1",
      "productId": "prod_123",
      "userId": "user_123",
      "userName": "John Doe",
      "rating": 5,
      "title": "Great pizza!",
      "comment": "Best pizza I've had in town",
      "images": ["https://..."],
      "helpful": 25,
      "notHelpful": 2,
      "createdAt": "2026-02-05T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42
  },
  "averageRating": 4.5,
  "totalReviews": 42
}
```

#### Get Restaurant Ratings
```
GET /restaurant/ratings
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "averageRating": 4.6,
    "totalReviews": 328,
    "distribution": {
      "5": 200,
      "4": 85,
      "3": 30,
      "2": 10,
      "1": 3
    }
  }
}
```

#### Submit Review (Authentication Required)
```
POST /reviews
```

**Request Body:**
```json
{
  "productId": "prod_123",
  "rating": 5,
  "title": "Great pizza!",
  "comment": "Best pizza I've had",
  "images": ["base64_string_1", "base64_string_2"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "rev_1",
    "message": "Review submitted successfully"
  }
}
```

#### Update Review (Authentication Required)
```
PUT /reviews/:id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Review updated successfully"
}
```

#### Delete Review (Authentication Required)
```
DELETE /reviews/:id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

### 5. Cart

#### Get Cart (Authentication Required)
```
GET /cart
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "cart_123",
    "items": [
      {
        "id": "item_1",
        "productId": "prod_123",
        "productName": "Margherita Pizza",
        "quantity": 2,
        "price": 12.99,
        "subtotal": 25.98,
        "addOns": [
          {
            "name": "Extra Cheese",
            "price": 2.00
          }
        ]
      }
    ],
    "subtotal": 25.98,
    "tax": 2.08,
    "discount": 0,
    "total": 28.06
  }
}
```

#### Add to Cart (Authentication Required)
```
POST /cart/items
```

**Request Body:**
```json
{
  "productId": "prod_123",
  "quantity": 2,
  "variants": {
    "size": "Large"
  },
  "addOns": [1, 2]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "cartId": "cart_123",
    "itemId": "item_1"
  }
}
```

#### Update Cart Item (Authentication Required)
```
PUT /cart/items/:itemId
```

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cart item updated"
}
```

#### Remove from Cart (Authentication Required)
```
DELETE /cart/items/:itemId
```

**Response (200):**
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

### 6. Orders

#### Create Order (Authentication Required)
```
POST /orders
```

**Request Body:**
```json
{
  "cartId": "cart_123",
  "deliveryAddressId": "addr_1",
  "paymentMethod": "card",
  "specialInstructions": "Leave at door"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "orderId": "order_123",
    "orderNumber": "ORD-20260206-001",
    "total": 28.06,
    "estimatedDelivery": "2026-02-06T11:30:00Z",
    "status": "confirmed"
  }
}
```

#### Get Orders (Authentication Required)
```
GET /orders
```

**Query Parameters:**
- `status` (optional) - 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "order_123",
      "orderNumber": "ORD-20260206-001",
      "items": [...],
      "total": 28.06,
      "status": "preparing",
      "createdAt": "2026-02-06T10:00:00Z",
      "estimatedDelivery": "2026-02-06T11:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5
  }
}
```

#### Get Order Details (Authentication Required)
```
GET /orders/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "order_123",
    "orderNumber": "ORD-20260206-001",
    "items": [
      {
        "productId": "prod_123",
        "productName": "Margherita Pizza",
        "quantity": 2,
        "price": 12.99,
        "subtotal": 25.98
      }
    ],
    "subtotal": 25.98,
    "tax": 2.08,
    "discount": 0,
    "total": 28.06,
    "status": "preparing",
    "statusHistory": [
      {
        "status": "confirmed",
        "timestamp": "2026-02-06T10:00:00Z"
      },
      {
        "status": "preparing",
        "timestamp": "2026-02-06T10:05:00Z"
      }
    ],
    "deliveryAddress": {...},
    "createdAt": "2026-02-06T10:00:00Z",
    "estimatedDelivery": "2026-02-06T11:30:00Z"
  }
}
```

#### Cancel Order (Authentication Required)
```
POST /orders/:id/cancel
```

**Response (200):**
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

---

### 7. Restaurant Info

#### Get Restaurant Information
```
GET /restaurant/info
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "name": "Pizza Palace",
    "description": "The best pizza in town",
    "image": "https://...",
    "address": "123 Main St, City",
    "phone": "+1234567890",
    "email": "info@pizzapalace.com",
    "website": "https://pizzapalace.com",
    "hours": {
      "monday": { "open": "11:00", "close": "23:00" },
      "tuesday": { "open": "11:00", "close": "23:00" },
      "wednesday": { "open": "11:00", "close": "23:00" },
      "thursday": { "open": "11:00", "close": "23:00" },
      "friday": { "open": "11:00", "close": "00:00" },
      "saturday": { "open": "10:00", "close": "00:00" },
      "sunday": { "open": "10:00", "close": "23:00" }
    },
    "isOpen": true,
    "minimumOrder": 10.00,
    "deliveryFee": 2.00,
    "estimatedDeliveryTime": "30-45 minutes",
    "cuisineTypes": ["Italian", "Pizza"],
    "rating": 4.6,
    "totalOrders": 1250
  }
}
```

---

### 8. Addresses

#### Get User Addresses (Authentication Required)
```
GET /addresses
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "addr_1",
      "label": "Home",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "isDefault": true
    }
  ]
}
```

#### Add Address (Authentication Required)
```
POST /addresses
```

**Request Body:**
```json
{
  "label": "Work",
  "address": "456 Business Ave",
  "city": "New York",
  "state": "NY",
  "zipCode": "10002",
  "country": "USA",
  "latitude": 40.7200,
  "longitude": -74.0050
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "addr_2"
  }
}
```

#### Update Address (Authentication Required)
```
PUT /addresses/:id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Address updated successfully"
}
```

#### Delete Address (Authentication Required)
```
DELETE /addresses/:id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

---

### 9. Admin Analytics

#### Get Dashboard Analytics (Admin)
```
GET /admin/analytics/dashboard
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "todayOrders": 42,
    "todayRevenue": 1248.50,
    "totalOrders": 128,
    "totalRevenue": 3850.00,
    "averageOrderValue": 30.08,
    "topProducts": [...],
    "recentOrders": [...]
  }
}
```

---

## Error Responses

### Common Error Codes

**400 - Bad Request**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters"
  }
}
```

**401 - Unauthorized**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication token is missing or invalid"
  }
}
```

**403 - Forbidden**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to access this resource"
  }
}
```

**404 - Not Found**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

**500 - Server Error**
```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Rate Limiting

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users
- Rate limit headers included in all responses:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

---

## Pagination

All list endpoints support pagination with the following parameters:
- `page` (default: 1)
- `limit` (default: 20, max: 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```
