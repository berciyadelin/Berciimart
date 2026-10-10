// =====================================================
// BerciiMart FAQ chatbot (standalone widget)
// =====================================================
//
// This file is deliberately self-contained:
//
//   * it creates its own DOM (no markup changes to existing
//     sections are required),
//   * every CSS selector is prefixed with #bercii-chat so it
//     cannot restyle the rest of the site, and
//   * it shares no variables with app.js, so the existing help
//     widget and every other feature keep working unchanged.
//
// It asks the server first (POST /api/faq, answered by the C++
// knowledge base in src/service/FaqService.h) and falls back to
// a built-in copy of the same answers when the server cannot be
// reached, so the chat keeps working during downtime.

(function () {
    "use strict";

    const API_URL = "/api";
    const REQUEST_TIMEOUT_MS = 4000;

    const OFFLINE_NOTICE =
        "(Offline answer: the assistant service could not be " +
        "reached, so this reply comes from the built-in FAQ.)";

    const FALLBACK_ANSWER =
        "I am not sure about that one yet. I can help with the " +
        "shopping cart, checkout and mock payment, my orders, " +
        "seller tools, accounts and login, and product reviews. " +
        "You can also browse the Products page, or ask again " +
        "using different words.";

    // Built-in copy of the server knowledge base. It is only
    // used when /api/faq is unreachable.
    const LOCAL_FAQ = [
        {
            topic: "greeting",
            keywords: ["hi", "hello", "hey", "greetings"],
            answer:
                "Hello! I am the BerciiMart assistant. Ask me " +
                "about the cart, checkout, orders, selling, your " +
                "account or reviews."
        },
        {
            topic: "cart_add",
            keywords: ["add", "cart", "basket", "put", "item"],
            answer:
                "Open the Products page, find the item you want " +
                "and press Add to cart. The product must be in " +
                "stock. It then appears in the Cart page with " +
                "its quantity and total price."
        },
        {
            topic: "cart_manage",
            keywords: ["cart", "quantity", "remove", "delete", "change", "update", "empty"],
            answer:
                "On the Cart page you can increase or decrease " +
                "the quantity of each line (limited by available " +
                "stock), or remove an item completely. The total " +
                "updates automatically."
        },
        {
            topic: "checkout",
            keywords: ["checkout", "pay", "payment", "purchase", "order", "card", "buy"],
            answer:
                "Press Checkout in your cart. A confirmation " +
                "dialog asks for card details, but this is a mock " +
                "payment for the demo: no real card is charged. " +
                "Confirming creates the order, reduces stock and " +
                "records the order in the database."
        },
        {
            topic: "payment_issue",
            keywords: ["declined", "failed", "error", "stuck", "problem", "not working", "double charged"],
            answer:
                "The checkout uses a mock payment for this demo, " +
                "so nothing is really charged. If the confirmation " +
                "dialog rejects the form, check that the card field " +
                "has 16 digits, the expiry is MM/YY and the CVC has " +
                "3 digits, then try again. Your cart is kept."
        },
        {
            topic: "orders_where",
            keywords: ["orders", "order", "history", "where", "find", "past", "previous", "bought"],
            answer:
                "Use the My Orders button in the top menu. It " +
                "lists every order you placed with its products, " +
                "quantities, total amount and status."
        },
        {
            topic: "orders_status",
            keywords: ["status", "track", "tracking", "shipped", "delivered", "pending", "processing"],
            answer:
                "Each order in My Orders shows its status: " +
                "PENDING, PAID, SHIPPED, DELIVERED or CANCELLED. " +
                "This is a demo marketplace, so there is no " +
                "real-world shipping; the status lives in the " +
                "database to show the full order flow."
        },
        {
            topic: "seller_products",
            keywords: ["seller", "sell", "manage", "listing", "list", "inventory", "stock", "edit", "delete", "sale"],
            answer:
                "Register with a Seller account (or ask an " +
                "administrator to promote you) and open the Seller " +
                "button in the top menu. There you can add a " +
                "product with name, description, price, stock, " +
                "category and image, then edit or delete it later. " +
                "The same panel shows the orders placed for your " +
                "products."
        },
        {
            topic: "seller_register",
            keywords: ["seller", "account", "register", "sign up", "create", "become", "switch"],
            answer:
                "On the login screen press Create an account, " +
                "fill in your name, email and a password of at " +
                "least 8 characters, then choose Seller account " +
                "before registering. Administrators cannot be " +
                "registered publicly."
        },
        {
            topic: "account_login",
            keywords: ["login", "log in", "signin", "sign in", "account", "register", "password", "email", "logout", "forgot"],
            answer:
                "Create an account with your name, email and a " +
                "password of at least 8 characters, then log in " +
                "with the same email and password. Sessions last " +
                "24 hours; press Logout in the top menu to end " +
                "yours earlier."
        },
        {
            topic: "reviews",
            keywords: ["review", "reviews", "rating", "ratings", "stars", "star", "comment", "feedback"],
            answer:
                "Verified buyers can review a product they " +
                "actually bought: open a product, leave a star " +
                "rating and a comment. Ratings are averaged and " +
                "shown as stars on the product cards."
        },
        {
            topic: "help",
            keywords: ["help", "support", "contact", "human", "admin", "phone"],
            answer:
                "I can answer most questions about the cart, " +
                "checkout, orders, selling, accounts and reviews. " +
                "For anything else, use the help widget on the " +
                "site or contact the marketplace administrators."
        },
        {
            topic: "unavailable",
            keywords: ["unavailable", "not available", "broken", "not working", "cannot access", "out of stock"],
            answer:
                "Some features only appear for the right role: " +
                "selling needs a Seller account and the dashboards " +
                "need an administrator. A product showing zero " +
                "stock cannot be added to the cart, and if the " +
                "whole site seems unavailable it may be temporary " +
                "maintenance - your cart and orders are safe."
        }
    ];

    const SUGGESTIONS = [
        "How do I add a product to my cart?",
        "How does checkout work?",
        "Where can I find my orders?",
        "How can a seller manage products?",
        "How do I create a seller account?"
    ];

    // Same normalization rules as the C++ FaqService so the
    // offline fallback behaves like the server.
    function normalize(text) {
        return String(text || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
    }

    // Offline brain: pick the best-scoring topic, otherwise the
    // fallback answer. Longer keywords weigh more, matching the
    // server implementation.
    function matchAnswerLocal(question) {
        const normalizedQuestion = normalize(question);

        if (!normalizedQuestion) {
            return {
                matched: false,
                topic: "general",
                answer: FALLBACK_ANSWER
            };
        }

        let best = {
            matched: false,
            topic: "general",
            answer: FALLBACK_ANSWER
        };
        let bestScore = 0;

        LOCAL_FAQ.forEach(function (entry) {
            let score = 0;

            entry.keywords.forEach(function (keyword) {
                const paddedKeyword = " " + normalize(keyword) + " ";
                const paddedQuestion = " " + normalizedQuestion + " ";

                if (paddedQuestion.indexOf(paddedKeyword) !== -1) {
                    score += Math.max(2, normalize(keyword).length);
                }
            });

            if (score >= 2 && score > bestScore) {
                bestScore = score;
                best = {
                    matched: true,
                    topic: entry.topic,
                    answer: entry.answer
                };
            }
        });

        return best;
    }

    // Ask the C++ backend; throws on network error/timeout so
    // the caller can fall back to the built-in answers.
    async function askServer(question) {
        const controller =
            typeof AbortController !== "undefined"
                ? new AbortController()
                : null;

        const timer = controller
            ? setTimeout(function () {
                controller.abort();
            }, REQUEST_TIMEOUT_MS)
            : null;

        try {
            const response = await fetch(`${API_URL}/faq`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: question }),
                signal: controller ? controller.signal : undefined
            });

            if (!response.ok) {
                throw new Error("FAQ service returned " + response.status);
            }

            const data = await response.json();

            if (!data || data.success !== true || !data.answer) {
                throw new Error("FAQ service returned an invalid body");
            }

            return data.answer;
        } finally {
            if (timer !== null) {
                clearTimeout(timer);
            }
        }
    }

    // Exposed for tests and for anyone debugging the widget.
    if (typeof window !== "undefined") {
        window.BerciiChatbot = {
            normalize: normalize,
            matchAnswerLocal: matchAnswerLocal,
            askServer: askServer,
            offlineNotice: OFFLINE_NOTICE,
            fallbackAnswer: FALLBACK_ANSWER
        };
    }

    // =====================================================
    // WIDGET UI
    // =====================================================

    if (typeof document === "undefined") {
        // Running in a test runner (node), not a browser.
        return;
    }

    function createWidget() {
        // Never build a second panel if something already
        // included this script twice.
        if (document.getElementById("bercii-chat-launcher")) {
            return;
        }

        const launcher = document.createElement("button");
        launcher.id = "bercii-chat-launcher";
        launcher.type = "button";
        launcher.setAttribute(
            "aria-label",
            "Open the BerciiMart FAQ assistant"
        );
        launcher.innerHTML =
            '<span class="bercii-chat-launcher-icon" ' +
            'aria-hidden="true">&#128172;</span>' +
            '<span class="bercii-chat-launcher-label">' +
            "Help</span>";

        const panel = document.createElement("div");
        panel.id = "bercii-chat-panel";
        panel.hidden = true;
        panel.innerHTML =
            '<div id="bercii-chat-header">' +
            '<span id="bercii-chat-title">BerciiMart Assistant</span>' +
            '<button type="button" id="bercii-chat-close" ' +
            'aria-label="Close the assistant">&times;</button>' +
            "</div>" +
            '<div id="bercii-chat-messages" ' +
            'role="log" aria-live="polite"></div>' +
            '<div id="bercii-chat-suggestions"></div>' +
            '<form id="bercii-chat-form">' +
            '<input type="text" id="bercii-chat-input" ' +
            'placeholder="Ask about cart, orders, selling..." ' +
            'autocomplete="off" maxlength="300" required>' +
            '<button type="submit" id="bercii-chat-send">' +
            "Send</button>" +
            "</form>";

        document.body.appendChild(launcher);
        document.body.appendChild(panel);

        wireWidget(launcher, panel);
    }

    function wireWidget(launcher, panel) {
        const messages =
            document.getElementById("bercii-chat-messages");
        const form =
            document.getElementById("bercii-chat-form");
        const input =
            document.getElementById("bercii-chat-input");
        const close =
            document.getElementById("bercii-chat-close");
        const suggestions =
            document.getElementById("bercii-chat-suggestions");

        function openPanel() {
            panel.hidden = false;
            launcher.setAttribute("aria-expanded", "true");

            if (messages.children.length === 0) {
                addBotMessage(
                    "Hi! I am the BerciiMart assistant. " +
                    "I can help with the cart, checkout, " +
                    "orders, selling, your account and " +
                    "reviews. What would you like to know?"
                );

                SUGGESTIONS.forEach(function (question) {
                    const chip = document.createElement("button");
                    chip.type = "button";
                    chip.className = "bercii-chat-chip";
                    chip.textContent = question;
                    chip.addEventListener("click", function () {
                        submitQuestion(question);
                    });
                    suggestions.appendChild(chip);
                });
            }

            input.focus();
        }

        function closePanel() {
            panel.hidden = true;
            launcher.setAttribute("aria-expanded", "false");
        }

        function addMessage(text, sender, isNotice) {
            const bubble = document.createElement("div");
            bubble.className =
                "bercii-chat-message bercii-chat-" + sender;

            const paragraph = document.createElement("p");
            paragraph.textContent = text;

            if (isNotice) {
                paragraph.className = "bercii-chat-notice";
            }

            bubble.appendChild(paragraph);
            messages.appendChild(bubble);
            messages.scrollTop = messages.scrollHeight;

            return bubble;
        }

        function addBotMessage(text) {
            return addMessage(text, "bot", false);
        }

        async function submitQuestion(question) {
            const cleaned = normalize(question);

            if (!cleaned) {
                return;
            }

            addMessage(question, "user", false);
            input.value = "";

            const thinking = addBotMessage("...");
            thinking.classList.add("bercii-chat-typing");

            try {
                const answer = await askServer(question);

                thinking.classList.remove("bercii-chat-typing");
                thinking.querySelector("p").textContent = answer;
            } catch (error) {
                // Service unavailable: answer from the
                // built-in FAQ and say so honestly.
                console.warn(
                    "FAQ service unavailable, using built-in answers:",
                    error
                );

                const local = matchAnswerLocal(question);

                thinking.classList.remove("bercii-chat-typing");
                thinking.querySelector("p").textContent =
                    local.answer;

                addMessage(OFFLINE_NOTICE, "bot", true);
            }
        }

        launcher.setAttribute("aria-expanded", "false");
        launcher.addEventListener("click", function () {
            if (panel.hidden) {
                openPanel();
            } else {
                closePanel();
            }
        });

        close.addEventListener("click", closePanel);

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            submitQuestion(input.value);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createWidget);
    } else {
        createWidget();
    }
})();
