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

The planned chatbot provides a conversational way for users to ask common marketplace questions, such as:

- How do I add a product to my cart?
- How does checkout work?
- Where can I find my orders?
- How can a seller manage products?
- What should I do if a feature is unavailable?

The chatbot should remain focused on marketplace assistance and provide a fallback when its service is unavailable.

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
- [ ] Chatbot answers FAQs and handles service errors.
- [ ] Database records persist as expected.
- [ ] No secrets are exposed in the repository.

🌐 Deployment

Live Website: https://berciimart.onrender.com/

BerciiMart is hosted on Render for public demonstration. The live site should be tested end to end before the final review, as public availability alone does not confirm that every feature works.

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
