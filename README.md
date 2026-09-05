# 🛒 BerciiMart

## 📌 About the Project

BerciiMart is a console-based multi-seller e-commerce application developed using **C++ and PostgreSQL**.

The project demonstrates how a C++ application can connect to a relational database, manage users and products, process shopping carts, create orders, and securely handle user passwords.

The application provides a simple command-line shopping experience where users can register, log in, browse products, add products to their cart, checkout, and view their previous orders.

---

## ✨ Features

### 👤 User Management
- User registration
- User login
- User logout
- Password verification using **Argon2id**
- Secure password hash storage in PostgreSQL

### 📦 Product Management
- View available products
- Product information including name, price, and quantity
- Product search
- Product CRUD operations

### 🛒 Shopping Cart
- Add products to cart
- View cart
- Add the same product multiple times
- Automatically combine quantities for duplicate cart items
- Quantity validation
- Product availability and stock checking

### 🧾 Order Management
- Checkout
- Automatic order total calculation
- Stock reduction after successful checkout
- Order item storage
- View user's previous orders

### 🗄️ Database
- PostgreSQL database integration
- Relational database design
- Primary keys and foreign keys
- Unique constraints
- Quantity validation
- Persistent data storage

### 🔐 Security
- Argon2id password hashing
- Random salt generation
- Password verification without storing plaintext passwords
- Database password removed from application source code
- Build files and generated files excluded using `.gitignore`

### 🧪 Testing
- Database connection testing
- User registration and login testing
- Invalid login testing
- Product and cart testing
- Quantity validation testing
- Stock validation testing
- Checkout testing
- Order history testing

---

## 🛠️ Technologies Used

- **C++20** – Main programming language
- **PostgreSQL** – Database management system
- **libpq** – PostgreSQL C/C++ client library
- **Argon2** – Secure password hashing
- **SQL** – Database operations
- **CMake** – Project build system
- **Ninja** – Build tool
- **vcpkg** – C/C++ dependency management
- **Git** – Version control
- **GitHub** – Project hosting
- **GitHub Actions** – Automated build and testing
- **Visual Studio Code** – Development environment

---

## 🔐 Password Security

BerciiMart uses **Argon2id** for password hashing.

Passwords are not stored as plaintext in the database.

During registration:

```text
User Password
      ↓
Argon2id
      ↓
Random Salt + Password Hash
      ↓
PostgreSQL password_hash