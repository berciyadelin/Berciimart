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

    const sellerProductForm =
        document.getElementById("sellerProductForm");

    if (sellerProductForm) {
        sellerProductForm.addEventListener(
            "submit",
            saveSellerProduct
        );
    }

    const paymentForm = document.getElementById("paymentForm");

    if (paymentForm) {
        paymentForm.addEventListener("submit", submitPayment);
    }

    const searchInput = document.getElementById("productSearch");
    const categoryFilter = document.getElementById("categoryFilter");

    if (searchInput) {
        searchInput.addEventListener("input", displayProducts);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", displayProducts);
    }

    const savedUser = localStorage.getItem("berciimart_user");
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);

            if (currentUser && currentUser.id && currentUser.token) {
                showSection("products");
                return;
            }

            // Sessions issued before server-side tokens are invalid.
            currentUser = null;
            localStorage.removeItem("berciimart_user");
        } catch (e) {
            console.error("Failed to parse saved user from localStorage:", e);
        }
    }

    showSection("login");
});

function showRegister() {
    showSection("register");
}

function showLogin() {
    showSection("login");
}

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
        seller: "sellerSection",
        admin: "adminSection",
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

    if (sectionName === "seller") {
        loadSellerProducts();
        loadSellerOrders();
    }

    if (sectionName === "admin") {
        loadAdminData();
    }

    if (sectionName === "orders") {
        loadOrders();
    }

    updateNavVisibility();
}

function updateNavVisibility() {
    const role = currentUser ? currentUser.role : "";

    const sellerButton =
        document.getElementById("sellerNavButton");

    if (sellerButton) {
        sellerButton.hidden =
            !(role === "SELLER" || role === "ADMIN");
    }

    const adminButton =
        document.getElementById("adminNavButton");

    if (adminButton) {
        adminButton.hidden = role !== "ADMIN";
    }
}

function showSellerSection() {
    if (!currentUser) {
        showSection("login");
        return;
    }

    showSection("seller");
}

