# URL Shortener - Production-Grade Application

A full-stack URL shortener built with modern technologies, designed for scalability and production use.  Create short, memorable URLs and track their performance with detailed analytics.

![URL Shortener](https://img.shields.io/badge/Status-Production%20Ready-green)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Features

### Core Functionality
- **URL Shortening**: Convert long URLs into short 7-character codes (62^7 = 3. 5 trillion combinations)
- **Fast Redirects**: Sub-millisecond redirects with Redis caching
- **Click Tracking**: Real-time analytics with device type, referrer, and IP tracking
- **User Authentication**: Secure JWT-based authentication with HTTP-only cookies
- **Dashboard**: Manage all your URLs with pagination, search, and statistics
- **Copy to Clipboard**: One-click copying of shortened URLs

### Technical Highlights
- **Pre-generated Short Codes**: 100K+ codes pre-generated for instant URL creation
- **Atomic Operations**: PostgreSQL `FOR UPDATE SKIP LOCKED` for concurrency safety
- **Redis Caching**:  LRU cache with 24-hour TTL for fast lookups
- **Rate Limiting**: Per-endpoint and per-user rate limiting
- **Background Jobs**: Async click tracking with batch processing
- **Monitoring**: Prometheus metrics for observability
- **Usage Limits**: 100 URLs per free user with upgrade prompts

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Design Decisions](#design-decisions)
- [Known Limitations](#known-limitations)
- [Future Enhancements](#future-enhancements)

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **TypeScript** | Type safety and better DX |
| **Express.js** | Web framework |
| **PostgreSQL** | Primary database (ACID compliance) |
| **Redis** | Caching and rate limiting |
| **JWT** | Authentication tokens |
| **bcrypt** | Password hashing (12 rounds) |
| **Zod** | Runtime validation |
| **Prometheus** | Metrics and monitoring |

### Frontend
| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling |
| **Axios** | HTTP client |
| **Context API** | State management |
| **Lucide React** | Icon library |

### DevOps
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **GitHub Actions** | CI/CD (optional) |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                            CLIENT                                │
│                     (Browser / Mobile App)                       │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCER                               │
│                   (Nginx / AWS ALB)                              │
└─────────────────────────────────────────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
┌───────────────────────────┐   ┌────────────────────────────────┐
│   FRONTEND (Next.js)      │   │    BACKEND (Node.js)           │
│   - SSR/SSG               │   │    - Express API               │
│   - React Components      │   │    - JWT Auth                  │
│   - Client State          │   │    - Business Logic            │
└───────────────────────────┘   └─────────────────────────��──────┘
                                            │
                         ┌──────────────────┼──────────────────┐
                         ▼                  ▼                  ▼
              ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
              │    REDIS     │  │ PostgreSQL   │  │  Background  │
              │   (Cache)    │  │  (Primary)   │  │    Jobs      │
              └──────────────┘  └──────────────┘  └──────────────┘
```

### Key Design Patterns
- **Repository Pattern**: Separation of data access logic
- **Service Layer**:  Business logic encapsulation
- **Singleton Pattern**: Single instances of services
- **Factory Pattern**: URL creation with pre-generated codes
- **Observer Pattern**: Click tracking with event buffering

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**:  v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Docker**: v20.0.0 or higher
- **Docker Compose**: v2.0.0 or higher
- **Git**: v2.30.0 or higher

---

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/url-shortener.git
cd url-shortener
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Set Up Environment Variables

#### Backend

```bash
cd backend
cp .env.example . env
```

Edit `.env`:

```env
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/urlshortener

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars-long
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Short URL Configuration
SHORT_URL_BASE=http://localhost:3001
SHORT_CODE_LENGTH=7

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_URL_CREATE=10
RATE_LIMIT_REDIRECT=1000

# User Limits
MAX_URLS_PER_USER=100

# Cache Configuration (TTL in seconds)
CACHE_URL_TTL=86400
CACHE_USER_LIMIT_TTL=3600

# Click Processing
CLICK_BATCH_SIZE=100
CLICK_PROCESS_INTERVAL_MS=5000
```

#### Frontend

```bash
cd ../frontend
cp .env.local. example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SHORT_URL_BASE=http://localhost:3001
```

---

## 🚀 Running the Application

### Option 1: Using Docker Compose (Recommended)

```bash
# Start all services (postgres, redis, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Option 2: Manual Setup

#### 1. Start PostgreSQL and Redis

```bash
docker-compose up -d postgres redis
```

#### 2. Seed the Short Code Pool

```bash
cd backend
npm run seed: keys  # Generates 100,000 unique codes
```

#### 3. Start Backend

```bash
cd backend
npm run dev
```

Backend will be available at `http://localhost:3001`

#### 4. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at `http://localhost:3000`

---

## 🌐 Accessing the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | User interface |
| **Backend API** | http://localhost:3001 | REST API |
| **Health Check** | http://localhost:3001/api/health | Service status |
| **Metrics** | http://localhost:3001/metrics | Prometheus metrics |

---

## 📚 API Documentation

### Base URL

```
http://localhost:3001/api
```

### Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication

##### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "urlCount": 0,
      "createdAt": "2026-01-06T10:00:00.000Z"
    },
    "token": "jwt_token"
  }
}
```

##### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password":  "Password123"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt_token"
  }
}
```

##### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "user": {
      "id":  "uuid",
      "email":  "user@example.com",
      "urlCount": 5,
      "createdAt":  "2026-01-06T10:00:00.000Z"
    }
  }
}
```

##### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

#### URL Management

##### Create Short URL
```http
POST /api/urls
Authorization: Bearer <token>
Content-Type: application/json

{
  "originalUrl": "https://example.com/very-long-url"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "id": "uuid",
    "shortCode": "aB3xK9m",
    "shortUrl": "http://localhost:3001/aB3xK9m",
    "originalUrl": "https://example.com/very-long-url",
    "clickCount":  0,
    "isActive": true,
    "createdAt": "2026-01-06T10:00:00.000Z"
  }
}
```

##### List URLs
```http
GET /api/urls? page=1&limit=10
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "urls": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    },
    "meta": {
      "urlCount": 25,
      "urlLimit": 100,
      "remainingUrls": 75
    }
  }
}
```

##### Get Single URL
```http
GET /api/urls/: id
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "id": "uuid",
    "shortCode": "aB3xK9m",
    "shortUrl": "http://localhost:3001/aB3xK9m",
    "originalUrl": "https://example.com/very-long-url",
    "clickCount": 42,
    "isActive": true,
    "createdAt":  "2026-01-06T10:00:00.000Z"
  }
}
```

##### Delete URL
```http
DELETE /api/urls/:id
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "message": "URL deleted successfully"
  }
}
```

##### Get Pool Statistics
```http
GET /api/urls/stats/pool
Authorization: Bearer <token>

Response (200 OK):
{
  "success": true,
  "data": {
    "pool": {
      "total": 100000,
      "used": 250,
      "available": 99750
    }
  }
}
```

#### Redirect

##### Redirect to Original URL
```http
GET /:shortCode

Response (302 Found):
Location: https://example.com/very-long-url
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
```

##### Preview URL (No Redirect)
```http
GET /api/preview/:shortCode

Response (200 OK):
{
  "success": true,
  "data":  {
    "originalUrl": "https://example.com/very-long-url",
    "shortCode": "aB3xK9m"
  }
}
```

### Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message":  "Human-readable error message",
    "details": [] // Optional validation errors
  }
}
```

Common error codes:
- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_ERROR` (500)

---

## 🗄 Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────────────┐
│     users       │         │         urls            │
├─────────────────┤         ├─────────────────────────┤
│ id (PK)         │◄────────│ id (PK)                 │
│ email (UNIQUE)  │    1: N  │ user_id (FK)            │
│ password_hash   │         │ short_code (UNIQUE)     │
│ url_count       │         │ original_url            │
│ created_at      │         │ click_count             │
│ updated_at      │         │ is_active               │
└─────────────────┘         │ expires_at              │
                            │ created_at              │
                            │ updated_at              │
                            └─────────────────────────┘
                                       │ 1:N
                                       ▼
                            ┌─────────────────────────┐
                            │    click_events         │
                            ├─────────────────────────┤
                            │ id (PK)                 │
                            │ url_id (FK)             │
                            │ clicked_at              │
                            │ ip_address              │
                            │ user_agent              │
                            │ referer                 │
                            │ device_type             │
                            └─────────────────────────┘

┌──────────────────────┐
│ short_code_pool      │
├──────────────────────┤
│ id (PK)              │
│ short_code (UNIQUE)  │
│ is_used              │
│ used_at              │
│ created_at           │
└─────��────────────────┘
```

