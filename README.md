🛒 BerciiMart

Multi-Seller E-Commerce Marketplace

BerciiMart is a C++20-based multi-seller e-commerce marketplace developed as a capstone project.

The project uses PostgreSQL for persistent data storage and is being developed as a native C++ web application using Drogon, with a browser-based frontend planned for the Review-2 implementation.

The application covers core e-commerce operations including user authentication, product management, shopping carts, checkout, orders, and reviews.

---

📌 Project Status

Current Status: Review-2 Development

The project has progressed from the initial console-based implementation to the Drogon-based web application architecture.

Completed / Verified

- PostgreSQL database connectivity
- User registration and login
- Argon2id password hashing
- Product management foundation
- Shopping cart operations
- Quantity and stock validation
- Checkout and order creation
- Order history
- CMake build configuration
- vcpkg dependency management
- Drogon web server setup
- Local HTTP server running successfully on port "8080"
- Initial web API structure
- GitHub version control

In Progress

- Complete REST API implementation
- Buyer, Seller and Admin workflows
- Product search and category filtering
- Complete cart and checkout APIs
- Order and review APIs
- Browser frontend
- Integration between frontend and C++ backend
- Automated testing
- Production cloud deployment

---

✨ Main Features

👤 User Management

- User registration
- User login
- User logout
- Argon2id password hashing
- Secure password storage
- PostgreSQL-based user persistence

📦 Product Management

- Product listing
- Product information
- Product search
- Product CRUD foundation
- Stock management
- Category support

🛒 Shopping Cart

- Add products to cart
- View cart
- Update quantities
- Remove cart items
- Combine duplicate product entries
- Quantity validation
- Stock availability checking

🧾 Orders & Checkout

- Checkout
- Order total calculation
- Stock reduction
- Order item storage
- Order history
- Order management foundation

⭐ Reviews

The project includes a review and rating component for supporting product feedback and star ratings.

---

🏗️ Project Architecture

The application is being developed using a layered architecture:

                    Browser
                       │
                       ▼
              HTML / CSS / JavaScript
                       │
                       ▼
                 Drogon HTTP
                     Server
                       │
                       ▼
                  Controllers
                       │
                       ▼
                    Services
                       │
                       ▼
                 Repositories
                       │
                       ▼
                  PostgreSQL

This structure separates HTTP handling, business logic, database access, and data models.

---

📁 Project Structure

Berciimart/
│
├── .github/
│   └── workflows/
│
├── .vscode/
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
│
├── docs/
│
├── include/
│
├── src/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── model/
│   ├── dto/
│   ├── filter/
│   ├── plugin/
│   ├── util/
│   └── exception/
│
├── test/
│
├── CMakeLists.txt
├── README.md
├── vcpkg.json
└── .gitignore

---

🛠️ Technology Stack

Technology| Purpose
C++20| Application and backend development
Drogon| C++ HTTP web framework
PostgreSQL| Relational database
libpq| PostgreSQL client library
Argon2| Password hashing
CMake| Build configuration
Ninja| Build system
vcpkg| C/C++ dependency management
Git| Version control
GitHub| Source-code hosting
GitHub Actions| CI automation
Visual Studio Code| Development environment

---

🗄️ Database

BerciiMart uses PostgreSQL for persistent application data.

The project contains database schema, seed data, and migration files under:

database/

Core entities include:

- Users
- Products
- Categories
- Cart Items
- Orders
- Order Items
- Reviews

The database uses relational constraints such as primary keys, foreign keys, unique constraints, and validation rules.

---

🔐 Security

Security is an important part of the project.

BerciiMart includes:

- Argon2id password hashing
- Random salt generation
- No plaintext password storage
- Parameterized PostgreSQL queries
- Input validation
- Database constraints
- Separation of database credentials from application source code
- ".gitignore" protection for generated/build files

Password Flow

User Password
      │
      ▼
   Argon2id
      │
      ▼
Password Hash + Salt
      │
      ▼
   PostgreSQL

---

🌐 Local Web Application

The Drogon web server can currently be run locally using:

.\build\BerciiMart.exe

The local application is available at:

http://localhost:8080

The initial web server provides a basic BerciiMart response and health endpoint while the remaining marketplace APIs are being implemented.

---

🔨 Build Instructions

Requirements

Install the following before building:

- C++20 compatible compiler
- CMake 3.25+
- Ninja
- PostgreSQL
- vcpkg
- Drogon dependencies

Configure

cmake -S . -B build -G Ninja -DCMAKE_TOOLCHAIN_FILE=C:/vcpkg/scripts/buildsystems/vcpkg.cmake

Build

cmake --build build

Run

.\build\BerciiMart.exe

Then open:

http://localhost:8080

---

🧪 Testing

The project includes testing and verification for important application components, including:

- Database connectivity
- User registration
- User login
- Invalid login handling
- Product operations
- Cart operations
- Quantity validation
- Stock validation
- Checkout
- Order creation
- Order history
- Web server availability

Additional automated and HTTP-level testing will be expanded as the Review-2 implementation progresses.

---

☁️ Deployment Plan

The final application is intended to be deployed as a complete web application:

                    Internet
                       │
                       ▼
                  HTTPS / Nginx
                       │
                       ▼
                Drogon C++ Backend
                       │
                       ▼
                PostgreSQL Database

The production deployment will include:

- Linux cloud server
- Compiled C++ application
- PostgreSQL database
- systemd service
- Nginx reverse proxy
- HTTPS/TLS
- Persistent database storage
- Public application URL

---

🎯 Review-2 Goal

The Review-2 implementation focuses on delivering a functional multi-seller marketplace with:

- Buyer authentication
- Seller authentication
- Admin functionality
- Product management
- Product search and filtering
- Shopping cart
- Checkout
- Order management
- Reviews and ratings
- Browser-based frontend
- Secure PostgreSQL persistence
- Public cloud deployment

---

👨‍💻 Project

BerciiMart — C++ Capstone Project

A multi-seller e-commerce marketplace developed using modern C++, PostgreSQL and the Drogon web framework.
