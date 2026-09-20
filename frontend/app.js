const API_URL = "/api";

let products = [];
let cart = [];
let orders = [];

let currentUser = JSON.parse(
    localStorage.getItem("berciimart_user")
) || null;


// ===============================
// PAGE LOAD
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();
            login();
        });
    }


    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", function (event) {
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


// ===============================
// SHOW SECTION
// ===============================

function showSection(sectionId) {

    const sections = document.querySelectorAll("section");

    sections.forEach(section => {
        section.style.display = "none";
    });


    const section = document.getElementById(sectionId);

    if (section) {
        section.style.display = "block";
    }


    if (sectionId === "productsSection") {
        loadProducts();
    }

    if (sectionId === "cartSection") {
        loadCart();
    }

    if (sectionId === "ordersSection") {
        loadOrders();
    }
}


// ===============================
// REGISTER / LOGIN NAVIGATION
// ===============================

function showRegister() {
    showSection("registerSection");
}


function showLogin() {
    showSection("loginSection");
}


// ===============================
// REGISTER
// ===============================

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
                    name: name,
                    email: email,
                    password: password
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

    }
    catch (error) {

        console.error(error);

        message.textContent =
            "Cannot connect to server.";
    }
}


// ===============================
// LOGIN
// ===============================

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
                    email: email,
                    password: password
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


        message.textContent =
            "Login successful!";


        document.getElementById("loginForm").reset();


        showSection("productsSection");

        loadProducts();
        loadCart();
        loadOrders();

    }
    catch (error) {

        console.error(error);

        message.textContent =
            "Cannot connect to server.";
    }
}


// ===============================
// LOGOUT
// ===============================

function logout() {

    localStorage.removeItem("berciimart_user");

    currentUser = null;

    products = [];
    cart = [];
    orders = [];

    showSection("loginSection");
}


// ===============================
// PRODUCT IMAGE
// ===============================

function getProductImage(productName) {

    const name = productName.toLowerCase();


    // PHONE
    if (
        name.includes("phone") ||
        name.includes("mobile") ||
        name.includes("iphone") ||
        name.includes("samsung")
    ) {
        return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80";
    }


    // LAPTOP
    if (
        name.includes("laptop") ||
        name.includes("computer") ||
        name.includes("macbook")
    ) {
        return "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=500&q=80";
    }


    // HEADPHONES
    if (
        name.includes("headphone") ||
        name.includes("headset") ||
        name.includes("earphone") ||
        name.includes("airpod")
    ) {
        return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80";
    }


    // SHOES
    if (
        name.includes("shoe") ||
        name.includes("sneaker") ||
        name.includes("footwear")
    ) {
        return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80";
    }


    // SHIRT / CLOTHES
    if (
        name.includes("shirt") ||
        name.includes("tshirt") ||
        name.includes("t-shirt") ||
        name.includes("cloth")
    ) {
        return "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80";
    }


    // WATCH
    if (
        name.includes("watch") ||
        name.includes("smartwatch")
    ) {
        return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80";
    }


    // BAG
    if (
        name.includes("bag") ||
        name.includes("backpack")
    ) {
        return "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=80";
    }


    // CAMERA
    if (
        name.includes("camera")
    ) {
        return "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=500&q=80";
    }


    // DEFAULT IMAGE
    return "https://via.placeholder.com/500x350?text=BerciiMart";
}


// ===============================
// LOAD PRODUCTS
// ===============================

async function loadProducts() {

    try {

        const response =
            await fetch(`${API_URL}/products`);


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            console.error(
                data.error || "Failed to load products"
            );

            return;
        }


        products = data.products || [];


        displayProducts();

    }
    catch (error) {

        console.error(
            "Product loading error:",
            error
        );
    }
}


// ===============================
// DISPLAY PRODUCTS
// ===============================

function displayProducts() {

    const container =
        document.getElementById("productsContainer");


    if (!container) {
        return;
    }


    if (products.length === 0) {

        container.innerHTML =
            "<p>No products available.</p>";

        return;
    }


    container.innerHTML =
        products.map(product => {

            const image =
                getProductImage(product.name);


            return `
                <div class="product-card">

                    <img
                        src="${image}"
                        alt="${product.name}"
                        class="product-image"
                        onerror="this.src='https://via.placeholder.com/500x350?text=BerciiMart'"
                    >

                    <h3>
                        ${product.name}
                    </h3>

                    <p>
                        Price: ₹${Number(product.price).toFixed(2)}
                    </p>

                    <p>
                        Available: ${product.quantity}
                    </p>

                    <button
                        onclick="addToCart(${product.id})"
                        ${product.quantity <= 0 ? "disabled" : ""}
                    >
                        ${
                            product.quantity <= 0
                            ? "Out of Stock"
                            : "Add to Cart"
                        }
                    </button>

                </div>
            `;

        }).join("");
}


// ===============================
// SEARCH PRODUCTS
// ===============================