function showAdminSection() {
    if (!currentUser) {
        showSection("login");
        return;
    }

    showSection("admin");
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

    const usernameInput = document.getElementById("loginEmail") || document.getElementById("loginUsername");
    const username = usernameInput?.value.trim();
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
            role: data.role,
            token: data.session_token || null
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

function authHeaders(extra = {}) {
    const headers = { ...extra };

    if (currentUser && currentUser.token) {
        headers["X-Session-Token"] = currentUser.token;
    }

    return headers;
}

function handleAuthError() {
    currentUser = null;
    cart = [];
    orders = [];

    localStorage.removeItem("berciimart_user");

    showSection("login");
    alert("Your session has ended. Please log in again.");
}

function logout() {
    if (currentUser && currentUser.token) {
        fetch(`${API_URL}/logout`, {
            method: "POST",
            headers: authHeaders()
        }).catch(() => {
            /* offline: local logout still continues */
        });
    }

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

    const rating = Number(product.rating || 0).toFixed(1);

    const reviewCount = Number(product.review_count || 0);

    const ratingText =
        reviewCount > 0
            ? `★ ${rating} (${reviewCount} review${reviewCount === 1 ? "" : "s"})`
            : "No reviews yet";

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

                <p class="product-rating">
                    ${ratingText}
                </p>

                <button
                    onclick="addToCart(${id})"
                    ${disabled}
                >
                    Add to Cart
                </button>

                <button
                    type="button"
                    class="reviews-toggle"
                    onclick="toggleReviews(${id})"
                >
                    Reviews
                </button>

                <div
                    id="reviewsPanel${id}"
                    class="reviews-panel"
                    hidden
                ></div>
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

function renderStars(rating) {
    const value = Math.round(Number(rating) || 0);

    return "\u2605".repeat(value) + "\u2606".repeat(
        Math.max(0, 5 - value)
    );
}

async function toggleReviews(productId) {
    const panel = document.getElementById(`reviewsPanel${productId}`);

    if (!panel) {
        return;
    }

    if (!panel.hidden) {
        panel.hidden = true;
        return;
    }

    await loadReviews(productId);
}

async function loadReviews(productId) {
    const panel = document.getElementById(`reviewsPanel${productId}`);

    if (!panel) {
        return;
    }

    panel.hidden = false;
    panel.innerHTML = "<p>Loading reviews...</p>";

    try {
        const response = await fetch(
            `${API_URL}/reviews?product_id=${productId}`,
            { headers: authHeaders() }
        );

        const data = await response.json();

        if (response.status === 401) {
            handleAuthError();
            return;
        }

        if (!response.ok || data.success === false) {
            throw new Error(data.error || "Failed to load reviews.");
        }

        const reviews = Array.isArray(data.reviews)
            ? data.reviews
            : [];

        const canReview = data.can_review === true;

        const listHtml =
            reviews.length === 0
                ? '<p class="review-empty">No reviews yet. Be the first!</p>'
                : `<ul class="review-list">${reviews
                      .map(review => {
                          const authorId =
                              Number(review.user_id) || 0;

                          const isAdmin =
                              currentUser &&
                              currentUser.role === "ADMIN";

                          const mine =
                              currentUser &&
                              Number(currentUser.id) === authorId;

                          const canDelete = mine || isAdmin;

                          return `
                            <li class="review-item">
                                <div class="review-head">
                                    <strong>${escapeHtml(
                                        review.name || "Buyer"
                                    )}</strong>
                                    <span class="review-stars">${renderStars(
                                        review.rating
                                    )}</span>
                                    ${
                                        canDelete
                                            ? `<button type="button" class="review-delete" onclick="deleteReview(${Number(
                                                  review.id
                                              ) || 0}, ${productId})">Delete</button>`
                                            : ""
                                    }
                                </div>
                                <p>${escapeHtml(
                                    review.comment || ""
                                )}</p>
                                <time>${escapeHtml(
                                    review.created_at || ""
                                )}</time>
                            </li>
                        `;
                      })
                      .join("")}</ul>`;

        const formHtml = canReview
            ? `
                <form
                    id="reviewForm${productId}"
                    class="review-form"
                    onsubmit="return submitReview(event, ${productId})"
                >
                    <label for="reviewRating${productId}">Your rating</label>
                    <select id="reviewRating${productId}" required>
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Average</option>
                        <option value="2">2 - Poor</option>
                        <option value="1">1 - Bad</option>
                    </select>
                    <label for="reviewComment${productId}">Your review</label>
                    <textarea
                        id="reviewComment${productId}"
                        maxlength="1000"
                        placeholder="What did you like or dislike?"
                    ></textarea>
                    <button type="submit">Post review</button>
                </form>`
            : "";

        panel.innerHTML = listHtml + formHtml;

    } catch (error) {
        console.error("Review loading error:", error);

        panel.innerHTML =
            '<p class="error">Unable to load reviews.</p>';
    }
}

async function submitReview(event, productId) {
    event.preventDefault();

    if (!currentUser) {
        showSection("login");
        return false;
    }

    const ratingInput =
        document.getElementById(`reviewRating${productId}`);

    const commentInput =
        document.getElementById(`reviewComment${productId}`);

    try {
        const response = await fetch(`${API_URL}/reviews`, {
            method: "POST",
            headers: authHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({
                product_id: productId,
                rating: Number(ratingInput.value),
                comment: commentInput.value
            })
        });

        const data = await response.json();

        if (response.status === 401) {
            handleAuthError();
            return false;
        }

        if (!response.ok || data.success === false) {
            alert(`Review failed: ${data.error || response.status}`);
            return false;
        }

        await loadProducts();
        await loadReviews(productId);

        return false;

    } catch (error) {
        console.error("Review submit error:", error);
        alert("Unable to connect to the server.");
        return false;
    }
}

async function deleteReview(reviewId, productId) {
    if (!currentUser) {
        showSection("login");
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/reviews?id=${reviewId}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            handleAuthError();
            return;
        }

        if (!response.ok || data.success === false) {
            alert(
                `Could not delete review: ${data.error || response.status}`
            );
            return;
        }

        await loadProducts();
        await loadReviews(productId);

    } catch (error) {
        console.error("Review delete error:", error);
        alert("Unable to connect to the server.");
    }
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
            headers: authHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({
                product_id: productId,
                quantity: 1
            })
        });

        const data = await response.json();

        if (response.status === 401) {
            handleAuthError();
            return;
        }

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
            headers: authHeaders()
        });

        const data = await response.json();

        if (response.status === 401) {
            handleAuthError();
            return;
        }

        if (!response.ok || data.success === false) {
            throw new Error(data.error || "Failed to load cart.");
        }

        cart = Array.isArray(data.cart)
            ? data.cart
            : (Array.isArray(data.items) ? data.items : []);

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

                const productId =
                    Number(item.product_id) || 0;

                return `
                    <div class="cart-item">
                        <strong>${name}</strong>
                        <span>
                            ₹${price.toFixed(2)}
                            × ${quantity}
                        </span>

                        <div class="cart-item-controls">
                            <button
                                type="button"
                                aria-label="Decrease quantity"
                                onclick="changeCartQuantity(${productId}, ${quantity - 1})"
                                ${quantity <= 1 ? "disabled" : ""}
                            >−</button>

                            <span class="cart-quantity">${quantity}</span>

                            <button
                                type="button"
                                aria-label="Increase quantity"
                                onclick="changeCartQuantity(${productId}, ${quantity + 1})"
                            >+</button>

                            <button
                                type="button"
                                class="remove-btn"
                                onclick="removeFromCart(${productId})"
                            >Remove</button>
                        </div>
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

async function changeCartQuantity(productId, quantity) {
    if (!currentUser) {
        showSection("login");
        return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
        await removeFromCart(productId);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cart`, {
            method: "PUT",
            headers: authHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            })
        });

        const data = await response.json();

        if (response.status === 401) {
            handleAuthError();
            return;
        }

        if (!response.ok || data.success === false) {
            alert(data.error || "Unable to update cart.");
            return;
        }

        await loadCart();

    } catch (error) {
        console.error("Cart update error:", error);
        alert("Unable to connect to the server.");
    }
}

