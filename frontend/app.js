const API_URL = "/api";

let currentUser = null;


// ==============================
// SECTION MANAGEMENT
// ==============================

function showSection(section) {

    document.querySelectorAll(".section").forEach(element => {
        element.classList.remove("active");
    });

    const target = document.getElementById(section + "Section");

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

        const products =
            await response.json();

        if (!response.ok) {
            throw new Error("Unable to load products");
        }

        container.innerHTML = "";

        products.forEach(product => {

            const card =
                document.createElement("div");

            card.className =
                "product-card";

            card.innerHTML = `
                <h2>${product.name}</h2>

                <p>${product.description || ""}</p>

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
            `;

            container.appendChild(card);

        });

    } catch (error) {

        container.innerHTML =
            "<p>Unable to load products.</p>";

    }
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

        if (!response.ok) {
            throw new Error(
                "Unable to add product"
            );
        }

        alert("Product added to cart.");

    } catch (error) {

        alert(error.message);

    }
}


async function loadCart() {

    const container =
        document.getElementById("cartContainer");

    try {

        const response =
            await fetch(`${API_URL}/cart`);

        const cart =
            await response.json();

        if (!response.ok) {
            throw new Error("Unable to load cart");
        }

        container.innerHTML = "";

        let total = 0;

        cart.forEach(item => {

            total +=
                Number(item.price) *
                Number(item.quantity);

            const element =
                document.createElement("div");

            element.className =
                "cart-item";

            element.innerHTML = `
                <h3>${item.name}</h3>

                <p>
                    Quantity: ${item.quantity}
                </p>

                <p>
                    ₹${(
                        Number(item.price) *
                        Number(item.quantity)
                    ).toFixed(2)}
                </p>
            `;

            container.appendChild(element);

        });

        document.getElementById(
            "cartTotal"
        ).textContent =
            total.toFixed(2);

    } catch (error) {

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
                data.message || "Checkout failed"
            );
        }

        alert(
            `Order placed successfully. Order ID: ${data.order_id}`
        );

        loadCart();

    } catch (error) {

        alert(error.message);

    }
}


// ==============================
// ORDERS
// ==============================

async function loadOrders() {

    const container =
        document.getElementById("ordersContainer");

    try {

        const response =
            await fetch(`${API_URL}/orders`);

        const orders =
            await response.json();

        if (!response.ok) {
            throw new Error("Unable to load orders");
        }

        container.innerHTML = "";

        orders.forEach(order => {

            const element =
                document.createElement("div");

            element.className =
                "order-card";

            element.innerHTML = `
                <h3>
                    Order #${order.id}
                </h3>

                <p>
                    Total:
                    ₹${Number(order.total_amount).toFixed(2)}
                </p>

                <p>
                    Status: ${order.status}
                </p>
            `;

            container.appendChild(element);

        });

    } catch (error) {

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
    localStorage.getItem("berciimart_user");

if (savedUser) {

    currentUser =
        JSON.parse(savedUser);

    showSection("products");

} else {

    showLogin();

}