### Tables

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    url_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### short_code_pool
```sql
CREATE TABLE short_code_pool (
    id SERIAL PRIMARY KEY,
    short_code VARCHAR(7) NOT NULL UNIQUE,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### urls
```sql
CREATE TABLE urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    short_code VARCHAR(7) NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    click_count BIGINT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### click_events
```sql
CREATE TABLE click_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_id UUID NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent VARCHAR(512),
    referer VARCHAR(2048),
    country_code VARCHAR(2),
    device_type VARCHAR(20)
);
```

### Indexes

- `idx_users_email` on `users(email)`
- `idx_short_code_pool_unused` on `short_code_pool(is_used)` WHERE `is_used = FALSE`
- `idx_urls_short_code` on `urls(short_code)`
- `idx_urls_user_id_created` on `urls(user_id, created_at DESC)`
- `idx_click_events_url_id` on `click_events(url_id)`

---

## 🧪 Testing

### Manual Testing

#### 1. Test Authentication Flow

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password":  "Password123"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":  "test@example.com", "password": "Password123"}'

# Save the token from the response
TOKEN="your_token_here"

# Get current user
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

#### 2. Test URL Creation

```bash
# Create short URL
curl -X POST http://localhost:3001/api/urls \
  -H "Authorization:  Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://github.com/features/copilot"}'

# List URLs
curl "http://localhost:3001/api/urls?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

#### 3. Test Redirect

```bash
# Test redirect (follow redirects)
curl -L http://localhost:3001/aB3xK9m

# Test redirect (see headers)
curl -I http://localhost:3001/aB3xK9m
```

#### 4. Test Rate Limiting

```bash
# Hit the same endpoint rapidly
for i in {1..15}; do
  curl -X POST http://localhost:3001/api/urls \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"originalUrl": "https://example.com"}'
done
# Should see 429 after 10 requests
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value (min 32 characters)
- [ ] Update `CORS_ORIGIN` to your production domain
- [ ] Update `SHORT_URL_BASE` to your production domain
- [ ] Set `NODE_ENV=production`
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure monitoring (Prometheus + Grafana)
- [ ] Set up logging (Winston, Sentry)
- [ ] Configure rate limits based on your needs
- [ ] Review and adjust cache TTLs
- [ ] Set up CI/CD pipeline
- [ ] Configure domain and DNS
- [ ] Set up CDN for frontend assets

### Docker Production Build

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Environment-Specific Configurations

#### Development
- Debug logging enabled
- Hot reload for frontend/backend
- Verbose error messages
- Mock data available

#### Production
- Error logging only
- Optimized builds
- Generic error messages
- Rate limiting enforced
- HTTPS required

---

## 📁 Project Structure

```
url-shortener/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration (DB, Redis, env)
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── services/        # Business logic
│   │   ├── repositories/    # Data access layer
│   │   ├── jobs/            # Background jobs
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript types
│   │   ├── db/              # Database schema
│   │   ├── scripts/         # Utility scripts
│   │   └── app.ts           # Application entry point
│   ├── tests/               # Test files
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── . env. example
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js app router pages
│   │   ├── components/      # React components
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── auth/        # Auth-related components
│   │   │   ├── dashboard/   # Dashboard components
│   │   │   └── layout/      # Layout components
│   │   ├── context/         # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.js
│   ├── Dockerfile
│   └── .env.local. example
│
├── docker-compose.yml       # Development compose file
├── docker-compose.prod.yml  # Production compose file
├── . gitignore
└── README.md
```

---

## 💡 Design Decisions

### 1. Pre-Generated Short Codes

**Decision**: Generate 100K+ short codes in advance

**Rationale**:
- Zero collision risk during URL creation
- Consistent O(1) performance
- Atomic acquisition using PostgreSQL `FOR UPDATE SKIP LOCKED`
- Predictable behavior under high load

**Trade-off**: Requires initial seeding step

### 2. PostgreSQL Over NoSQL

**Decision**: Use PostgreSQL as primary database

**Rationale**:
- ACID compliance for data integrity
- Complex queries support (pagination, filtering)
- Mature ecosystem and tooling
- With proper indexing + caching, handles 100K+ reads/sec
- Free and open-source

**Trade-off**:  Slightly more complex than NoSQL for simple key-value lookups (mitigated by Redis cache)

### 3. Redis Caching Strategy

**Decision**: Cache-aside pattern with 24-hour TTL

