const API_URL = "/api";

let currentUser = null;
let products = [];
let cart = [];
let orders = [];

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }

    const searchInput = document.getElementById("productSearch");
    const categoryFilter = document.getElementById("categoryFilter");

    if (searchInput) {
        searchInput.addEventListener("input", displayProducts);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", displayProducts);
    }

    showSection("login");
});

function showSection(sectionName) {
    const sections = document.querySelectorAll(".section");

    sections.forEach(section => {
        section.classList.remove("active");
    });

    const sectionMap = {
        login: "loginSection",
        register: "registerSection",
        products: "productsSection",
        cart: "cartSection",
        orders: "ordersSection"
    };

    const sectionId = sectionMap[sectionName];

    if (sectionId) {
        const section = document.getElementById(sectionId);

        if (section) {
            section.classList.add("active");
        }
    }

    if (sectionName === "products") {
        loadProducts();
    }

    if (sectionName === "cart") {
        loadCart();
    }

    if (sectionName === "orders") {
        loadOrders();
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById("registerName")?.value.trim();
    const email = document.getElementById("registerEmail")?.value.trim();
    const password = document.getElementById("registerPassword")?.value;
    const role = document.getElementById("registerRole")?.value || "BUYER";

    if (!name || !email || !password) {
        alert("Please fill in all registration fields.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name,
                username: name,
                email: email,
                password: password,
                role: role
            })
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
            alert(data.error || "Registration failed.");
            return;
        }

        alert("Registration successful. Please log in.");

        event.target.reset();
        showSection("login");

    } catch (error) {
        console.error("Registration error:", error);
        alert("Unable to connect to the server.");
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById("loginUsername")?.value.trim();
    const password = document.getElementById("loginPassword")?.value;

    if (!username || !password) {
        alert("Please enter your username/email and password.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
            alert(data.error || "Login failed.");
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

        event.target.reset();

        showSection("products");
        await loadProducts();

    } catch (error) {
        console.error("Login error:", error);
        alert("Unable to connect to the server.");
    }
}

function logout() {
    currentUser = null;
    cart = [];
    orders = [];

    localStorage.removeItem("berciimart_user");

    showSection("login");
}

async function loadProducts() {
    const container = document.getElementById("productsContainer");

    if (!container) {
        console.error("productsContainer not found.");
        return;
    }

    container.innerHTML = "<p>Loading products...</p>";

    try {
        const response = await fetch(`${API_URL}/products`);

        const data = await response.json();

        if (!response.ok || data.success === false) {
            throw new Error(data.error || "Failed to load products.");
        }

        products = Array.isArray(data.products)
            ? data.products
            : [];

        populateCategories();

        displayProducts();

    } catch (error) {
        console.error("Product loading error:", error);

        container.innerHTML = `
            <p class="error">
                Unable to load products.
            </p>
        `;
    }
}

function populateCategories() {
    const categoryFilter =
        document.getElementById("categoryFilter");

    if (!categoryFilter) {
        return;
    }

    const currentValue = categoryFilter.value;

    const categories = [
        ...new Set(
            products
                .map(product => product.category)
                .filter(category => category)
        )
    ];

    categoryFilter.innerHTML =
        `<option value="">All Categories</option>`;

    categories.forEach(category => {
        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        categoryFilter.appendChild(option);
    });

    categoryFilter.value = currentValue;
}

function displayProducts() {
    const container =
        document.getElementById("productsContainer");

    if (!container) {
        return;
    }

    const searchInput =
        document.getElementById("productSearch");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const searchTerm =
        (searchInput?.value || "").toLowerCase().trim();

    const selectedCategory =
        categoryFilter?.value || "";

    const filteredProducts = products.filter(product => {
        const name =
            String(product.name || "").toLowerCase();

        const description =
            String(product.description || "").toLowerCase();

        const category =
            String(product.category || "");

        const matchesSearch =
            !searchTerm ||
            name.includes(searchTerm) ||
            description.includes(searchTerm);

        const matchesCategory =
            !selectedCategory ||
            category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    if (filteredProducts.length === 0) {
        container.innerHTML =
            "<p>No products found.</p>";
        return;
    }

    container.innerHTML = filteredProducts
        .map(product => createProductCard(product))
        .join("");
}

function createProductCard(product) {
    const id = Number(product.id) || 0;

    const name =
        escapeHtml(product.name || "Product");

    const description =
        escapeHtml(product.description || "");

    const category =
        escapeHtml(product.category || "General");

    const price =
        Number(product.price || 0).toFixed(2);

    const quantity =
        Number(product.quantity || 0);

    const image =
        escapeHtml(getProductImage(product));

    const disabled =
        quantity <= 0 ? "disabled" : "";

    const stockText =
        quantity > 0
            ? `Stock: ${quantity}`
            : "Out of stock";

    return `
        <div class="product-card">
            <img
                src="${image}"
                alt="${name}"
                class="product-image"
                onerror="this.src='https://via.placeholder.com/600x400?text=BerciiMart'"
            >

            <div class="product-info">
                <h3>${name}</h3>

                <p>${description}</p>

                <p>
                    <strong>Category:</strong>
                    ${category}
                </p>

                <p class="price">
                    ₹${price}
                </p>

                <p>${stockText}</p>

                <button
                    onclick="addToCart(${id})"
                    ${disabled}
                >
                    Add to Cart
                </button>
            </div>
        </div>
    `;
}

function getProductImage(product) {
    if (
        product &&
        product.image_url &&
        String(product.image_url).trim() !== ""
    ) {
        return String(product.image_url).trim();
    }

    const name =
        String(product?.name || "")
            .toLowerCase()
            .trim();

    /*
     * IMPORTANT:
     * Headphones are checked BEFORE phone because
     * "headphones" contains the word "phone".
     */

    if (
        name.includes("headphone") ||
        name.includes("earphone") ||
        name.includes("airpod") ||
        name.includes("earbud")
    ) {
        return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80";
    }

    if (
        name.includes("laptop") ||
        name.includes("computer") ||
        name.includes("macbook")
    ) {
        return "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80";
    }

    if (
        name.includes("smartphone") ||
        name.includes("mobile phone") ||
        name.includes("iphone") ||
        name.includes("samsung") ||
        name === "phone" ||
        name.endsWith(" phone")
    ) {
        return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80";
    }

    if (name.includes("keyboard")) {
        return "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80";
    }

    if (name.includes("mouse")) {
        return "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=600&q=80";
    }

    if (
        name.includes("t-shirt") ||
        name.includes("tshirt") ||
        name.includes("shirt")
    ) {
        return "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80";
    }

    if (
        name.includes("shoe") ||
        name.includes("sneaker") ||
        name.includes("footwear")
    ) {
        return "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80";
    }

    if (
        name.includes("smartwatch") ||
        name.includes("watch")
    ) {
        return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80";
    }

    if (
        name.includes("backpack") ||
        name.includes("bag")
    ) {
        return "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80";
    }

    if (name.includes("camera")) {
        return "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80";
    }

    if (
        name.includes("book") ||
        name.includes("python") ||
        name.includes("programming") ||
        name.includes("coding")
    ) {
        return "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80";
    }

    if (name.includes("rice")) {
        return "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80";
    }

    return "https://via.placeholder.com/600x400?text=BerciiMart";
}

async function addToCart(productId) {
    if (!currentUser) {
        alert("Please log in first.");
        showSection("login");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-User-Id": String(currentUser.id)
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                product_id: productId,
                quantity: 1
            })
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
            alert(data.error || "Unable to add product to cart.");
            return;
        }

        alert("Product added to cart.");

    } catch (error) {
        console.error("Add to cart error:", error);
        alert("Unable to connect to the server.");
    }
}