async function removeFromCart(productId) {
    if (!currentUser) {
        showSection("login");
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/cart?product_id=${encodeURIComponent(productId)}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            handleAuthError();
            return;
        }

        if (!response.ok || data.success === false) {
            alert(data.error || "Unable to remove item.");
            return;
        }

        await loadCart();

    } catch (error) {
        console.error("Cart remove error:", error);
        alert("Unable to connect to the server.");
    }
}

function openPaymentModal() {
    if (!currentUser) {
        alert("Please log in first.");
        return;
    }

    const modal = document.getElementById("paymentModal");
    const totalElement = document.getElementById("cartTotal");
    const paymentTotal = document.getElementById("paymentTotal");
    const message = document.getElementById("paymentMessage");

    if (!modal) {
        return;
    }

    if (paymentTotal) {
        paymentTotal.textContent =
            totalElement ? totalElement.textContent : "0.00";
    }

    if (message) {
        message.textContent = "";
    }

    modal.hidden = false;
}

function closePaymentModal() {
    const modal = document.getElementById("paymentModal");

    if (modal) {
        modal.hidden = true;
    }
}

function checkout() {
    openPaymentModal();
}

async function submitPayment(event) {
    event.preventDefault();

    const cardInput = document.getElementById("paymentCard");
    const expiryInput = document.getElementById("paymentExpiry");
    const cvcInput = document.getElementById("paymentCvc");
    const message = document.getElementById("paymentMessage");
    const submitButton = document.getElementById("paymentSubmit");

    const card = (cardInput?.value || "").replace(/[\s-]/g, "");
    const expiry = (expiryInput?.value || "").trim();
    const cvc = (cvcInput?.value || "").trim();

    // Client-side validation of the mock card form only;
    // no card data is ever sent to the server.
    if (!/^\d{16}$/.test(card)) {
        if (message) {
            message.textContent = "Enter a 16-digit card number.";
        }
        return;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
        if (message) {
            message.textContent = "Enter expiry as MM/YY.";
        }
        return;
    }

    if (!/^\d{3,4}$/.test(cvc)) {
        if (message) {
            message.textContent = "Enter a 3 or 4 digit CVC.";
        }
        return;
    }

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Processing...";
    }

    if (message) {
        message.textContent = "";
    }

    try {
        const response = await fetch(`${API_URL}/checkout`, {
            method: "POST",
            headers: authHeaders({
                "Content-Type": "application/json"
            }),
            body: JSON.stringify({})
        });

        const data = await response.json();

        if (response.status === 401) {
            handleAuthError();
            return;
        }

        if (!response.ok || data.success === false) {
            if (message) {
                message.textContent =
                    data.error || "Checkout failed.";
            }
            return;
        }

        closePaymentModal();

        alert(
            "Mock payment confirmed. Order #" +
            Number(data.order_id) +
            " placed for ₹" +
            Number(data.total || 0).toFixed(2) +
            "."
        );

        if (cardInput) cardInput.value = "";
        if (expiryInput) expiryInput.value = "";
        if (cvcInput) cvcInput.value = "";

        await loadCart();
        await loadOrders();

    } catch (error) {
        console.error("Checkout error:", error);

        if (message) {
            message.textContent =
                "Unable to connect to the server. Please try again.";
        }
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Pay (mock)";
        }
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
            headers: authHeaders()
        });

        const data = await response.json();

        if (response.status === 401) {
            handleAuthError();
            return;
        }

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

