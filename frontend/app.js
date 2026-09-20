const API_URL = "/api";

let products = [];
let cart = [];
let orders = [];

let currentUser =
    JSON.parse(localStorage.getItem("berciimart_user")) || null;


// ======================================================
// PAGE LOAD
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();
            login();
        });
    }

    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", (event) => {
            event.preventDefault();
            register();
        });
    }

    if (currentUser) {
        showSection("productsSection");
        loadProducts();
        loadCart();
        loadOrders();
    } else {
        showSection("loginSection");
    }
});


// ======================================================
// SHOW SECTION
// ======================================================

function showSection(sectionId) {

    // Allow navigation buttons to use short names.
    const sectionMap = {
        products: "productsSection",
        cart: "cartSection",
        orders: "ordersSection",
        login: "loginSection",
        register: "registerSection"
    };

    const actualSectionId =
        sectionMap[sectionId] || sectionId;

    const sections =
        document.querySelectorAll("main .section");

    sections.forEach(section => {
        section.style.display = "none";
    });

    const section =
        document.getElementById(actualSectionId);

    if (!section) {
        console.error(
            "Section not found:",
            actualSectionId
        );
        return;
    }

    section.style.display = "block";

    if (actualSectionId === "productsSection") {
        loadProducts();
    }

    if (actualSectionId === "cartSection") {
        loadCart();
    }

    if (actualSectionId === "ordersSection") {
        loadOrders();
    }
}


// ======================================================
// LOGIN / REGISTER NAVIGATION
// ======================================================

function showRegister() {
    showSection("registerSection");
}

function showLogin() {
    showSection("loginSection");
}


// ======================================================
// REGISTER
// ======================================================

async function register() {

    const name =
        document.getElementById("registerName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    const message =
        document.getElementById("registerMessage");

    if (!name || !email || !password) {
        message.textContent =
            "Please fill all fields.";
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            message.textContent =
                data.error || "Registration failed.";
            return;
        }

        message.textContent =
            "Registration successful! Please login.";

        document.getElementById("registerForm").reset();

        setTimeout(() => {
            showLogin();
        }, 1000);

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        message.textContent =
            "Cannot connect to server.";
    }
}


// ======================================================
// LOGIN
// ======================================================

async function login() {

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    const message =
        document.getElementById("loginMessage");

    if (!email || !password) {
        message.textContent =
            "Please enter email and password.";
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            message.textContent =
                data.error || "Login failed.";
            return;
        }

        currentUser = {
            id: data.user_id,
            name: data.name,
            email: data.email,
            role: data.role
        };

        localStorage.setItem(
            "berciimart_user",
            JSON.stringify(currentUser)
        );

        document.getElementById("loginForm").reset();

        message.textContent =
            "Login successful!";

        showSection("productsSection");

        loadProducts();
        loadCart();
        loadOrders();

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        message.textContent =
            "Cannot connect to server.";
    }
}


// ======================================================
// LOGOUT
// ======================================================

function logout() {

    localStorage.removeItem("berciimart_user");

    currentUser = null;

    products = [];
    cart = [];
    orders = [];

    showSection("loginSection");
}


// ======================================================
// PRODUCT IMAGES
// ======================================================

function getProductImage(product) {

    // First use image_url from database if available.
    if (
        product &&
        product.image_url &&
        product.image_url.trim() !== ""
    ) {
        return product.image_url;
    }

    const name =
        String(product?.name || "").toLowerCase();


    // LAPTOP
    if (
        name.includes("laptop") ||
        name.includes("computer") ||
        name.includes("macbook")
    ) {
        return "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80";
    }


    // PHONE
    if (
        name.includes("phone") ||
        name.includes("mobile") ||
        name.includes("iphone") ||
        name.includes("samsung")
    ) {
        return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80";
    }


    // KEYBOARD
    if (
        name.includes("keyboard")
    ) {
        return "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80";
    }


    // MOUSE
    if (
        name.includes("mouse")
    ) {
        return "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=600&q=80";
    }


    // HEADPHONES
    if (
        name.includes("headphone") ||
        name.includes("headset") ||
        name.includes("earphone") ||
        name.includes("airpod")
    ) {
        return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80";
    }


    // T-SHIRT
    if (
        name.includes("shirt") ||
        name.includes("tshirt") ||
        name.includes("t-shirt")
    ) {
        return "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80";
    }


    // SHOES
    if (
        name.includes("shoe") ||
        name.includes("sneaker") ||
        name.includes("footwear")
    ) {
        return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80";
    }


    // WATCH
    if (
        name.includes("watch") ||
        name.includes("smartwatch")
    ) {
        return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80";
    }


    // BAG
    if (
        name.includes("bag") ||
        name.includes("backpack")
    ) {
        return "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80";
    }


    // CAMERA
    if (
        name.includes("camera")
    ) {
        return "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80";
    }


    // PYTHON / PROGRAMMING BOOK
    if (
        name.includes("python book") ||
        name.includes("programming book") ||
        name.includes("c programming") ||
        name.includes("coding book") ||
        name.includes("book")
    ) {
        return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80";
    }


    // RICE
    if (
        name.includes("rice")
    ) {
        return "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80";
    }


    // DEFAULT
    return "https://via.placeholder.com/600x400?text=BerciiMart";
}