async function loadCart() {
    const container =
        document.getElementById("cartContainer");

    const totalElement =
        document.getElementById("cartTotal");

    if (!container) {
        return;
    }

    if (!currentUser) {
        container.innerHTML =
            "<p>Please log in to view your cart.</p>";

        if (totalElement) {
            totalElement.textContent = "₹0.00";
        }

        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart`, {
            headers: {
                "X-User-Id": String(currentUser.id)
            }
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
            throw new Error(data.error || "Failed to load cart.");
        }

        cart = Array.isArray(data.items)
            ? data.items
            : [];

        if (cart.length === 0) {
            container.innerHTML =
                "<p>Your cart is empty.</p>";

            if (totalElement) {
                totalElement.textContent = "₹0.00";
            }

            return;
        }

        container.innerHTML = cart
            .map(item => {
                const name =
                    escapeHtml(item.name || "Product");

                const quantity =
                    Number(item.quantity || 0);

                const price =
                    Number(item.price || 0);

                return `
                    <div class="cart-item">
                        <strong>${name}</strong>
                        <span>
                            ₹${price.toFixed(2)}
                            × ${quantity}
                        </span>
                    </div>
                `;
            })
            .join("");

        if (totalElement) {
            totalElement.textContent =
                `₹${Number(data.total || 0).toFixed(2)}`;
        }

    } catch (error) {
        console.error("Cart error:", error);
        container.innerHTML =
            "<p>Unable to load cart.</p>";
    }
}

async function checkout() {
    if (!currentUser) {
        alert("Please log in first.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/checkout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-User-Id": String(currentUser.id)
            },
            body: JSON.stringify({
                user_id: currentUser.id
            })
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
            alert(data.error || "Checkout failed.");
            return;
        }

        alert("Order placed successfully.");

        await loadCart();
        await loadOrders();

    } catch (error) {
        console.error("Checkout error:", error);
        alert("Unable to connect to the server.");
    }
}

async function loadOrders() {
    const container =
        document.getElementById("ordersContainer");

    if (!container) {
        return;
    }

    if (!currentUser) {
        container.innerHTML =
            "<p>Please log in to view your orders.</p>";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/orders`, {
            headers: {
                "X-User-Id": String(currentUser.id)
            }
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
            throw new Error(data.error || "Failed to load orders.");
        }

        orders = Array.isArray(data.orders)
            ? data.orders
            : [];

        if (orders.length === 0) {
            container.innerHTML =
                "<p>No orders found.</p>";
            return;
        }

        container.innerHTML = orders
            .map(order => {
                return `
                    <div class="order-card">
                        <h3>Order #${Number(order.id)}</h3>
                        <p>
                            Total:
                            ₹${Number(order.total_amount || 0).toFixed(2)}
                        </p>
                        <p>
                            Status:
                            ${escapeHtml(order.status || "PENDING")}
                        </p>
                        <p>
                            Date:
                            ${escapeHtml(order.order_date || "")}
                        </p>
                    </div>
                `;
            })
            .join("");

    } catch (error) {
        console.error("Orders error:", error);
        container.innerHTML =
            "<p>Unable to load orders.</p>";
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
