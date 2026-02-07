# System Architecture

## Overview

The Food Delivery Platform is a modern three-tier distributed application serving a single restaurant. The system provides seamless ordering, cart management, and checkout capabilities with responsive UI and secure authentication.

**Tech Stack:** React 18 + Express.js + MySQL 8.0 + Redis 7 + Docker Compose
**Status:** Production-ready MVP with containerized deployment

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (Port 3000)                   │
├─────────────────────────────────────────────────────────────────┤
│  React 18 (Create React App)                                    │
│  ├── Chakra UI Components (HomePage, ProductDetail, Checkout)  │
│  ├── React Router v6 (/ and /product/:id routes)               │
│  ├── Axios HTTP Client (with JWT auth interceptors)            │
│  └── Local State + Redux-less Architecture                     │
│                                                                  │
│  Global Components:                                             │
│  ├── Header (Navigation, Cart Button, Auth)                    │
│  ├── CartDrawer (Checkout Modal with 5 sub-components)         │
│  └── LoginModal (Sign In / Register Forms)                     │
└─────────────────────────────────────────────────────────────────┘
                         ↕ HTTP/HTTPS
              axios.create() interceptors
              ├── Add Cookie to requests
              └── Handle 401 responses
                         ↕
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Port 5000)                      │
├─────────────────────────────────────────────────────────────────┤
│  Express.js REST API Server                                     │
│  ├── /api/v1/restaurant     (GET) - Single restaurant data      │
│  ├── /api/v1/categories     (GET) - All categories              │
│  ├── /api/v1/products       (GET) - All products                │
│  ├── /api/v1/products/:id   (GET) - Product detail              │
│  ├── /api/v1/auth/register  (POST) - User registration          │
│  ├── /api/v1/auth/login     (POST) - User login                 │
│  ├── /api/v1/cart/*         (GET/POST/PUT/DELETE) - Cart ops    │
│  └── Middleware: CORS, JSON body parser, JWT verifier           │
│                                                                  │
│  Request/Response Format:                                       │
│  {                                                              │
│    "success": true,                                             │
│    "data": {...},                                               │
│    "error": null                                                │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                         ↕
                    mysql2/promise
                    redis client
                         ↕
    ┌────────────────────────┬─────────────────────────┐
    ↓                        ↓                         ↓
┌──────────────┐    ┌───────────────┐    ┌──────────────────┐
│  MySQL 8.0   │    │    Redis 7    │    │ Environment Vars │
│ (Container   │    │  (Container   │    │ (.env file)      │
│  Internal)   │    │   Internal)   │    │                  │
│              │    │               │    │ DB_HOST=mysql    │
│ 6 Tables:    │    │ Cart Storage: │    │ DB_PORT=3306     │
│ • restaurants│    │ Key: cart:*   │    │ DB_USER=app_user │
│ • categories │    │ TTL: 30 days  │    │ DB_PASSWORD=*    │
│ • products   │    │               │    │ REDIS_HOST=redis │
│ • users      │    │ No Browser    │    │ JWT_SECRET=*     │
│ • ratings    │    │ Exposure      │    │                  │
│ • assets     │    │               │    └──────────────────┘
└──────────────┘    └───────────────┘
```

---

## Technology Stack

### Frontend (React 18)

| Technology | Purpose | Version |
|-----------|---------|---------|
| React | UI library with hooks | 18.x |
| React Router | Client-side routing | v6 |
| Chakra UI | Component library | Latest |
| Axios | HTTP client | Latest |
| Emotion | CSS-in-JS styling | Latest |

**Architecture Pattern:**
- Functional components with React Hooks
- Props-based state management (no Redux)
- Guest + Authenticated user hybrid cart
- Router-based code splitting
- Responsive design (mobile-first Chakra)

### Backend (Node.js + Express.js)

| Technology | Purpose | Version |
|-----------|---------|---------|
| Node.js | Runtime | 18+ |
| Express.js | REST API framework | 4.x |
| mysql2/promise | Database driver | 3.6.5 |
| redis | In-memory cache client | 4.x |
| jsonwebtoken | JWT auth token | 9.0.3 |
| bcryptjs | Password hashing | 2.4.3 |
| dotenv | Environment config | Latest |
| cors | Cross-origin support | Latest |

**Architecture Pattern:**
- Express middleware chain
- MVC-inspired routing (`/api/v1/*` endpoints)
- Service layer for business logic
- Connection pooling (10 max connections)
- No ORM (raw SQL with parameterized queries)
- Async/await error handling

### Database (MySQL 8.0)

**Location:** Docker container (internal only, no external port exposure)
**Connection Pool:** Max 10 concurrent connections
**Query Type:** Parameterized queries (prevent SQL injection)
**Tables:** 6 tables with foreign keys and indexes

**Schema Overview:**
```
restaurants (1) ──→ (N) categories
                      ↓
                   products ◄─── product_ratings
                      │
                      └──→ assets

users (1) ──→ (N) product_ratings
```

### Cache (Redis 7)

**Location:** Docker container (internal only, no external port exposure)
**Purpose:** Cart persistence + session caching
**Data Structure:** Key-value store
**TTL:** 30 days for cart items
**Storage Format:** JSON serialized cart objects with productId, quantity, name, price

---

## Data Flow: Complete Request Cycle

### 1. User Views Homepage (GET /api/v1/restaurant + /api/v1/categories + /api/v1/products)

```
[React Component]
     ↓ useEffect
[Axios GET /api/v1/restaurant]
     ↓
[Express Route Handler]
     ↓ SELECT * FROM restaurants
[MySQL Connection Pool]
     ↓ InnoDB SELECT
[Database Row]
     ↓ JSON serialization
[API Response {success, data}]
     ↓ Axios interceptor
[React State Update]
     ↓
[Re-render with data]
```

**Files Involved:**
- Frontend: [frontend/src/pages/HomePage.js](frontend/src/pages/HomePage.js) (useEffect hook)
- Backend: [backend/server.js](backend/server.js) (GET /api/v1/restaurant route)
- Database: MySQL restaurants table

---

### 2. User Clicks "Add to Cart" (POST /api/v1/cart)

```
[React Component Button]
     ↓ onClick handler
[setCart(prev => [...prev, item])] (Local state)
     ↓ Axios POST /api/v1/cart
[Express Auth Middleware]
     ↓ Verify JWT or generate guest ID
[Express Route Handler]
     ↓ Validate item exists
[MySQL Query: SELECT * FROM products WHERE id = ?]
     ↓
[Redis LPUSH cart:userId item]
     ↓ SET EX cart:userId 2592000 (30 days)
[API Response {success, items}]
     ↓ Axios interceptor stores response
[React setCart state update]
     ↓
[UI Cart Button Updates]
```

**Key Points:**
- Cart items stored in Redis (not database)
- Multiple items with same productId increment quantity
- Guest users get temporary Redis keys (cart:guest_*)
- Authenticated users get persistent Redis keys (cart:user_*)
- 30-day TTL ensures data cleanup

---

### 3. User Logs In (POST /api/v1/auth/login)

```
[React LoginModal Form]
     ↓ Form Submit
[Axios POST {email, password}]
     ↓
[Express Route Handler]
     ↓ SELECT * FROM users WHERE email = ?
[MySQL User Row]
     ↓ bcryptjs.compare(inputPassword, hashedPassword)
     ↓ JWT sign({id, email}, JWT_SECRET) → token
[Response {success, token, user}]
     ↓ Axios interceptor saves to cookie
[React setIsAuthenticated(true)]
     ↓ Route to HomePage
```

**Security Features:**
- Passwords hashed with bcrypt (never plain text)
- JWT tokens signed with secret
- HTTPOnly cookies prevent XSS attacks
- Tokens expire after 7 days
- Backend validates JWT on protected routes

---

### 4. User Submits Checkout (POST /api/v1/cart/checkout)

```
[CartDrawer Component]
     ↓ Form validation (address, payment)
[Axios POST {items, address, paymentMethod, couponCode}]
     ↓
[Express Auth Middleware] (JWT required)
     ↓ Extract userId from token
[Business Logic: Calculate total with coupon]
     ↓ Validate inventory (future feature)
[Redis DEL cart:userId] (Clear cart)
     ↓ INSERT INTO orders (future table)
[Email notification (future feature)]
[Response {success, orderId}]
     ↓ React Navigation
[Success Page / Email Confirmation]
```

**Future Enhancement:** Orders table for order history

---

## Authentication Flow

### Guest User
- No registration required
- Cart stored in Redis with temporary key (cart:guest_abc123xyz)
- Expires after 30 days of inactivity
- Limited to cart functionality

### Registered User
- Registration: [Sign Up] → Email + Password → MySQL users table
- Login: [Sign In] → Email + Password → bcrypt verify → JWT token → Cookie
- JWT Token: Stored in HTTPOnly cookie, sent in Authorization header
- Persistent Cart: Stored in Redis under cart:user_specific_id
- Survives browser refresh

### JWT Token Structure
```javascript
Header: { alg: 'HS256', typ: 'JWT' }

Payload: {
  id: "user_abc123xyz",        // User ID
  email: "user@example.com",
  iat: 1673456789,              // Issued at
  exp: 1673543189               // 7 days expiry
}

Signature: HMAC-SHA256(
  header + payload, 
  JWT_SECRET
)
```

### Auth Middleware
```javascript
// backend/server.js - Auth verification
app.use('/api/v1/:action', (req, res, next) => {
  if (req.path.includes('auth/')) return next(); // Public routes
  
  const token = req.cookies.token;
  
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (!err) req.userId = decoded.id;
    });
  } else {
    req.userId = req.cookies.guestId || generateId();
  }
  next();
});
```

---

## File Structure & Responsibilities

### Frontend
```
frontend/src/
├── App.js                          # Router entry, global Header/LoginModal
├── pages/
│   ├── HomePage.js                 # Categories, products grid
│   └── ProductDetail.js            # Product detail + quantity selector
├── components/
│   ├── Header.js                   # Navigation, cart, auth buttons
│   ├── HeroBanner.js               # Restaurant hero section
│   ├── CategoriesGrid.js           # 4-column category layout
│   ├── ProductsGrid.js             # Products with RouterLink to detail
│   ├── CartDrawer.js               # Main checkout drawer
│   ├── LoginModal.js               # Auth forms (login + register)
│   └── checkout/                   # Checkout sub-components
│       ├── AddressForm.js          # Address fields
│       ├── CartItems.js            # Cart items display
│       ├── CartSummary.js          # Total calculation
│       ├── CouponsSection.js       # Coupon input
│       └── PaymentSelector.js      # Payment method dropdown
└── api/ (or direct Axios calls)    # HTTP utilities
```

### Backend
```
backend/
├── server.js                       # Express app, routes, middleware
├── db.js                           # MySQL connection pool
├── initDB.js                       # Auto schema creation + seeding
├── .env                            # Configuration (git ignored)
├── package.json                    # Dependencies
└── routes/ (future refactoring)
    ├── auth.js                     # POST /auth/register, /auth/login
    ├── products.js                 # GET /products, /products/:id
    ├── cart.js                     # Cart operations
    └── restaurants.js              # GET /restaurant
```

### Docker Compose Services
```yaml
services:
  mysql:
    image: mysql:8.0
    ports: []                        # No external exposure
    volumes:
      - mysql_data:/var/lib/mysql
    environment:
      - MYSQL_DATABASE=food_delivery
      - MYSQL_USER=app_user
      - MYSQL_PASSWORD=app_password_12345

  redis:
    image: redis:7-alpine
    ports: []                        # No external exposure
    command: redis-server --appendonly yes

  backend:
    build: ./backend
    ports:
      - "5000:5000"                  # Exposed to localhost
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      - DB_HOST=mysql
      - REDIS_HOST=redis
      - JWT_SECRET=${JWT_SECRET}

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"                  # Exposed to localhost
    depends_on:
      - backend
```

---

## Request/Response Format

### Standard API Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Product Name",
    ...
  },
  "error": null
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": "User not found"
}
```

### HTTP Status Codes
- **200:** Success - Request successful
- **201:** Created - Resource created
- **400:** Bad Request - Invalid parameters
- **401:** Unauthorized - Missing/invalid JWT
- **404:** Not Found - Resource not found
- **500:** Server Error - Unexpected error

---

## Performance & Scalability

### Current Optimization
- **MySQL Connection Pool:** 10 concurrent connections (prevents exhaustion)
- **Indexes:** On category_id, price, email (fast queries)
- **Redis Caching:** Cart persistence (no DB queries on cart add)
- **JWT Stateless Auth:** No session server-side storage needed
- **Lazy Loading:** React Router splits code by route

### Database Query Performance
```sql
-- Indexed queries (< 10ms)
SELECT * FROM products WHERE category_id = 1;
SELECT * FROM users WHERE email = 'user@example.com';

-- Full table scan (slower, cache in Redis)
SELECT COUNT(*) FROM products;
```

### Future Scaling Steps
1. **Read Replicas:** MySQL slave for analytics queries
2. **API Caching:** Redis for /api/v1/products (1 hour TTL)
3. **CDN:** Serve images from CloudFront/similar
4. **Load Balancer:** Nginx reverse proxy for multiple backend instances
5. **Database Sharding:** Users by ID ranges (if millions of users)

---

## Security Measures

| Layer | Measure | Implementation |
|-------|---------|-----------------|
| Network | No external ports | MySQL/Redis not exposed (internal only) |
| Transport | HTTPOnly Cookies | JWT stored in httpOnly flag |
| Auth | Password Hashing | bcryptjs (10 salt rounds) |
| API | Parameterized Queries | mysql2 `?` placeholders prevent SQL injection |
| CORS | Cross-origin control | CORS middleware whitelist localhost:3000 |
| Input | Validation | Email regex, password strength checks |
| Secrets | Environment variables | .env (never committed) for DB_PASSWORD, JWT_SECRET |

---

## Deployment Architecture

### Local Development (Docker Compose)
```
Host Machine (localhost)
├── Port 3000 ──→ Frontend Container
├── Port 5000 ──→ Backend Container
└── Containers Connected via food-delivery-network
    ├── mysql:3306 (internal only)
    └── redis:6379 (internal only)
```

### Production (Future)
- **Container Orchestration:** Kubernetes or ECS
- **Load Balancer:** Distribute traffic across backend replicas
- **SSL/TLS:** HTTPS encryption
- **CDN:** Cloudfront for static assets
- **Monitoring:** CloudWatch / Datadog for logs
- **Auto-scaling:** Based on CPU/memory metrics

---

## Key Architectural Decisions

### 1. No External Port Exposure for Databases
- ✅ Benefit: Prevents unauthorized access
- ✅ Benefit: Forces containers to use internal DNS (mysql, redis)
- ✅ Benefit: Simpler security model
- ✅ Benefit: No port conflicts on host machine

### 2. Guest + Auth Hybrid Cart
- ✅ Benefit: No login required to browse
- ✅ Benefit: Users can save cart 30 days (Redis TTL)
- ✅ Benefit: Persists across browser sessions
- ✅ Benefit: Registered users get permanent cart

### 3. Redis for Cart (not MySQL)
- ✅ Benefit: Fast key-value access (< 1ms)
- ✅ Benefit: No schema changes, flexible JSON storage
- ✅ Benefit: Automatic expiry (TTL)
- ✅ Benefit: Cart operations don't block other queries

### 4. JWT Stateless Auth
- ✅ Benefit: No session table needed
- ✅ Benefit: Scales horizontally (no sticky sessions)
- ✅ Benefit: Tokens can be validated by any backend instance
- ✅ Benefit: Reduced server memory usage

### 5. Single-Service Restaurant Format
- ✅ Benefit: Simplified product management
- ✅ Benefit: No restaurant selection UI
- ✅ Benefit: Faster queries (1 hardcoded restaurant ID)
- ✅ Benefit: Future migration to multi-restaurant easier

---

## Monitoring & Logging

### Application Health Checks
```bash
# Frontend availability
curl http://localhost:3000

# Backend availability
curl http://localhost:5000/api/v1/restaurant

# Database connectivity
docker exec backend node -e "const db = require('./db'); db.query('SELECT 1').then(r => console.log(r))"
```

### Logs & Debugging
```bash
# Backend logs
docker logs food-delivery-backend -f

# Database logs
docker exec mysql tail -f /var/log/mysql/error.log

# Redis logs
docker logs food-delivery-redis
```

### Performance Metrics
- API Response Time: target < 100ms
- Database Query Time: target < 10ms
- Frontend Bundle Size: target < 500KB
- Time to Interactive (TTI): target < 3s

---

## Future Enhancements

### Phase 2 (Orders & History)
- [ ] Orders table in MySQL
- [ ] Order history page
- [ ] Order notifications via email/SMS
- [ ] Order tracking (real-time status)

### Phase 3 (Advanced Features)
- [ ] Product reviews and ratings
- [ ] Image upload for user avatars
- [ ] Multiple restaurant support
- [ ] Real-time delivery tracking (WebSocket)

### Phase 4 (Analytics)
- [ ] Order analytics dashboard
- [ ] Revenue reports
- [ ] Popular products tracking
- [ ] User behavior analytics

---

## Related Documentation

- [README.md](../README.md) - Project overview & getting started
- [API.md](API.md) - API endpoint documentation
- [DATABASE.md](DATABASE.md) - Database schema & tables
- [MYSQL_SETUP.md](MYSQL_SETUP.md) - MySQL connection & backup procedures