// ======================================================
// LOAD PRODUCTS
// ======================================================

async function loadProducts() {

    const container =
        document.getElementById("productsContainer");

    if (!container) {
        console.error(
            "productsContainer not found."
        );
        return;
    }

    container.innerHTML =
        "<p>Loading products...</p>";

    try {

        const response =
            await fetch(`${API_URL}/products`);

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            container.innerHTML =
                "<p>Unable to load products.</p>";

            console.error(
                data.error || "Failed to load products"
            );

            return;
        }

        products =
            Array.isArray(data.products)
                ? data.products
                : [];

        populateCategories();

        displayProducts();

    } catch (error) {

        console.error(
            "Product loading error:",
            error
        );

        container.innerHTML =
            "<p>Cannot connect to server.</p>";
    }
}


// ======================================================
// POPULATE CATEGORIES
// ======================================================

function populateCategories() {

    const filter =
        document.getElementById("categoryFilter");

    if (!filter) {
        return;
    }

    const categories = [
        ...new Set(
            products
                .map(product =>
                    product.category || "General"
                )
                .filter(Boolean)
        )
    ];

    filter.innerHTML =
        `<option value="">All Categories</option>`;

    categories.forEach(category => {

        const option =
            document.createElement("option");

        option.value = category;
        option.textContent = category;

        filter.appendChild(option);
    });
}


// ======================================================
// DISPLAY PRODUCTS
// ======================================================

function displayProducts(list = products) {

    const container =
        document.getElementById("productsContainer");

    if (!container) {
        return;
    }

    if (!list.length) {

        container.innerHTML =
            "<p>No products available.</p>";

        return;
    }

    container.innerHTML =
        list.map(product => {

            const image =
                getProductImage(product);

            const quantity =
                Number(product.quantity || 0);

            const price =
                Number(product.price || 0);

            return `
                <div class="product-card">

                    <img
                        src="${image}"
                        alt="${escapeHtml(product.name)}"
                        class="product-image"
                        onerror="this.src='https://via.placeholder.com/600x400?text=BerciiMart'"
                    >

                    <h3>
                        ${escapeHtml(product.name)}
                    </h3>

                    <p>
                        ${escapeHtml(
                            product.description || ""
                        )}
                    </p>

                    <p>
                        Category:
                        ${escapeHtml(
                            product.category || "General"
                        )}
                    </p>

                    <p>
                        Price:
                        ₹${price.toFixed(2)}
                    </p>

                    <p>
                        Available:
                        ${quantity}
                    </p>

                    <button
                        onclick="addToCart(${product.id})"
                        ${quantity <= 0 ? "disabled" : ""}
                    >
                        ${
                            quantity <= 0
                                ? "Out of Stock"
                                : "Add to Cart"
                        }
                    </button>

                </div>
            `;

        }).join("");
}


// ======================================================
// SEARCH + CATEGORY FILTER
// ======================================================

function applyProductFilters() {

    const searchInput =
        document.getElementById("productSearch");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const search =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";

    const category =
        categoryFilter
            ? categoryFilter.value.toLowerCase()
            : "";

    const filtered =
        products.filter(product => {

            const name =
                String(product.name || "")
                    .toLowerCase();

            const description =
                String(product.description || "")
                    .toLowerCase();

            const productCategory =
                String(product.category || "General")
                    .toLowerCase();

            const matchesSearch =
                !search ||
                name.includes(search) ||
                description.includes(search);

            const matchesCategory =
                !category ||
                productCategory === category;

            return (
                matchesSearch &&
                matchesCategory
            );
        });

    displayProducts(filtered);
}


function searchProducts() {
    applyProductFilters();
}


function filterProducts() {
    applyProductFilters();
}


// ======================================================
// ADD TO CART
// ======================================================

async function addToCart(productId) {

    if (!currentUser) {

        alert("Please login first.");
        showLogin();

        return;
    }

    try {

        const response =
            await fetch(`${API_URL}/cart`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "X-User-Id":
                        String(currentUser.id)
                },

                body: JSON.stringify({
                    user_id: currentUser.id,
                    product_id: productId,
                    quantity: 1
                })
            });

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            alert(
                data.error ||
                "Failed to add product to cart."
            );

            return;
        }

        alert(
            "Product added to cart!"
        );

        await loadCart();

    } catch (error) {

        console.error(
            "Add to cart error:",
            error
        );

        alert(
            "Cannot connect to server."
        );
    }
}


// ======================================================
// LOAD CART
// ======================================================

