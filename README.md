# 🛒 BerciiMart

## Multi-Seller E-Commerce Marketplace

BerciiMart is a C++20-based console e-commerce application developed as a capstone project.

The project uses PostgreSQL for persistent data storage and demonstrates user authentication, product management, shopping cart operations, checkout, order creation, and order history.

---

## 📌 Project Status

### Current Status: Review-2 Development

The current working implementation is a console-based C++ application connected to PostgreSQL.

### Completed and Verified

- PostgreSQL database connectivity
- User registration
- User login
- Argon2id password hashing
- Product listing
- Shopping cart operations
- Quantity validation
- Stock validation
- Checkout
- Order creation
- Order item storage
- Stock reduction after checkout
- Cart clearing after checkout
- Order history
- Logout
- CMake build configuration
- Ninja build system
- vcpkg dependency management
- Git and GitHub version control

---

## ✨ Main Features

### 👤 User Management

- User registration
- User login
- User logout
- Password hashing using Argon2id
- Secure password storage
- PostgreSQL-based user persistence
- User roles such as BUYER, SELLER, and ADMIN

### 📦 Product Management

- View available products
- Display product ID
- Display product name
- Display product price
- Display available quantity
- PostgreSQL-based product storage

### 🛒 Shopping Cart

- Add products to cart
- View cart
- Add quantities
- Combine quantities for an existing product
- Quantity validation
- Stock availability checking

### 🧾 Checkout and Orders

- Checkout cart
- Calculate order total
- Create order
- Store order items
- Update product stock
- Clear cart after successful checkout
- View previous orders

---

## 🏗️ Application Architecture

The current application follows a simple console-based architecture:

                 C++ Console Application
                          │
                          ▼
                    main.cpp
                          │
                          ▼
                   database.cpp
                          │
                          ▼
                    libpq / SQL
                          │
                          ▼
                    PostgreSQL
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
           Users       Products       Cart
                                      │
                                      ▼
                                   Orders

The C++ application handles the user interface and application flow.

The database layer handles PostgreSQL connectivity, SQL queries, authentication, products, cart operations, checkout, and orders.

---

## 📁 Project Structure

Berciimart/
│
├── .github/
│   └── workflows/
│
├── database/
│   ├── schema.sql
│   └── migrations/
│
├── docs/
│
├── include/
│   ├── database.h
│   └── user.h
│
├── src/
│   ├── main.cpp
│   ├── database.cpp
│   ├── db_test.cpp
│   └── *_backup.cpp
│
├── test/
│
├── CMakeLists.txt
├── README.md
├── vcpkg.json
└── .gitignore

---

## 🛠️ Technology Stack

| Technology | Purpose |
|------------|---------|
| C++20 | Main programming language |
| PostgreSQL | Relational database |
| libpq | PostgreSQL client library |
| Argon2 | Password hashing |
| SQL | Database operations |
| CMake | Build configuration |
| Ninja | Build system |
| vcpkg | C/C++ dependency management |
| Git | Version control |
| GitHub | Source-code hosting |
| Visual Studio Code | Development environment |

---

## 🗄️ Database

BerciiMart uses PostgreSQL for persistent application data.

The application currently works with database entities including:

- Users
- Products
- Categories
- Cart
- Orders
- Order Items

The database uses relational features such as:

- Primary keys
- Foreign keys
- Unique constraints
- Check constraints
- Quantity validation

The application connects to PostgreSQL using the libpq client library.

---

## 🔐 Security

BerciiMart uses Argon2id for password hashing.

Passwords are not stored as plain text.

### Password Flow

User Password
      │
      ▼
   Argon2id
      │
      ▼
Password Hash
      │
      ▼
   PostgreSQL

The application also uses parameterized PostgreSQL queries for database operations.

---

## 🔄 Application Workflow

### 1. Start Application

The program connects to the PostgreSQL database.

### 2. Register

The user enters:

- Username
- Email
- Password
- Role

The password is hashed using Argon2id and the user information is stored in PostgreSQL.

### 3. Login

The user enters their username and password.

The application verifies the password and allows access to the shopping menu after successful authentication.

### 4. View Products

The application retrieves available products from PostgreSQL and displays their details.

### 5. Add to Cart

The user selects a product ID and quantity.

The application validates the requested quantity against available stock and stores the cart information in PostgreSQL.

### 6. View Cart

The application displays the products and quantities currently stored in the user's cart.

### 7. Checkout

The application:

1. Reads the cart
2. Calculates the total
3. Creates an order
4. Stores order items
5. Updates product stock
6. Clears the cart

### 8. My Orders

The user can view previously created orders, including:

- Order ID
- Total amount
- Status
- Order date

### 9. Logout

The user returns to the main application menu.

---

## 🧪 Testing and Verification

The current implementation has been tested for:

- Database connection
- User registration
- User login
- Product display
- Add to cart
- View cart
- Checkout
- Order creation
- Order item creation
- Product stock update
- Cart clearing
- Order history
- Logout
- CMake/Ninja build

The application successfully builds using the configured CMake and Ninja environment.

---

## 🔨 Build Instructions

### Requirements

- C++20 compatible compiler
- CMake
- Ninja
- PostgreSQL
- vcpkg
- libpq
- Argon2

### Configure

From the project directory:

```text
cmake -S . -B build -G Ninja