**Rationale**:
- 90%+ cache hit rate (Zipf's law - popular URLs accessed frequently)
- Sub-millisecond redirect latency for cached URLs
- Automatic eviction with LRU policy
- Handles cache failures gracefully (fail-open)

**Trade-off**: Potential stale data (mitigated by reasonable TTL)

### 4. Async Click Tracking

**Decision**: Buffer clicks in Redis, batch process to database

**Rationale**: 
- Non-blocking redirects (no DB write on hot path)
- Reduced database load (batch inserts)
- Handles traffic spikes gracefully
- Maintains click order with timestamps

**Trade-off**: Potential data loss if Redis crashes (acceptable for analytics)

### 5. JWT with HTTP-Only Cookies

**Decision**:  Store JWT in HTTP-only cookies instead of localStorage

**Rationale**: 
- Protection against XSS attacks
- Automatic inclusion in requests
- Secure flag for HTTPS-only transmission

**Trade-off**: Requires CORS configuration

### 6. Rate Limiting Per Endpoint

**Decision**: Different rate limits for different endpoints

**Rationale**:
- Redirect endpoint: High limit (1000/min) - user-facing
- URL creation: Low limit (10/min) - prevents abuse
- Auth:  Very low limit (5/15min) - prevents brute force

**Trade-off**: More complex configuration

### 7. 302 Over 301 Redirects

**Decision**: Use 302 (temporary) instead of 301 (permanent)

**Rationale**: 
- Allows click tracking on every visit
- Browsers don't cache 302 redirects
- Enables analytics and monitoring

**Trade-off**: Slightly higher server load (acceptable with caching)

---

## ⚠️ Known Limitations

### Current Limitations

1. **Single Region Deployment**
   - No multi-region support yet
   - Higher latency for distant users
   - **Mitigation**: Use CDN for static assets, deploy closer to users

2. **No Custom Domains**
   - All short URLs use same base domain
   - **Future**: Add custom domain support per user

3. **Basic Analytics**
   - Only tracks total clicks, not detailed analytics
   - **Future**: Add geographic, device, and time-based analytics

4. **No QR Codes**
   - Cannot generate QR codes for short URLs
   - **Future**: Add QR code generation API

5. **No Expiration Management**
   - URLs don't auto-expire (schema supports it)
   - **Future**: Add TTL-based expiration

6. **No Bulk Operations**
   - Cannot create/delete multiple URLs at once
   - **Future**: Add batch API endpoints

7. **No Link Preview**
   - No Open Graph metadata scraping
   - **Future**: Add link preview generation

8. **Limited User Management**
   - No password reset or email verification
   - **Future**: Add email-based flows

### Scalability Considerations

**At 1M requests/day:**
- Current architecture handles this easily
- Redis cache hit rate ~95%
- Database:  <100 writes/sec

**At 100M requests/day:**
- Need:  Multiple Redis instances (sharding)
- Need: Read replicas for PostgreSQL
- Need: Horizontal scaling of backend (load balancer)
- Need: CDN for static assets

**At 1B requests/day:**
- Need: Distributed caching (Redis Cluster)
- Need: Database sharding by user_id
- Need: Separate click analytics pipeline
- Need: Multi-region deployment

---

## 🚀 Future Enhancements

### Short-term (Next Sprint)

- [ ] Email verification
- [ ] Password reset flow
- [ ] Custom short codes (user-defined)
- [ ] Bulk URL creation
- [ ] Export URLs to CSV
- [ ] Dark mode

### Medium-term (Next Quarter)

- [ ] Custom domains per user
- [ ] Detailed analytics dashboard
  - Geographic data
  - Device breakdown
  - Referrer analysis
  - Time-series charts
- [ ] QR code generation
- [ ] Link expiration (TTL)
- [ ] Link preview with Open Graph
- [ ] Teams/organizations
- [ ] Role-based access control

### Long-term (Future)

- [ ] API access keys for developers
- [ ] Webhooks for click events
- [ ] A/B testing (multiple destinations)
- [ ] UTM parameter builder
- [ ] Branded links
- [ ] Link bundles (multiple URLs)
- [ ] Browser extension
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with recommended rules
- **Formatting**: Prettier (2 spaces, single quotes)
- **Commits**: Conventional commits format

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- [TinyURL](https://tinyurl.com/) and [Bitly](https://bitly.com/) for inspiration
- [Next.js](https://nextjs.org/) team for an amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Lucide Icons](https://lucide.dev/) for beautiful icons
- PostgreSQL and Redis communities

---

## 📞 Support

If you encounter any issues or have questions: 

1. Check the [Known Limitations](#known-limitations) section
2. Search existing [GitHub Issues](https://github.com/yourusername/url-shortener/issues)
3. Create a new issue with: 
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details

---

**Happy URL Shortening!  🚀**