let sellerProducts = [];
let editingProductId = null;

const ORDER_TRANSITIONS = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: []
};

async function loadSellerProducts() {
    const container =
        document.getElementById("sellerProductsContainer");

    if (!container) {
        return;
    }

    if (!currentUser) {
        container.innerHTML =
            "<p>Please log in to view your products.</p>";
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/seller/products`,
            { headers: authHeaders() }
        );

        const data = await response.json();

        if (response.status === 401) {
            handleAuthError();
            return;
        }

        if (response.status === 403) {
            container.innerHTML =
                "<p>Seller access required. Register a " +
                "seller account or contact an administrator.</p>";
            return;
        }

        if (!response.ok || data.success === false) {
            throw new Error(
                data.error || "Failed to load your products."
            );
        }

        sellerProducts =
            Array.isArray(data.products) ? data.products : [];

        if (sellerProducts.length === 0) {
            container.innerHTML =
                "<p>You have not listed any products yet.</p>";
            return;
        }

        container.innerHTML = sellerProducts
            .map(product => {
                const id = Number(product.id) || 0;

                return `
                    <div class="seller-product">
                        <strong>${escapeHtml(product.name || "Product")}</strong>
                        <span>
                            ₹${Number(product.price || 0).toFixed(2)}
                            · stock ${Number(product.quantity || 0)}
                            · ${escapeHtml(product.category || "General")}
                        </span>
                        <p>${escapeHtml(product.description || "")}</p>
                        <div class="seller-product-actions">
                            <button type="button"
                                onclick="editSellerProduct(${id})">Edit</button>
                            <button type="button" class="remove-btn"
                                onclick="deleteSellerProduct(${id})">Delete</button>
                        </div>
                    </div>
                `;
            })
            .join("");

    } catch (error) {
        console.error("Seller products error:", error);
        container.innerHTML =
            "<p>Unable to load your products.</p>";
    }
}

async function saveSellerProduct(event) {
    event.preventDefault();

    const message =
        document.getElementById("sellerMessage");

    const name =
        document.getElementById("sellerName")?.value.trim();
    const description =
        document.getElementById("sellerDescription")?.value.trim() || "";
    const price =
        Number(document.getElementById("sellerPrice")?.value);
    const quantity =
        Number(document.getElementById("sellerStock")?.value);
    const category =
        document.getElementById("sellerCategory")?.value.trim() || "General";
    const imageUrl =
        document.getElementById("sellerImage")?.value.trim() || "";

    if (!name) {
        if (message) {
            message.textContent = "Product name is required.";
        }
        return;
    }

    if (!Number.isFinite(price) || price < 0) {
        if (message) {
            message.textContent = "Enter a valid price.";
        }
        return;
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
        if (message) {
            message.textContent = "Enter a valid stock quantity.";
        }
        return;
    }

    const payload = {
        name: name,
        description: description,
        price: price,
        quantity: quantity,
        category: category,
        image_url: imageUrl
    };

    const isEdit = editingProductId !== null;

    if (isEdit) {
        payload.id = editingProductId;
    }

    try {
        const response = await fetch(
            `${API_URL}/seller/products`,
            {
                method: isEdit ? "PUT" : "POST",
                headers: authHeaders({
                    "Content-Type": "application/json"
                }),
                body: JSON.stringify(payload)
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            handleAuthError();
            return;
        }

        if (!response.ok || data.success === false) {
            if (message) {
                message.textContent =
                    data.error || "Saving the product failed.";
            }
            return;
        }

        resetSellerForm();
        await loadSellerProducts();
        await loadProducts();

    } catch (error) {
        console.error("Seller save error:", error);

        if (message) {
            message.textContent =
                "Unable to connect to the server.";
        }
    }
}

function editSellerProduct(productId) {
    const product = sellerProducts.find(
        item => Number(item.id) === Number(productId)
    );

    if (!product) {
        return;
    }

    editingProductId = Number(productId);

    const setTitle =
        document.getElementById("sellerFormTitle");
    const submitButton =
        document.getElementById("sellerSubmit");
    const cancelButton =
        document.getElementById("sellerCancelEdit");
    const message =
        document.getElementById("sellerMessage");

    if (setTitle) setTitle.textContent = "Edit Product";
    if (submitButton) submitButton.textContent = "Save changes";
    if (cancelButton) cancelButton.hidden = false;
    if (message) message.textContent = "";

    const set = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.value = value;
    };

    set("sellerName", product.name || "");
    set("sellerDescription", product.description || "");
    set("sellerPrice", product.price ?? "");
    set("sellerStock", product.quantity ?? "");
    set("sellerCategory", product.category || "General");
    set("sellerImage", product.image_url || "");

    const form = document.getElementById("sellerProductForm");
    if (form) form.scrollIntoView({ behavior: "smooth" });
}

function resetSellerForm() {
    const form =
        document.getElementById("sellerProductForm");

    if (form) {
        form.reset();
    }

    editingProductId = null;

    const setTitle =
        document.getElementById("sellerFormTitle");
    const submitButton =
        document.getElementById("sellerSubmit");
    const cancelButton =
        document.getElementById("sellerCancelEdit");
    const message =
        document.getElementById("sellerMessage");

    if (setTitle) setTitle.textContent = "Add Product";
    if (submitButton) submitButton.textContent = "Add product";
    if (cancelButton) cancelButton.hidden = true;
    if (message) message.textContent = "";
}

async function deleteSellerProduct(productId) {
    if (!confirm("Delete this product from your store?")) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/seller/products?id=${encodeURIComponent(productId)}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            handleAuthError();
            return;
        }

        if (!response.ok || data.success === false) {
            alert(data.error || "Unable to delete product.");
            return;
        }

        await loadSellerProducts();
        await loadProducts();

    } catch (error) {
        console.error("Seller delete error:", error);
        alert("Unable to connect to the server.");
    }
}

async function loadSellerOrders() {
    const container =
        document.getElementById("sellerOrdersContainer");

    if (!container) {
        return;
    }

    if (!currentUser) {
        container.innerHTML =
            "<p>Please log in to view orders.</p>";
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/seller/orders`,
            { headers: authHeaders() }
        );

        const data = await response.json();

        if (response.status === 401) {
            handleAuthError();
            return;
        }

        if (response.status === 403) {
            container.innerHTML =
                "<p>Seller access required.</p>";
            return;
        }

        if (!response.ok || data.success === false) {
            throw new Error(
                data.error || "Failed to load orders."
            );
        }

        const orders = Array.isArray(data.orders)
            ? data.orders
            : [];

        if (orders.length === 0) {
            container.innerHTML =
                "<p>No orders contain your products yet.</p>";
            return;
        }

        container.innerHTML = orders
            .map(order => {
                const id = Number(order.id) || 0;
                const status =
                    escapeHtml(order.status || "PENDING");
                const allowed =
                    ORDER_TRANSITIONS[order.status] || [];

                const options = allowed
                    .map(next =>
                        `<option value="${next}">${next}</option>`
                    )
                    .join("");

                const controls = allowed.length > 0
                    ? `
                        <div class="status-controls">
                            <select id="statusFor${id}"
                                aria-label="New status">
                                ${options}
                            </select>
                            <button type="button"
                                onclick="updateSellerOrderStatus(${id}, document.getElementById('statusFor${id}').value)">
                                Update
                            </button>
                        </div>
                    `
                    : `<p class="status-final">No further updates</p>`;

                return `
                    <div class="order-card">
                        <h3>Order #${id}</h3>
                        <p>${escapeHtml(order.my_items || "")}</p>
                        <p>
                            Total: ₹${Number(order.total_amount || 0).toFixed(2)}
                        </p>
                        <p>Status: <strong>${status}</strong></p>
                        <p class="order-date">
                            ${escapeHtml(order.order_date || "")}
                        </p>
                        ${controls}
                    </div>
                `;
            })
            .join("");

    } catch (error) {
        console.error("Seller orders error:", error);
        container.innerHTML =
            "<p>Unable to load orders.</p>";
    }
}

