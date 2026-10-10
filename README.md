🛍️ BerciiMart

One Marketplace. Multiple Sellers. Smarter Shopping.

A C++ and PostgreSQL-Powered Multi-Seller E-Commerce Marketplace

🌐 Live Demo: https://berciimart.onrender.com/
💻 Source Code: https://github.com/berciyadelin/Berciimart

🎓 Project: Capstone Project — Final Review, October 10, 2026


🚀 About BerciiMart

BerciiMart is a multi-seller e-commerce marketplace designed to bring buyers, sellers, and administrators together in one organized digital shopping environment.

Instead of managing products, inventory, shopping carts, and orders separately, BerciiMart connects these activities through a centralized marketplace backed by PostgreSQL and powered by C++ application logic.

Its goal is to demonstrate how core software engineering concepts can be combined to build a practical, structured, and extensible e-commerce system.

💡 The Problem We're Solving

Online marketplace operations involve several connected activities:

- Managing product listings from multiple sellers
- Keeping product availability and order information consistent
- Organizing shopping carts and order totals
- Providing secure access for different user roles
- Helping buyers find information about products and orders

BerciiMart brings these activities together in one system.

✨ Key Features

🛒 1. Buyer Shopping Experience

- Browse and search available products
- Add products to a shopping cart
- Manage item quantities and cart totals
- Complete checkout using mock payment confirmation
- Review previous orders

🏪 2. Multi-Seller Product Management

- Organize product listings by seller
- Support product creation, editing, and removal
- Maintain product details, prices, and stock information

🔐 3. Role-Based Access

- User registration and login
- Separate buyer, seller, and administrator permissions
- Protected operations for authorized users

📦 4. Order and Inventory Management

- Record order details in the database
- Calculate purchase totals
- Track order history
- Maintain inventory consistency during checkout

🤖 5. Smart Shopping Assistant

BerciiMart includes a FAQ chatbot assistant that provides a conversational way for users to ask common marketplace questions, such as:

- How do I add a product to my cart?
- How does checkout work?
- Where can I find my orders?
- How can a seller manage products?
- What should I do if a feature is unavailable?

The chatbot remains focused on marketplace assistance: it answers through a dedicated `/api/faq` endpoint (src/service/FaqService.h), needs no login and no database access, and falls back to a built-in copy of the same answers (frontend/chatbot.js) when the service is unavailable. It lives in its own widget (frontend/chatbot.css, frontend/chatbot.js) with prefixed styles, so it never touches other site widgets.

🌟 What Makes BerciiMart Interesting?

- Connected marketplace workflow: Links product browsing, cart management, checkout, and order history.
- Multiple user roles: Separates buyer, seller, and administrator responsibilities.
- Database-backed operations: Uses PostgreSQL to organize persistent marketplace data.
- Conversational assistance: Includes a chatbot as an additional way to help users navigate the marketplace.
- Expandable architecture: Provides a foundation for future features such as wishlists, richer order tracking, and seller analytics.

These are design goals and differentiators; only features verified in the current deployment should be presented as completed.

🏗️ Technology Stack

Technology| Purpose
C++ / C++20| Application logic
PostgreSQL| Persistent relational database
SQL / libpq| Database queries and connectivity
HTML, CSS, JavaScript| Browser interface, where used
CMake| Build configuration
Git and GitHub| Version control
Render| Public deployment

🛠️ Setup and Execution

Prerequisites

- C++20 compiler (GCC 13+, Clang 15+, or MSVC 2022)
- CMake 3.20 or newer
- PostgreSQL 13 or newer
- Build dependencies (Linux, same list used by CI and the Dockerfile):

```
sudo apt-get install -y build-essential cmake pkg-config libpq-dev   libargon2-dev libdrogon-dev libjsoncpp-dev libssl-dev uuid-dev   zlib1g-dev libc-ares-dev libbrotli-dev libhiredis-dev   libyaml-cpp-dev libcurl4-openssl-dev
```

1. Clone the repository

```
git clone https://github.com/berciyadelin/Berciimart.git
cd Berciimart
```

