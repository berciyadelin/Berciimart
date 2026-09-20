
const API_URL = "/api";

let currentUser = null;
let allProducts = [];


// ==============================
// PRODUCT IMAGES
// ==============================

const productImages = {
    "Laptop":
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",

    "Smartphone":
        "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",

    "Headphones":
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"
};


// ==============================
// SECTION MANAGEMENT
// ==============================

function showSection(section) {

    document.querySelectorAll(".section").forEach(element => {
        element.classList.remove("active");
    });

    const target =
        document.getElementById(section + "Section");

    if (target) {
        target.classList.add("active");
    }

    if (section === "products") {
        loadProducts();
    }

    if (section === "cart") {
        loadCart();
    }

    if (section === "orders") {
        loadOrders();
    }
}


function showLogin() {
    showSection("login");
}


function showRegister() {
    showSection("register");
}


// ==============================
// LOGIN
// ==============================

document
    .getElementById("loginForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value;

        const password =
            document.getElementById("loginPassword").value;

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

            if (!response.ok) {
                throw new Error(
                    data.message || "Login failed"
                );
            }

            currentUser = data;

            localStorage.setItem(
                "berciimart_user",
                JSON.stringify(data)
            );

            document.getElementById(
                "loginMessage"
            ).textContent = "Login successful.";

            showSection("products");

        } catch (error) {

            document.getElementById(
                "loginMessage"
            ).textContent = error.message;

        }

    });


// ==============================
// REGISTER
// ==============================

document
    .getElementById("registerForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const name =
            document.getElementById("registerName").value;

        const email =
            document.getElementById("registerEmail").value;

        const password =
            document.getElementById("registerPassword").value;

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

            if (!response.ok) {
                throw new Error(
                    data.message || "Registration failed"
                );
            }

            document.getElementById(
                "registerMessage"
            ).textContent =
                "Registration successful.";

            showLogin();

        } catch (error) {

            document.getElementById(
                "registerMessage"
            ).textContent = error.message;

        }

    });


// ==============================
// PRODUCTS
// ==============================

async function loadProducts() {

    const container =
        document.getElementById("productsContainer");

    container.innerHTML =
        "<p>Loading products...</p>";

    try {

        const response =
            await fetch(`${API_URL}/products`);

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Unable to load products"
            );
        }

        const products =
            data.products || [];

        allProducts =
            products;

        populateCategories();

        displayProducts();

    } catch (error) {

        console.error(
            "Product loading error:",
            error
        );

        container.innerHTML =
            "<p>Unable to load products.</p>";

    }
}


// ==============================
// CATEGORY FILTER
// ==============================

function populateCategories() {

    const categoryFilter =
        document.getElementById("categoryFilter");

    if (!categoryFilter) {
        return;
    }

    const currentValue =
        categoryFilter.value;

    const categories = [
        ...new Set(
            allProducts
                .map(product => product.category)
                .filter(category => category)
        )
    ];

    categoryFilter.innerHTML = `
        <option value="">
            All Categories
        </option>
    `;

    categories.forEach(category => {

        const option =
            document.createElement("option");

        option.value =
            category;

        option.textContent =
            category;

        categoryFilter.appendChild(
            option
        );

    });

    categoryFilter.value =
        currentValue;
}


// ==============================
// DISPLAY PRODUCTS
// ==============================

function displayProducts() {

    const container =
        document.getElementById("productsContainer");

    const searchInput =
        document.getElementById("productSearch");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const searchTerm =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";

    const selectedCategory =
        categoryFilter
            ? categoryFilter.value
            : "";

    const filteredProducts =
        allProducts.filter(product => {

            const productName =
                (product.name || "")
                    .toLowerCase();

            const description =
                (product.description || "")
                    .toLowerCase();

            const matchesSearch =
                !searchTerm ||
                productName.includes(searchTerm) ||
                description.includes(searchTerm);

            const matchesCategory =
                !selectedCategory ||
                product.category === selectedCategory;

            return (
                matchesSearch &&
                matchesCategory
            );

        });

    container.innerHTML = "";

    if (filteredProducts.length === 0) {

        container.innerHTML =
            "<p>No products found.</p>";

        return;
    }

    filteredProducts.forEach(product => {

        const card =
            document.createElement("div");

        card.className =
            "product-card";

        const image =
            productImages[product.name] ||
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80";

        card.innerHTML = `
            <img
                src="${image}"
                alt="${product.name}"
                class="product-image"
                loading="lazy"
            >

            <div class="product-info">

                <h2>
                    ${product.name}
                </h2>

                <p>
                    ${product.description || ""}
                </p>

                <p class="price">
                    ₹${Number(product.price).toFixed(2)}
                </p>

                <p>
                    Stock: ${product.quantity}
                </p>

                <button
                    onclick="addToCart(${product.id})">
                    Add to Cart
                </button>

            </div>
        `;

        container.appendChild(card);

    });
}


