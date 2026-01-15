<div align="center">

# 🏪 Store Rating Platform

### A Production-Ready Full-Stack Web Application

[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-14+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Express](https://img.shields.io/badge/Express.js-4+-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

**A comprehensive store rating system with role-based access control, real-time analytics, and enterprise-grade security.**

[Features](#-key-features) • [Architecture](#-system-architecture) • [Quick Start](#-quick-start) • [API Docs](#-api-documentation) • [Testing](#-testing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Database Design](#-database-design)
- [Quick Start](#-quick-start)
- [User Flows](#-user-flows)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Security](#-security)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

---

## 🎯 Overview

The **Store Rating Platform** is a full-stack web application that enables users to discover, rate, and manage stores. Built with modern technologies and best practices, it features a robust authentication system, role-based access control, and comprehensive testing coverage.

### 🎥 Demo Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| 🔴 **Admin** | admin@test.com | Admin@123 | Full platform control |
| 🟢 **Store Owner** | owner@test.com | Owner@123 | Store management |
| 🔵 **Normal User** | alice@test.com | User@123 | Browse & rate stores |

---

## ✨ Key Features

<table>
<tr>
<td width="33%" valign="top">

### 👥 Role-Based Access
- **System Administrator**
  - User & store management
  - Platform analytics
  - Full CRUD operations
  
- **Store Owner**
  - View store ratings
  - Customer insights
  - Performance metrics
  
- **Normal User**
  - Browse stores
  - Submit ratings
  - Update reviews

</td>
<td width="33%" valign="top">

### 🔐 Security First
- JWT authentication
- Bcrypt password hashing
- Role-based authorization
- Input validation
- SQL injection prevention
- XSS protection

</td>
<td width="33%" valign="top">

### 🚀 Performance
- Real-time calculations
- Optimized queries
- Efficient caching
- Fast search & filter
- Responsive UI
- 277 passing tests

</td>
</tr>
</table>

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Frontend]
        A1[Components]
        A2[Pages]
        A3[Context/State]
        A --> A1
        A --> A2
        A --> A3
    end
    
    subgraph "API Layer"
        B[Express.js Server]
        B1[Routes]
        B2[Controllers]
        B3[Middleware]
        B --> B1
        B --> B2
        B --> B3
    end
    
    subgraph "Business Logic"
        C[Services Layer]
        C1[User Service]
        C2[Store Service]
        C3[Rating Service]
        C4[Auth Service]
        C --> C1
        C --> C2
        C --> C3
        C --> C4
    end
    
    subgraph "Data Layer"
        D[Prisma ORM]
        E[(PostgreSQL)]
        D --> E
    end
    
    A -->|HTTP/REST| B
    B --> C
    C --> D
    
    style A fill:#61DAFB,stroke:#333,stroke-width:2px,color:#000
    style B fill:#339933,stroke:#333,stroke-width:2px,color:#fff
    style C fill:#FF6B6B,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#2D3748,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#4169E1,stroke:#333,stroke-width:2px,color:#fff
```

### 🔄 Request Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Server
    participant M as Middleware
    participant S as Service Layer
    participant D as Database
    
    U->>F: Interact with UI
    F->>A: HTTP Request + JWT
    A->>M: Validate Token
    M->>M: Check Authorization
    M->>A: Token Valid
    A->>S: Process Business Logic
    S->>D: Query Database
    D->>S: Return Data
    S->>A: Format Response
    A->>F: JSON Response
    F->>U: Update UI
```

---

## 🛠️ Tech Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react&logoColor=black)
![React Router](https://img.shields.io/badge/React_Router-6.x-CA4245?style=flat-square&logo=react-router&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-1.x-5A29E4?style=flat-square&logo=axios&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-14+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-4169E1?style=flat-square&logo=postgresql&logoColor=white)

### Security & Auth
![JWT](https://img.shields.io/badge/JWT-9.0-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![Bcrypt](https://img.shields.io/badge/Bcrypt-5.x-003A70?style=flat-square&logo=letsencrypt&logoColor=white)

### Testing
![Jest](https://img.shields.io/badge/Jest-29.x-C21325?style=flat-square&logo=jest&logoColor=white)
![Fast-check](https://img.shields.io/badge/Fast--check-PBT-FF6B6B?style=flat-square)

</div>

---

## 💾 Database Design

```mermaid
erDiagram
    USER ||--o{ RATING : creates
    STORE ||--o{ RATING : receives
    USER ||--o| STORE : owns
    
    USER {
        int id PK
        string name
        string email UK
        string password
        string address
        enum role
        int storeId FK
        datetime createdAt
        datetime updatedAt
    }
    
    STORE {
        int id PK
        string name
        string email
        string address
        float averageRating
        datetime createdAt
        datetime updatedAt
    }
    
    RATING {
        int id PK
        int value
        int userId FK
        int storeId FK
        datetime createdAt
        datetime updatedAt
    }
```

### 📊 Database Schema Details

| Entity | Description | Key Constraints |
|--------|-------------|-----------------|
| **User** | System users with roles | Unique email, Role enum |
| **Store** | Store information | Calculated average rating |
| **Rating** | User ratings for stores | Unique (userId, storeId) |

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js >= 14.x
PostgreSQL >= 12.x
npm >= 6.x
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/rushikeshnandre/store-rating-platform.git
cd store-rating-platform

# 2. Install server dependencies
cd server
npm install

# 3. Install client dependencies
cd ../client
npm install

# 4. Set up environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# Edit server/.env with your database credentials
# DATABASE_URL="postgresql://username:password@localhost:5432/store_rating_db"
# JWT_SECRET="your-secure-secret-key"

# 5. Set up database
cd server
npx prisma migrate dev
npx prisma generate

# 6. Seed test data (optional)
node seed-test-data.js
```

### Running the Application

```bash
# Terminal 1: Start backend server
cd server
npm run dev
# Server: http://localhost:5000

# Terminal 2: Start frontend
cd client
npm start
# Frontend: http://localhost:3000
```

---

## 👥 User Flows

### 🔵 Normal User Flow

```mermaid
graph LR
    A[Register/Login] --> B[Browse Stores]
    B --> C[Search & Filter]
    C --> D[View Store Details]
    D --> E[Submit Rating]
    E --> F[Update Rating]
    F --> G[View My Ratings]
    
    style A fill:#4CAF50,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#FF9800,stroke:#333,stroke-width:2px,color:#fff
    style G fill:#2196F3,stroke:#333,stroke-width:2px,color:#fff
```

### 🟢 Store Owner Flow

```mermaid
graph LR
    A[Login] --> B[View Dashboard]
    B --> C[See Ratings]
    C --> D[View Statistics]
    D --> E[Analyze Feedback]
    E --> F[Update Profile]
    
    style A fill:#4CAF50,stroke:#333,stroke-width:2px,color:#fff
    style C fill:#FF9800,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#2196F3,stroke:#333,stroke-width:2px,color:#fff
```

### 🔴 Admin Flow

```mermaid
graph LR
    A[Login] --> B[View Dashboard]
    B --> C[Manage Users]
    B --> D[Manage Stores]
    C --> E[Create/Edit/Delete]
    D --> F[Create/Edit/Delete]
    E --> G[View Analytics]
    F --> G
    
    style A fill:#4CAF50,stroke:#333,stroke-width:2px,color:#fff
    style B fill:#FF9800,stroke:#333,stroke-width:2px,color:#fff
    style G fill:#9C27B0,stroke:#333,stroke-width:2px,color:#fff
```

---

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | User login | ❌ |
| POST | `/api/auth/logout` | User logout | ✅ |
| GET | `/api/auth/me` | Get current user | ✅ |

### User Management (Admin Only)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/users` | Create user | Admin |
| GET | `/api/users` | List all users | Admin |
| GET | `/api/users/:id` | Get user details | Admin |
| PUT | `/api/users/:id/password` | Update password | All |

### Store Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/stores` | Create store | Admin |
| GET | `/api/stores` | List stores | All |
| GET | `/api/stores/:id` | Get store details | All |

### Rating Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/api/ratings` | Submit rating | Normal User |
| PUT | `/api/ratings/:id` | Update rating | Normal User |
| GET | `/api/ratings/store/:storeId` | Get store ratings | Owner |

### Dashboard

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/dashboard/admin` | Admin statistics | Admin |
| GET | `/api/dashboard/owner` | Owner statistics | Owner |

---

## 🧪 Testing

### Test Coverage

```
✅ 277 Tests Passing
📊 Coverage: High
🔬 Property-Based Testing
🧩 Unit Tests
🔗 Integration Tests
```

### Running Tests

```bash
# Run all tests
cd server
npm test

# Run specific test file
npm test -- UserService.test.js

# Run with coverage
npm test -- --coverage

# Run property-based tests
npm test -- --testNamePattern="Property"
```

### Test Structure

```
server/src/
├── controllers/__tests__/
├── services/__tests__/
├── middleware/__tests__/
└── utils/__tests__/
```

---

## 🔒 Security

### Implemented Security Measures

| Feature | Implementation | Status |
|---------|----------------|--------|
| **Authentication** | JWT with httpOnly cookies | ✅ |
| **Password Hashing** | Bcrypt (12 salt rounds) | ✅ |
| **Authorization** | Role-based access control | ✅ |
| **Input Validation** | Frontend & Backend | ✅ |
| **SQL Injection** | Prisma ORM parameterized queries | ✅ |
| **XSS Protection** | Input sanitization | ✅ |
| **CORS** | Configured origins | ✅ |
| **Rate Limiting** | API throttling | ✅ |

### Validation Rules

```javascript
// Password: 8-16 chars, 1 uppercase, 1 special char
^(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$

// Email: Valid email format
^[^\s@]+@[^\s@]+\.[^\s@]+$

// Name: 20-60 characters
^.{20,60}$

// Rating: Integer 1-5
^[1-5]$
```

---

## 📁 Project Structure

```
store-rating-platform/
│
├── 📂 client/                      # React Frontend
│   ├── 📂 public/                  # Static assets
│   ├── 📂 src/
│   │   ├── 📂 components/          # Reusable UI components
│   │   │   ├── AddUserModal.js
│   │   │   ├── AddStoreModal.js
│   │   │   └── ...
│   │   ├── 📂 pages/               # Page components
│   │   │   ├── LoginPage.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── OwnerDashboard.js
│   │   │   ├── UserDashboard.js
│   │   │   └── ...
│   │   ├── 📂 context/             # React Context
│   │   │   └── AuthContext.js
│   │   ├── 📂 services/            # API services
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   └── ...
│   │   ├── 📂 utils/               # Utility functions
│   │   ├── App.js                  # Root component
│   │   └── index.js                # Entry point
│   ├── package.json
│   └── tailwind.config.js
│
├── 📂 server/                      # Express Backend
│   ├── 📂 prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── 📂 migrations/          # Database migrations
│   ├── 📂 src/
│   │   ├── 📂 controllers/         # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── storeController.js
│   │   │   └── ratingController.js
│   │   ├── 📂 middleware/          # Express middleware
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── validation.js
│   │   ├── 📂 routes/              # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── storeRoutes.js
│   │   │   └── ratingRoutes.js
│   │   ├── 📂 services/            # Business logic
│   │   │   ├── UserService.js
│   │   │   ├── StoreService.js
│   │   │   ├── RatingService.js
│   │   │   └── AuthService.js
│   │   ├── 📂 utils/               # Utility functions
│   │   │   ├── jwt.js
│   │   │   └── validation.js
│   │   └── server.js               # Server entry point
│   ├── package.json
│   ├── jest.config.js
│   └── seed-test-data.js
│
├── 📄 README.md                    # This file
├── 📄 .gitignore
└── 📄 LICENSE
```

---

## 🎨 Screenshots & Features

### 🔐 Authentication System
- Secure login/registration
- JWT token management
- Role-based redirects

### 📊 Admin Dashboard
- User management
- Store management
- Platform analytics
- Advanced filtering & sorting

### 🏪 Store Owner Dashboard
- Store ratings overview
- Customer feedback
- Performance metrics
- Average rating display

### 👤 Normal User Dashboard
- Browse all stores
- Search & filter stores
- Submit/update ratings
- View rating history

---

## 🚀 Deployment

### Environment Variables

```env
# Server (.env)
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="24h"
PORT=5000
NODE_ENV="production"

# Client (.env)
REACT_APP_API_URL="https://your-api-domain.com/api"
```

### Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Enable logging
- [ ] Set up monitoring
- [ ] Configure CDN for static assets

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Code Style

- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

<div align="center">

### **Rushikesh Bapu Randive**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/rushikeshnandre)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/rushikeshnandre)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:rushirandive09@gmail.com)

</div>

---

## 🙏 Acknowledgments

- Built with modern web development best practices
- Implements property-based testing for correctness
- Follows SOLID principles and clean architecture
- Comprehensive test coverage with Jest and fast-check
- Secure authentication and authorization patterns

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Made with ❤️ by Rushikesh Bapu Randive**

</div>