async function updateSellerOrderStatus(orderId, status) {
    if (!status) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/seller/orders`,
            {
                method: "PUT",
                headers: authHeaders({
                    "Content-Type": "application/json"
                }),
                body: JSON.stringify({
                    order_id: orderId,
                    status: status
                })
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            handleAuthError();
            return;
        }

        if (!response.ok || data.success === false) {
            alert(data.error || "Unable to update the status.");
            return;
        }

        await loadSellerOrders();

    } catch (error) {
        console.error("Order status error:", error);
        alert("Unable to connect to the server.");
    }
}

async function loadAdminData() {
    await Promise.all([
        loadAdminStats(),
        loadAdminUsers(),
        loadAdminOrders(),
        loadAdminProducts()
    ]);
}

async function adminFetch(path) {
    const response = await fetch(`${API_URL}${path}`, {
        headers: authHeaders()
    });

    const data = await response.json();

    if (response.status === 401) {
        handleAuthError();
        throw new Error("Login required");
    }

    if (response.status === 403) {
        throw new Error(
            "Administrator access required."
        );
    }

    if (!response.ok || data.success === false) {
        throw new Error(data.error || "Request failed.");
    }

    return data;
}

async function loadAdminStats() {
    try {
        const data = await adminFetch("/admin/stats");

        const set = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        set("statUsers", Number(data.users || 0));
        set("statProducts", Number(data.products || 0));
        set("statOrders", Number(data.orders || 0));
        set(
            "statRevenue",
            "₹" + Number(data.revenue || 0).toFixed(2)
        );

    } catch (error) {
        console.error("Admin stats error:", error);
    }
}

async function loadAdminUsers() {
    const container =
        document.getElementById("adminUsersContainer");

    if (!container) {
        return;
    }

    try {
        const data = await adminFetch("/admin/users");
        const users = Array.isArray(data.users)
            ? data.users
            : [];

        if (users.length === 0) {
            container.innerHTML = "<p>No users found.</p>";
            return;
        }

        container.innerHTML = `
            <div class="table-wrap">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${Number(user.id) || 0}</td>
                                <td>${escapeHtml(user.name || "")}</td>
                                <td>${escapeHtml(user.email || "")}</td>
                                <td><span class="role-badge role-${escapeHtml(String(user.role || "").toLowerCase())}">${escapeHtml(user.role || "")}</span></td>
                                <td>${escapeHtml(String(user.created_at || "").slice(0, 10))}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;

    } catch (error) {
        console.error("Admin users error:", error);
        container.innerHTML =
            `<p>${escapeHtml(error.message)}</p>`;
    }
}