// ==============================
// SEARCH + FILTER EVENTS
// ==============================

const productSearch =
    document.getElementById("productSearch");

if (productSearch) {

    productSearch.addEventListener(
        "input",
        displayProducts
    );

}


const categoryFilter =
    document.getElementById("categoryFilter");

if (categoryFilter) {

    categoryFilter.addEventListener(
        "change",
        displayProducts
    );

}


// ==============================
// CART
// ==============================

async function addToCart(productId) {

    try {

        const response =
            await fetch(
                `${API_URL}/cart`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        product_id: productId,
                        quantity: 1
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to add product"
            );

        }

        alert(
            "Product added to cart."
        );

    } catch (error) {

        alert(
            error.message
        );

    }
}


async function loadCart() {

    const container =
        document.getElementById(
            "cartContainer"
        );

    try {

        const response =
            await fetch(
                `${API_URL}/cart`
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load cart"
            );

        }

        const cart =
            data.cart || data;

        container.innerHTML = "";

        let total = 0;

        if (
            !Array.isArray(cart) ||
            cart.length === 0
        ) {

            container.innerHTML =
                "<p>Your cart is empty.</p>";

            document.getElementById(
                "cartTotal"
            ).textContent =
                "0.00";

            return;
        }

        cart.forEach(item => {

            total +=
                Number(item.price) *
                Number(item.quantity);

            const element =
                document.createElement(
                    "div"
                );

            element.className =
                "cart-item";

            element.innerHTML = `
                <h3>
                    ${item.name}
                </h3>

                <p>
                    Quantity:
                    ${item.quantity}
                </p>

                <p>
                    ₹${(
                        Number(item.price) *
                        Number(item.quantity)
                    ).toFixed(2)}
                </p>
            `;

            container.appendChild(
                element
            );

        });

        document.getElementById(
            "cartTotal"
        ).textContent =
            total.toFixed(2);

    } catch (error) {

        console.error(
            "Cart loading error:",
            error
        );

        container.innerHTML =
            "<p>Unable to load cart.</p>";

    }
}


// ==============================
// CHECKOUT
// ==============================

async function checkout() {

    try {

        const response =
            await fetch(
                `${API_URL}/checkout`,
                {
                    method: "POST"
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Checkout failed"
            );

        }

        alert(
            `Order placed successfully. Order ID: ${data.order_id}`
        );

        loadCart();

    } catch (error) {

        alert(
            error.message
        );

    }
}


// ==============================
// ORDERS
// ==============================

async function loadOrders() {

    const container =
        document.getElementById(
            "ordersContainer"
        );

    try {

        const response =
            await fetch(
                `${API_URL}/orders`
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load orders"
            );

        }

        const orders =
            data.orders || data;

        container.innerHTML = "";

        if (
            !Array.isArray(orders) ||
            orders.length === 0
        ) {

            container.innerHTML =
                "<p>No orders found.</p>";

            return;
        }

        orders.forEach(order => {

            const element =
                document.createElement(
                    "div"
                );

            element.className =
                "order-card";

            element.innerHTML = `
                <h3>
                    Order #${order.id}
                </h3>

                <p>
                    Total:
                    ₹${Number(
                        order.total_amount
                    ).toFixed(2)}
                </p>

                <p>
                    Status:
                    ${order.status}
                </p>
            `;

            container.appendChild(
                element
            );

        });

    } catch (error) {

        console.error(
            "Orders loading error:",
            error
        );

        container.innerHTML =
            "<p>Unable to load orders.</p>";

    }
}


// ==============================
// LOGOUT
// ==============================

function logout() {

    currentUser = null;

    localStorage.removeItem(
        "berciimart_user"
    );

    showLogin();
}


// ==============================
// INITIALIZATION
// ==============================

const savedUser =
    localStorage.getItem(
        "berciimart_user"
    );

if (savedUser) {

    try {

        currentUser =
            JSON.parse(savedUser);

        showSection(
            "products"
        );

    } catch (error) {

        localStorage.removeItem(
            "berciimart_user"
        );

        showLogin();

    }

} else {

    showLogin();

}
