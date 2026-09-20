const API_URL = "/api";

let currentUser = JSON.parse(
    localStorage.getItem("berciimart_user")
) || null;

let products = [];
let cart = [];
let orders = [];

/*
 * ---------------------------------------------------------
 * PRODUCT IMAGES
 * ---------------------------------------------------------
 */

const productImages = {
    laptop:
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",

    mouse:
        "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=800&q=80",

    keyboard:
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",

    tshirt:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",

    pythonBook:
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80",

    cBook:
        "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80",

    rice:
        "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",

    watch:
        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",

    fallback:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80"
};


/*
 * ---------------------------------------------------------
 * NORMALIZE PRODUCT NAME
 * ---------------------------------------------------------
 */

function normalizeProductName(name) {
    return String(name || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


/*
 * ---------------------------------------------------------
 * GET CORRECT PRODUCT IMAGE
 * ---------------------------------------------------------
 */

function getProductImage(product) {

    /*
     * If the database already has an image URL,
     * use it first.
     */
    if (
        product &&
        product.image_url &&
        String(product.image_url).trim() !== ""
    ) {
        return String(product.image_url).trim();
    }

    const name = normalizeProductName(
        product?.name
    );


    /*
     * LAPTOP
     */
    if (
        name === "laptop" ||
        name.includes("laptop")
    ) {
        return productImages.laptop;
    }


    /*
     * MOUSE
     */
    if (
        name === "mouse" ||
        name.includes("mouse")
    ) {
        return productImages.mouse;
    }


    /*
     * KEYBOARD
     */
    if (
        name === "keyboard" ||
        name.includes("keyboard")
    ) {
        return productImages.keyboard;
    }


    /*
     * T-SHIRT
     */
    if (
        name === "t-shirt" ||
        name === "tshirt" ||
        name.includes("t-shirt") ||
        name.includes("tshirt") ||
        name.includes("shirt")
    ) {
        return productImages.tshirt;
    }


    /*
     * C PROGRAMMING BOOK
     */
    if (
        name.includes("c programming book") ||
        name.includes("c programming") ||
        name.includes("c book")
    ) {
        return productImages.cBook;
    }


    /*
     * PYTHON BOOK
     */
    if (
        name.includes("python book") ||
        name.includes("python")
    ) {
        return productImages.pythonBook;
    }


    /*
     * RICE
     */
    if (
        name.includes("rice") ||
        name.includes("rice bag") ||
        name.includes("rice 5kg") ||
        name.includes("rice 5 kg")
    ) {
        return productImages.rice;
    }


    /*
     * WATCH
     *
     * Only an actual Watch gets the watch image.
     */
    if (
        name === "watch" ||
        name.includes("watch")
    ) {
        return productImages.watch;
    }


    /*
     * OTHER BOOKS
     */
    if (
        name.includes("book") ||
        name.includes("programming")
    ) {
        return productImages.cBook;
    }


    /*
     * FALLBACK
     */
    return productImages.fallback;
}


/*
 * ---------------------------------------------------------
 * HTML ESCAPING
 * ---------------------------------------------------------
 */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/*
 * ---------------------------------------------------------
 * PRICE FORMAT
 * ---------------------------------------------------------
 */

function formatPrice(price) {

    const number = Number(price);

    if (!Number.isFinite(number)) {
        return "₹0.00";
    }

    return `₹${number.toFixed(2)}`;
}


/*
 * ---------------------------------------------------------
 * CURRENT USER ID
 * ---------------------------------------------------------
 */

function getCurrentUserId() {

    if (!currentUser) {
        return 0;
    }

    return Number(
        currentUser.user_id ||
        currentUser.id ||
        currentUser.userId ||
        0
    );
}


/*
 * ---------------------------------------------------------
 * CURRENT USER NAME
 * ---------------------------------------------------------
 */

function getCurrentUserName() {

    if (!currentUser) {
        return "";
    }

    return (
        currentUser.name ||
        currentUser.username ||
        currentUser.email ||
        ""
    );
}


/*
 * ---------------------------------------------------------
 * API REQUEST
 * ---------------------------------------------------------
 */

async function apiRequest(endpoint, options = {}) {

    const config = {
        ...options,
        headers: {
            ...(options.headers || {})
        }
    };


    if (
        options.body &&
        typeof options.body !== "string"
    ) {

        config.headers["Content-Type"] =
            "application/json";

        config.body =
            JSON.stringify(options.body);
    }


    const response = await fetch(
        `${API_URL}${endpoint}`,
        config
    );


    let data = {};

    try {
        data = await response.json();
    }
    catch (error) {
        data = {};
    }


    if (!response.ok) {

        throw new Error(
            data.message ||
            data.error ||
            `Request failed with status ${response.status}`
        );
    }


    return data;
}


/*
 * ---------------------------------------------------------
 * SHOW SECTION
 * ---------------------------------------------------------
 */

function showSection(sectionId) {

    document
        .querySelectorAll(".section")
        .forEach(section => {

            section.classList.remove("active");
        });


    const section =
        document.getElementById(sectionId);


    if (section) {
        section.classList.add("active");
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


/*
 * ---------------------------------------------------------
 * LOGIN
 * ---------------------------------------------------------
 */

async function login() {

    const emailInput =
        document.getElementById("loginEmail");

    const passwordInput =
        document.getElementById("loginPassword");


    const email =
        emailInput?.value.trim() || "";

    const password =
        passwordInput?.value || "";


    if (!email || !password) {

        alert(
            "Please enter email and password."
        );

        return;
    }


    try {

        const data =
            await apiRequest("/login", {

                method: "POST",

                body: {
                    email: email,
                    password: password
                }
            });


        if (!data.success) {

            throw new Error(
                data.message ||
                "Login failed."
            );
        }


        currentUser = data;


        localStorage.setItem(
            "berciimart_user",
            JSON.stringify(currentUser)
        );


        alert("Login successful!");


        updateNavigation();


        showSection(
            "productsSection"
        );


        await loadProducts();

    }
    catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Login failed."
        );
    }
}


/*
 * ---------------------------------------------------------
 * REGISTER
 * ---------------------------------------------------------
 */

async function register() {

    const nameInput =
        document.getElementById("registerName");

    const emailInput =
        document.getElementById("registerEmail");

    const passwordInput =
        document.getElementById("registerPassword");


    const name =
        nameInput?.value.trim() || "";

    const email =
        emailInput?.value.trim() || "";

    const password =
        passwordInput?.value || "";


    if (!name || !email || !password) {

        alert(
            "Please fill in all registration fields."
        );

        return;
    }


    try {

        const data =
            await apiRequest("/register", {

                method: "POST",

                body: {
                    name: name,
                    email: email,
                    password: password
                }
            });


        if (!data.success) {

            throw new Error(
                data.message ||
                "Registration failed."
            );
        }


        alert(
            "Registration successful! Please login."
        );


        showSection(
            "loginSection"
        );

    }
    catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Registration failed."
        );
    }
}