async function loadAdminOrders() {
    const container =
        document.getElementById("adminOrdersContainer");

    if (!container) {
        return;
    }

    try {
        const data = await adminFetch("/admin/orders");
        const orders = Array.isArray(data.orders)
            ? data.orders
            : [];

        if (orders.length === 0) {
            container.innerHTML = "<p>No orders yet.</p>";
            return;
        }

        container.innerHTML = orders
            .map(order => `
                <div class="order-card">
                    <h3>Order #${Number(order.id) || 0}</h3>
                    <p>
                        ${escapeHtml(order.buyer_name || "")}
                        (${escapeHtml(order.buyer_email || "")})
                    </p>
                    <p>${escapeHtml(order.items || "")}</p>
                    <p>
                        Total: ₹${Number(order.total_amount || 0).toFixed(2)}
                    </p>
                    <p>Status:
                        <strong>${escapeHtml(order.status || "PENDING")}</strong>
                    </p>
                    <p class="order-date">
                        ${escapeHtml(order.order_date || "")}
                    </p>
                </div>
            `)
            .join("");

    } catch (error) {
        console.error("Admin orders error:", error);
        container.innerHTML =
            `<p>${escapeHtml(error.message)}</p>`;
    }
}

async function loadAdminProducts() {
    const container =
        document.getElementById("adminProductsContainer");

    if (!container) {
        return;
    }

    try {
        const data = await adminFetch("/admin/products");
        const products = Array.isArray(data.products)
            ? data.products
            : [];

        if (products.length === 0) {
            container.innerHTML =
                "<p>No listings found.</p>";
            return;
        }

        container.innerHTML = products
            .map(product => `
                <div class="seller-product">
                    <strong>${escapeHtml(product.name || "Product")}</strong>
                    <span>
                        ₹${Number(product.price || 0).toFixed(2)}
                        · stock ${Number(product.quantity || 0)}
                        · ${escapeHtml(product.category || "General")}
                        · seller: ${escapeHtml(product.seller || "Unassigned")}
                    </span>
                    <div class="seller-product-actions">
                        <button type="button" class="remove-btn"
                            onclick="removeAdminProduct(${Number(product.id) || 0})">
                            Remove listing
                        </button>
                    </div>
                </div>
            `)
            .join("");

    } catch (error) {
        console.error("Admin products error:", error);
        container.innerHTML =
            `<p>${escapeHtml(error.message)}</p>`;
    }
}

async function removeAdminProduct(productId) {
    if (!confirm("Remove this listing from the marketplace?")) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/admin/products?id=${encodeURIComponent(productId)}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        const data = await response.json();

        if (response.status === 401) {
            handleAuthError();
            return;
        }

        if (!response.ok || data.success === false) {
            alert(data.error || "Unable to remove listing.");
            return;
        }

        await loadAdminProducts();
        await loadProducts();

    } catch (error) {
        console.error("Admin remove error:", error);
        alert("Unable to connect to the server.");
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
