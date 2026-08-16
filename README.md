🛒 BerciiMart

📌 About the Project

BerciiMart is a console-based multi-seller e-commerce application developed using C++ and PostgreSQL. The project provides a simple shopping experience through a command-line interface and demonstrates how an application can interact with a database to store and manage information.

The system allows users to register and log in, view available products, search for products, add products to a shopping cart, and place orders. Sellers can manage their products by adding, viewing, updating, and deleting product information.

✨ Features

- 👤 User Registration and Login
- 🏪 Seller Management
- 📦 Product Management
- 🔍 Product Search
- 🛒 Shopping Cart
- 🧾 Order Management
- 💾 PostgreSQL Database
- 🔄 CRUD Operations
- 🧪 Testing Support
- ⚙️ CMake Build System
- 📚 vcpkg Dependency Management

🛠️ Technologies Used

- C++ – Main programming language
- PostgreSQL – Database management
- SQL – Database operations
- CMake – Project build system
- vcpkg – Dependency management
- Git & GitHub – Version control and project hosting
- GitHub Actions – Automated build and testing

🔄 Project Workflow

User
  ↓
C++ Console Application
  ↓
Application Logic
  ↓
Database Connection
  ↓
PostgreSQL
  ↓
Store / Retrieve Data
  ↓
Display Result to User

🗄️ Database

PostgreSQL is used to store the important information required by the application. The database helps maintain data even after the application is closed.

The system performs common database operations such as:

- Create – Add new users or products
- Read – View users, products, and orders
- Update – Modify existing information
- Delete – Remove unwanted information

📁 Project Structure

BerciiMart/
│
├── src/
│   └── C++ source files
│
├── include/
│   └── Header files
│
├── database/
│   └── Database-related files
│
├── test/
│   └── Testing files
│
├── docs/
│   └── Project documentation
│
├── .github/
│   └── GitHub Actions workflows
│
├── CMakeLists.txt
├── input.txt
└── README.md

🎯 Objective

The main objective of BerciiMart is to develop a simple e-commerce system while demonstrating C++ programming, database connectivity, CRUD operations, modular project development, testing, and version control.

🚀 Conclusion

BerciiMart combines a C++ console application with a PostgreSQL database to create a simple multi-seller shopping system. The project demonstrates the complete flow from user interaction to application processing and database storage.

C++ → Database Connection → PostgreSQL → Data Processing → User Output