2. Create and prepare the PostgreSQL database

```
createdb berciimart
psql -d berciimart -f database/schema.sql
psql -d berciimart -f database/seed.sql    # optional demo products
```

The server also runs an additive, idempotent schema repair at startup,
so an existing/older database is upgraded automatically.

3. Configure the environment (copy `.env.example` to `.env` and edit it)

- `DATABASE_URL` (required) — e.g. `postgres://user:password@localhost:5432/berciimart`
- `PORT` (optional) — HTTP port, defaults to `8080`
- `ADMIN_EMAILS` (optional) — comma-separated emails promoted to ADMIN at login.
  There is no public registration path to ADMIN.

4. Build

```
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build -j$(nproc)
```

5. Run from the repository root (the web interface is served from `./frontend`)

```
./build/BerciiMart
```

Then open http://localhost:8080 in a browser.

6. Tests

- C++ tests: `ctest --test-dir build --output-on-failure` (includes the FAQ chatbot test)
- Frontend chatbot tests: `node tests/chatbot_fallback_test.js` (plain Node, no packages needed)
- GitHub Actions builds the project and runs the C++ tests on every push and pull request to `main`.

Windows note: install dependencies with `vcpkg install`, then configure CMake with
`-DCMAKE_TOOLCHAIN_FILE=C:/vcpkg/scripts/buildsystems/vcpkg.cmake`
(the exact flags used in CI are in `.github/workflows/cmake-multi-platform.yml`).

🔄 How the System Works

1. A user opens the BerciiMart website.
2. The user registers or logs in.
3. The application provides access to permitted marketplace functions.
4. Buyers browse products and manage their carts.
5. At checkout, the application confirms the mock payment and records the order.
6. The database stores the relevant marketplace information.
7. Users can view their order history, while authorized sellers and administrators use their respective functions.

🗄️ Database and Security

PostgreSQL manages structured marketplace information, including users, products, carts, orders, and order items, according to the current schema.

Security priorities include:

- Password hashing instead of plaintext password storage
- Parameterized database queries
- Server-side role and permission checks
- Input validation and safe error handling
- Keeping database credentials and chatbot API keys out of public source code

The actual implementation should be tested before these controls are claimed as fully verified.

🧪 Final Review Testing

The following checks should be completed before the demonstration:

- [ ] Website loads and displays products.
- [ ] Registration and login work.
- [ ] Search and product browsing work.
- [ ] Cart additions, quantity updates, and removals work.
- [ ] Checkout creates an order correctly.
- [ ] Order history shows the correct user's orders.
- [ ] Inventory updates correctly after checkout.
- [ ] Seller permissions and product management work.
- [ ] Administrator functions are restricted to authorized users.
- [ ] Reviews and ratings work for eligible completed orders.
- [x] Chatbot answers FAQs and handles service errors.
- [ ] Database records persist as expected.
- [ ] No secrets are exposed in the repository.

🌐 Deployment

Live Website: https://berciimart.onrender.com/

BerciiMart is hosted on Render for public demonstration. Render builds the `Dockerfile` in this repository and deploys automatically whenever a new commit lands on `main`. The Render service must have `DATABASE_URL` (and optionally `PORT`) set in its environment settings. The live site should be tested end to end before the final review, as public availability alone does not confirm that every feature works.

🔮 Future Enhancements

Potential future improvements include:

- Wishlist and save-for-later functionality
- More detailed order-status tracking
- Seller sales analytics
- Improved product filtering
- Expanded chatbot FAQ coverage
- Additional automated testing

🎯 Project Outcome

BerciiMart demonstrates the integration of C++ application logic, PostgreSQL database management, authentication, and e-commerce workflows in a multi-seller marketplace.

The project aims to provide a practical foundation for understanding how a real-world online marketplace can be designed, implemented, tested, and deployed.

---

👩‍💻 Project Author

Berciya Delin G 

B.Tech — Information Technology

J. J. College of Engineering and Technology


Built as a capstone project to apply programming, database, and software development concepts to a practical marketplace problem.