async function loadCart() {

    if (!currentUser) {
        return;
    }

    try {

        const response =
            await fetch(`${API_URL}/cart`, {

                headers: {
                    "X-User-Id":
                        String(currentUser.id)
                }
            });

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            console.error(
                data.error || "Failed to load cart"
            );

            return;
        }

        // Backend returns "items".
        cart =
            Array.isArray(data.items)
                ? data.items
                : Array.isArray(data.cart)
                    ? data.cart
                    : [];

        displayCart(
            Number(data.total || 0)
        );

    } catch (error) {

        console.error(
            "Cart error:",
            error
        );
    }
}


// ======================================================
// DISPLAY CART
// ======================================================

function displayCart(total) {

    const container =
        document.getElementById("cartContainer");

    const totalElement =
        document.getElementById("cartTotal");

    if (!container) {
        return;
    }

    if (!cart.length) {

        container.innerHTML =
            "<p>Your cart is empty.</p>";

        if (totalElement) {
            totalElement.textContent =
                "0.00";
        }

        return;
    }

    container.innerHTML =
        cart.map(item => {

            const product =
                products.find(
                    p =>
                        Number(p.id) ===
                        Number(item.product_id)
                );

            const image =
                product
                    ? getProductImage(product)
                    : getProductImage({
                        name: item.name
                    });

            return `
                <div class="cart-item">

                    <img
                        src="${image}"
                        alt="${escapeHtml(item.name || "")}"
                        class="cart-image"
                        onerror="this.src='https://via.placeholder.com/300x200?text=BerciiMart'"
                    >

                    <div>

                        <h3>
                            ${escapeHtml(item.name || "")}
                        </h3>

                        <p>
                            Price:
                            ₹${Number(item.price || 0).toFixed(2)}
                        </p>

                        <p>
                            Quantity:
                            ${Number(item.quantity || 0)}
                        </p>

                        <p>
                            Subtotal:
                            ₹${Number(item.subtotal || 0).toFixed(2)}
                        </p>

                    </div>

                </div>
            `;

        }).join("");

    if (totalElement) {

        totalElement.textContent =
            Number(total || 0).toFixed(2);
    }
}


// ======================================================
// CHECKOUT
// ======================================================

async function checkout() {

    if (!currentUser) {

        alert("Please login first.");
        return;
    }

    if (!cart.length) {

        alert("Your cart is empty.");
        return;
    }

    try {

        const response =
            await fetch(`${API_URL}/checkout`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "X-User-Id":
                        String(currentUser.id)
                },

                body: JSON.stringify({
                    user_id: currentUser.id
                })
            });

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            alert(
                data.error ||
                "Checkout failed."
            );

            return;
        }

        alert(
            "Order placed successfully!"
        );

        await loadCart();
        await loadOrders();

        showSection("ordersSection");

    } catch (error) {

        console.error(
            "Checkout error:",
            error
        );

        alert(
            "Cannot connect to server."
        );
    }
}


// ======================================================
// LOAD ORDERS
// ======================================================

async function loadOrders() {

    if (!currentUser) {
        return;
    }

    try {

        const response =
            await fetch(`${API_URL}/orders`, {

                headers: {
                    "X-User-Id":
                        String(currentUser.id)
                }
            });

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            console.error(
                data.error || "Failed to load orders"
            );

            return;
        }

        orders =
            Array.isArray(data.orders)
                ? data.orders
                : [];

        displayOrders();

    } catch (error) {

        console.error(
            "Orders error:",
            error
        );
    }
}


// ======================================================
// DISPLAY ORDERS
// ======================================================

function displayOrders() {

    const container =
        document.getElementById("ordersContainer");

    if (!container) {
        return;
    }

    if (!orders.length) {

        container.innerHTML =
            "<p>No orders found.</p>";

        return;
    }

    container.innerHTML =
        orders.map(order => {

            const total =
                Number(
                    order.total_amount ??
                    order.total ??
                    0
                );

            return `
                <div class="order-card">

                    <h3>
                        Order #${order.id}
                    </h3>

                    <p>
                        Total:
                        ₹${total.toFixed(2)}
                    </p>

                    <p>
                        Status:
                        ${escapeHtml(
                            order.status || "Placed"
                        )}
                    </p>

                    <p>
                        Date:
                        ${escapeHtml(
                            order.order_date || ""
                        )}
                    </p>

                </div>
            `;

        }).join("");
}


// ======================================================
// HTML ESCAPING
// ======================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ======================================================
// SEARCH EVENT
// ======================================================

document.addEventListener(
    "input",
    event => {

        if (
            event.target &&
            event.target.id === "productSearch"
        ) {
            searchProducts();
        }
    }
);


// ======================================================
// CATEGORY EVENT
// ======================================================

document.addEventListener(
    "change",
    event => {

        if (
            event.target &&
            event.target.id === "categoryFilter"
        ) {
            filterProducts();
        }
    }
);