/*
 * ---------------------------------------------------------
 * LOGOUT
 * ---------------------------------------------------------
 */

function logout() {

    currentUser = null;

    cart = [];

    orders = [];


    localStorage.removeItem(
        "berciimart_user"
    );


    updateNavigation();


    showSection(
        "loginSection"
    );
}


/*
 * ---------------------------------------------------------
 * UPDATE NAVIGATION
 * ---------------------------------------------------------
 */

function updateNavigation() {

    const user = currentUser;


    const loginButton =
        document.getElementById("loginNav");

    const registerButton =
        document.getElementById("registerNav");

    const logoutButton =
        document.getElementById("logoutNav");


    if (loginButton) {

        loginButton.style.display =
            user
                ? "none"
                : "inline-block";
    }


    if (registerButton) {

        registerButton.style.display =
            user
                ? "none"
                : "inline-block";
    }


    if (logoutButton) {

        logoutButton.style.display =
            user
                ? "inline-block"
                : "none";
    }


    const userDisplay =
        document.getElementById(
            "userDisplay"
        );


    if (userDisplay) {

        userDisplay.textContent =
            user
                ? `Welcome, ${getCurrentUserName()}`
                : "";
    }
}


/*
 * ---------------------------------------------------------
 * LOAD PRODUCTS
 * ---------------------------------------------------------
 */

async function loadProducts() {

    try {

        const data =
            await apiRequest("/products");


        products =
            Array.isArray(data.products)
                ? data.products
                : [];


        populateCategories();


        displayProducts(
            products
        );

    }
    catch (error) {

        console.error(error);


        const container =
            document.getElementById(
                "productsContainer"
            );


        if (container) {

            container.innerHTML = `
                <p class="error-message">
                    Unable to load products.
                </p>
            `;
        }


        console.error(
            "Product loading error:",
            error.message
        );
    }
}


/*
 * ---------------------------------------------------------
 * POPULATE CATEGORIES
 * ---------------------------------------------------------
 */