function searchProducts() {

    const searchInput =
        document.getElementById("productSearch");


    if (!searchInput) {
        return;
    }


    const search =
        searchInput.value.toLowerCase().trim();


    const container =
        document.getElementById("productsContainer");


    const filtered =
        products.filter(product =>
            product.name
                .toLowerCase()
                .includes(search)
        );


    if (filtered.length === 0) {

        container.innerHTML =
            "<p>No products found.</p>";

        return;
    }


    container.innerHTML =
        filtered.map(product => {

            const image =
                getProductImage(product.name);


            return `
                <div class="product-card">

                    <img
                        src="${image}"
                        alt="${product.name}"
                        class="product-image"
                        onerror="this.src='https://via.placeholder.com/500x350?text=BerciiMart'"
                    >

                    <h3>${product.name}</h3>

                    <p>
                        Price: ₹${Number(product.price).toFixed(2)}
                    </p>

                    <p>
                        Available: ${product.quantity}
                    </p>

                    <button
                        onclick="addToCart(${product.id})"
                    >
                        Add to Cart
                    </button>

                </div>
            `;

        }).join("");
}


// ===============================
// ADD TO CART
// ===============================

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


        alert("Product added to cart!");


        loadCart();

    }
    catch (error) {

        console.error(error);

        alert(
            "Cannot connect to server."
        );
    }
}


// ===============================
// LOAD CART
// ===============================

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


        cart = data.cart || [];


        displayCart(data.total || 0);

    }
    catch (error) {

        console.error(
            "Cart error:",
            error
        );
    }
}


// ===============================
// DISPLAY CART
// ===============================

function displayCart(total) {

    const container =
        document.getElementById("cartContainer");


    const totalElement =
        document.getElementById("cartTotal");


    if (!container) {
        return;
    }


    if (cart.length === 0) {

        container.innerHTML =
            "<p>Your cart is empty.</p>";

        if (totalElement) {
            totalElement.textContent = "₹0.00";
        }

        return;
    }


    container.innerHTML =
        cart.map(item => {

            const product =
                products.find(
                    p => p.id === item.product_id
                );


            const image =
                product
                ? getProductImage(product.name)
                : getProductImage(item.name);


            return `
                <div class="cart-item">

                    <img
                        src="${image}"
                        alt="${item.name}"
                        class="cart-image"
                    >

                    <div>

                        <h3>
                            ${item.name}
                        </h3>

                        <p>
                            Price: ₹${Number(item.price).toFixed(2)}
                        </p>

                        <p>
                            Quantity: ${item.quantity}
                        </p>

                        <p>
                            Subtotal:
                            ₹${Number(item.subtotal).toFixed(2)}
                        </p>

                    </div>

                </div>
            `;

        }).join("");


    if (totalElement) {

        totalElement.textContent =
            `₹${Number(total).toFixed(2)}`;
    }
}


// ===============================
// LOAD ORDERS
// ===============================

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


        if (!response.ok) {
            return;
        }


        const data =
            await response.json();


        if (data.success) {

            orders =
                data.orders || [];

            displayOrders();
        }

    }
    catch (error) {

        console.error(
            "Orders error:",
            error
        );
    }
}


// ===============================
// DISPLAY ORDERS
// ===============================

function displayOrders() {

    const container =
        document.getElementById("ordersContainer");


    if (!container) {
        return;
    }


    if (orders.length === 0) {

        container.innerHTML =
            "<p>No orders found.</p>";

        return;
    }


    container.innerHTML =
        orders.map(order => {

            return `
                <div class="order-card">

                    <h3>
                        Order #${order.id}
                    </h3>

                    <p>
                        Total:
                        ₹${Number(order.total || 0).toFixed(2)}
                    </p>

                    <p>
                        Status:
                        ${order.status || "Placed"}
                    </p>

                </div>
            `;

        }).join("");
}


// ===============================
// CHECKOUT
// ===============================

async function checkout() {

    if (!currentUser) {

        alert("Please login first.");

        return;
    }


    if (cart.length === 0) {

        alert("Your cart is empty.");

        return;
    }


    try {

        const response =
            await fetch(`${API_URL}/checkout`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
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


        alert("Order placed successfully!");


        loadCart();
        loadOrders();

        showSection("ordersSection");

    }
    catch (error) {

        console.error(error);

        alert(
            "Cannot connect to server."
        );
    }
}


// ===============================
// CATEGORY FILTER
// ===============================

function filterProducts() {

    const filter =
        document.getElementById("categoryFilter");


    if (!filter) {
        return;
    }


    const value =
        filter.value.toLowerCase();


    if (!value) {

        displayProducts();

        return;
    }


    const filtered =
        products.filter(product =>
            product.name
                .toLowerCase()
                .includes(value)
        );


    const container =
        document.getElementById("productsContainer");


    if (filtered.length === 0) {

        container.innerHTML =
            "<p>No products found.</p>";

        return;
    }


    container.innerHTML =
        filtered.map(product => {

            const image =
                getProductImage(product.name);


            return `
                <div class="product-card">

                    <img
                        src="${image}"
                        alt="${product.name}"
                        class="product-image"
                    >

                    <h3>${product.name}</h3>

                    <p>
                        Price:
                        ₹${Number(product.price).toFixed(2)}
                    </p>

                    <p>
                        Available:
                        ${product.quantity}
                    </p>

                    <button
                        onclick="addToCart(${product.id})"
                    >
                        Add to Cart
                    </button>

                </div>
            `;

        }).join("");
}


// ===============================
// SEARCH EVENT
// ===============================

document.addEventListener("input", function(event) {

    if (event.target.id === "productSearch") {
        searchProducts();
    }

});


// ===============================
// CATEGORY EVENT
// ===============================

document.addEventListener("change", function(event) {

    if (event.target.id === "categoryFilter") {
        filterProducts();
    }

});