function populateCategories() {

    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    if (!categoryFilter) {
        return;
    }


    const currentValue =
        categoryFilter.value;


    const categories = [
        ...new Set(
            products
                .map(
                    product =>
                        product.category
                )
                .filter(
                    category =>
                        category
                )
        )
    ].sort();


    categoryFilter.innerHTML = `
        <option value="">
            All Categories
        </option>
    `;


    categories.forEach(category => {

        const option =
            document.createElement(
                "option"
            );


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


/*
 * ---------------------------------------------------------
 * DISPLAY PRODUCTS
 *
 * Duplicate product names are removed from display.
 * ---------------------------------------------------------
 */

function displayProducts(productList) {

    const container =
        document.getElementById(
            "productsContainer"
        );


    if (!container) {
        return;
    }


    /*
     * Remove duplicate product names.
     *
     * Example:
     * Laptop
     * Laptop
     * Laptop
     *
     * becomes:
     * Laptop
     */
    const uniqueProducts = [];

    const seenNames =
        new Set();


    productList.forEach(product => {

        const name =
            normalizeProductName(
                product.name
            );


        if (!seenNames.has(name)) {

            seenNames.add(name);

            uniqueProducts.push(
                product
            );
        }
    });


    if (!uniqueProducts.length) {

        container.innerHTML = `
            <p>
                No products found.
            </p>
        `;

        return;
    }


    container.innerHTML =
        uniqueProducts
            .map(product => {

                const image =
                    getProductImage(
                        product
                    );


                const stock =
                    Number(
                        product.quantity || 0
                    );


                const disabled =
                    stock <= 0
                        ? "disabled"
                        : "";


                const buttonText =
                    stock <= 0
                        ? "Out of Stock"
                        : "Add to Cart";


                return `
                    <div class="product-card">

                        <img
                            src="${escapeHtml(image)}"
                            alt="${escapeHtml(product.name)}"
                            class="product-image"
                            loading="lazy"
                            onerror="
                                this.onerror=null;
                                this.src='${productImages.fallback}';
                            "
                        >

                        <h2>
                            ${escapeHtml(
                                product.name
                            )}
                        </h2>

                        <p>
                            ${escapeHtml(
                                product.description ||
                                "No description available."
                            )}
                        </p>

                        <p class="price">
                            ${formatPrice(
                                product.price
                            )}
                        </p>

                        <p>
                            Category:
                            ${escapeHtml(
                                product.category ||
                                "General"
                            )}
                        </p>

                        <p>
                            Stock:
                            ${stock}
                        </p>

                        <button
                            ${disabled}
                            onclick="addToCart(
                                ${Number(product.id)}
                            )"
                        >
                            ${buttonText}
                        </button>

                    </div>
                `;

            })
            .join("");
}


/*
 * ---------------------------------------------------------
 * FILTER PRODUCTS
 * ---------------------------------------------------------
 */

function filterProducts() {

    const searchInput =
        document.getElementById(
            "productSearch"
        );


    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    const searchTerm =
        (
            searchInput?.value || ""
        )
            .trim()
            .toLowerCase();


    const category =
        categoryFilter?.value || "";


    const filtered =
        products.filter(product => {

            const name =
                String(
                    product.name || ""
                ).toLowerCase();


            const description =
                String(
                    product.description || ""
                ).toLowerCase();


            const productCategory =
                String(
                    product.category || ""
                );


            const matchesSearch =
                !searchTerm ||
                name.includes(searchTerm) ||
                description.includes(searchTerm);


            const matchesCategory =
                !category ||
                productCategory === category;


            return (
                matchesSearch &&
                matchesCategory
            );
        });


    displayProducts(
        filtered
    );
}


/*
 * ---------------------------------------------------------
 * ADD TO CART
 * ---------------------------------------------------------
 */

async function addToCart(productId) {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        showSection(
            "loginSection"
        );

        return;
    }


    const userId =
        getCurrentUserId();


    if (!userId) {

        alert(
            "Unable to identify the logged-in user."
        );

        return;
    }


    try {

        const data =
            await apiRequest("/cart", {

                method: "POST",

                body: {
                    user_id: userId,
                    product_id: Number(productId),
                    quantity: 1
                }
            });


        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to add product to cart."
            );
        }


        alert(
            "Product added to cart."
        );


        await loadCart();

    }
    catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Unable to add product to cart."
        );
    }
}


/*
 * ---------------------------------------------------------
 * LOAD CART
 * ---------------------------------------------------------
 */

async function loadCart() {

    if (!currentUser) {

        cart = [];

        displayCart();

        return;
    }


    const userId =
        getCurrentUserId();


    if (!userId) {

        cart = [];

        displayCart();

        return;
    }


    try {

        const data =
            await apiRequest(
                "/cart",
                {
                    method: "GET",

                    headers: {
                        "X-User-Id":
                            String(userId)
                    }
                }
            );


        cart =
            Array.isArray(data.items)
                ? data.items
                : Array.isArray(data.cart)
                    ? data.cart
                    : [];


        displayCart();

    }
    catch (error) {

        console.error(error);


        cart = [];


        displayCart();


        alert(
            error.message ||
            "Unable to load cart."
        );
    }
}


/*
 * ---------------------------------------------------------
 * DISPLAY CART
 * ---------------------------------------------------------
 */

function displayCart() {

    const container =
        document.getElementById(
            "cartContainer"
        );


    if (!container) {
        return;
    }


    if (!cart.length) {

        container.innerHTML = `
            <div class="cart-item">
                <p>
                    Your cart is empty.
                </p>
            </div>
        `;

        return;
    }


    let total = 0;


    container.innerHTML =
        cart
            .map(item => {

                const price =
                    Number(
                        item.price || 0
                    );


                const quantity =
                    Number(
                        item.quantity || 0
                    );


                const itemTotal =
                    price * quantity;


                total += itemTotal;


                return `
                    <div class="cart-item">

                        <h3>
                            ${escapeHtml(
                                item.name ||
                                "Product"
                            )}
                        </h3>

                        <p>
                            Price:
                            ${formatPrice(
                                price
                            )}
                        </p>

                        <p>
                            Quantity:
                            ${quantity}
                        </p>

                        <p>
                            Item Total:
                            ${formatPrice(
                                itemTotal
                            )}
                        </p>

                    </div>
                `;

            })
            .join("");


    container.innerHTML += `
        <div class="cart-summary">

            <h2>
                Total:
                ${formatPrice(total)}
            </h2>

            <button
                onclick="checkout()"
            >
                Checkout
            </button>

        </div>
    `;
}


/*
 * ---------------------------------------------------------
 * CHECKOUT
 * ---------------------------------------------------------
 */

async function checkout() {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;
    }


    const userId =
        getCurrentUserId();


    if (!userId) {

        alert(
            "Unable to identify the logged-in user."
        );

        return;
    }


    if (!cart.length) {

        alert(
            "Your cart is empty."
        );

        return;
    }


    const confirmed =
        confirm(
            "Proceed with mock payment and checkout?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const data =
            await apiRequest(
                "/checkout",
                {

                    method: "POST",

                    body: {
                        user_id: userId
                    }
                }
            );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Checkout failed."
            );
        }


        alert(
            `Payment confirmed!\nOrder ID: ${data.order_id}`
        );


        cart = [];


        await loadCart();

        await loadProducts();

        await loadOrders();


        showSection(
            "ordersSection"
        );

    }
    catch (error) {

        console.error(error);

        alert(
            error.message ||
            "Checkout failed."
        );
    }
}


/*
 * ---------------------------------------------------------
 * LOAD ORDERS
 * ---------------------------------------------------------
 */

async function loadOrders() {

    if (!currentUser) {

        orders = [];

        displayOrders();

        return;
    }


    const userId =
        getCurrentUserId();


    if (!userId) {

        orders = [];

        displayOrders();

        return;
    }


    try {

        const data =
            await apiRequest(
                "/orders",
                {

                    method: "GET",

                    headers: {
                        "X-User-Id":
                            String(userId)
                    }
                }
            );


        orders =
            Array.isArray(data.orders)
                ? data.orders
                : [];


        displayOrders();

    }
    catch (error) {

        console.error(error);


        orders = [];


        displayOrders();


        alert(
            error.message ||
            "Unable to load orders."
        );
    }
}


/*
 * ---------------------------------------------------------
 * DISPLAY ORDERS
 * ---------------------------------------------------------
 */

function displayOrders() {

    const container =
        document.getElementById(
            "ordersContainer"
        );


    if (!container) {
        return;
    }


    if (!orders.length) {

        container.innerHTML = `
            <div class="order-card">
                <p>
                    No orders found.
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        orders
            .map(order => {

                return `
                    <div class="order-card">

                        <h3>
                            Order #${escapeHtml(
                                order.id
                            )}
                        </h3>

                        <p>
                            Total:
                            ${formatPrice(
                                order.total_amount
                            )}
                        </p>

                        <p>
                            Status:
                            ${escapeHtml(
                                order.status ||
                                "PENDING"
                            )}
                        </p>

                        <p>
                            Date:
                            ${escapeHtml(
                                order.order_date ||
                                order.created_at ||
                                ""
                            )}
                        </p>

                    </div>
                `;

            })
            .join("");
}


/*
 * ---------------------------------------------------------
 * PAGE INITIALIZATION
 * ---------------------------------------------------------
 */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateNavigation();


        /*
         * Search.
         */
        const searchInput =
            document.getElementById(
                "productSearch"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                filterProducts
            );
        }


        /*
         * Category filter.
         */
        const categoryFilter =
            document.getElementById(
                "categoryFilter"
            );


        if (categoryFilter) {

            categoryFilter.addEventListener(
                "change",
                filterProducts
            );
        }


        /*
         * Load products if already logged in.
         */
        if (currentUser) {

            loadProducts();
        }
    }
);