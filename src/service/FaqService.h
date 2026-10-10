#pragma once

// =====================================================
// FAQ CHATBOT SERVICE (pure C++, no drogon / libpq)
// =====================================================
//
// The FAQ chatbot is intentionally separate from every other
// feature of BerciiMart. This header contains the whole
// question-matching brain with no database or framework
// dependency, so:
//
//   * the /api/faq endpoint keeps answering even when the
//     database is down (README: "provide a fallback when its
//     service is unavailable"),
//   * the logic can be unit-tested with a plain C++ compiler
//     (see tests/faq_service_test.cpp), and
//   * frontend/chatbot.js mirrors the same topics for its
//     offline fallback.

#include <cstddef>
#include <string>
#include <utility>
#include <vector>

namespace faq
{

struct FaqMatch
{
    bool matched = false;
    std::string topic = "general";
    std::string answer;
};

struct FaqEntry
{
    std::string topic;
    std::vector<std::string> keywords;
    std::string question;
    std::string answer;
};

// The fallback shown when nothing matched. The chatbot never
// invents marketplace rules it does not know; it redirects the
// user to a human-readable next step instead.
inline std::string fallbackAnswer()
{
    return
        "I am not sure about that one yet. I can help with the "
        "shopping cart, checkout and mock payment, my orders, "
        "seller tools, accounts and login, and product reviews. "
        "You can also browse the Products page, or ask again "
        "using different words.";
}

// Shown when the /api/faq endpoint cannot be reached. The
// frontend keeps a copy of these answers so the chat still
// answers basic questions while the server is unavailable.
inline std::string offlineNotice()
{
    return
        "(Offline answer: the assistant service could not be "
        "reached, so this reply comes from the built-in FAQ.)";
}

// Knowledge base. Keep answers short, factual and limited to
// what BerciiMart actually does.
inline const std::vector<FaqEntry>& entries()
{
    static const std::vector<FaqEntry> table =
    {
        {
            "greeting",
            { "hi", "hello", "hey", "greetings", "salam", "merhaba" },
            "Hello",
            "Hello! I am the BerciiMart assistant. Ask me about "
            "the cart, checkout, orders, selling, your account "
            "or reviews."
        },
        {
            "cart_add",
            { "add", "cart", "basket", "put", "item" },
            "How do I add a product to my cart?",
            "Open the Products page, find the item you want and "
            "press Add to cart. The product must be in stock. It "
            "then appears in the Cart page with its quantity and "
            "total price."
        },
        {
            "cart_manage",
            { "cart", "quantity", "remove", "delete", "change", "update", "empty" },
            "How do I change quantities or remove items from my cart?",
            "On the Cart page you can increase or decrease the "
            "quantity of each line (it is limited by the stock "
            "that is available), or remove an item completely. "
            "The total updates automatically."
        },
        {
            "checkout",
            { "checkout", "pay", "payment", "purchase", "order", "card", "buy" },
            "How does checkout work?",
            "Press Checkout in your cart. A confirmation dialog "
            "asks for card details, but this is a mock payment "
            "for the demo: no real card is charged. Confirming "
            "creates the order, reduces stock and records the "
            "order in the database."
        },
        {
            "payment_issue",
            { "declined", "failed", "error", "stuck", "problem", "not working", "double charged" },
            "My payment or order failed. What should I do?",
            "The checkout uses a mock payment for this demo, so "
            "nothing is really charged. If the confirmation "
            "dialog rejects the form, check that the card field "
            "has 16 digits, the expiry is in MM/YY format and the "
            "CVC has 3 digits, then try again. Your cart is kept, "
            "so nothing is lost."
        },
        {
            "orders_where",
            { "orders", "order", "history", "where", "find", "past", "previous", "bought" },
            "Where can I find my orders?",
            "Use the My Orders button in the top menu. It lists "
            "every order you placed with its products, quantities, "
            "total amount and status."
        },
        {
            "orders_status",
            { "status", "track", "tracking", "shipped", "delivered", "pending", "processing" },
            "How can I track my order status?",
            "Each order in My Orders shows its status: PENDING, "
            "PAID, SHIPPED, DELIVERED or CANCELLED. This is a demo "
            "marketplace, so there is no real-world shipping; the "
            "status is stored in the database to show the full "
            "order flow."
        },
        {
            "seller_products",
            { "seller", "sell", "manage", "listing", "list", "inventory", "stock", "edit", "delete", "sale" },
            "How can a seller manage products?",
            "Register with a Seller account (or ask an "
            "administrator to promote you) and open the Seller "
            "button in the top menu. There you can add a product "
            "with name, description, price, stock, category and "
            "image, then edit or delete it later. The same panel "
            "shows the orders placed for your products so you can "
            "move them through PENDING, PAID, SHIPPED, DELIVERED "
            "or CANCELLED."
        },
        {
            "seller_register",
            { "seller", "account", "register", "sign up", "create", "become", "switch" },
            "How do I create a seller account?",
            "On the login screen press Create an account, fill in "
            "your name, email and a password of at least 8 "
            "characters, then choose Seller account before "
            "registering. Administrators cannot be registered "
            "publicly; they are promoted by an existing admin."
        },
        {
            "account_login",
            { "login", "log in", "signin", "sign in", "account", "register", "password", "email", "logout", "forgot" },
            "How do I register or log in?",
            "Create an account with your name, email and a "
            "password of at least 8 characters, then log in with "
            "the same email and password. Sessions last 24 hours; "
            "press Logout in the top menu to end yours earlier."
        },
        {
            "reviews",
            { "review", "reviews", "rating", "ratings", "stars", "star", "comment", "feedback" },
            "How do product reviews work?",
            "Verified buyers can review a product they actually "
            "bought: open a product, leave a star rating and a "
            "comment. Ratings are averaged and shown as stars on "
            "the product cards. You can delete your own review, "
            "and administrators can remove any review."
        },
        {
            "unavailable",
            { "unavailable", "not available", "broken", "not working", "cannot access", "out of stock", "empty page" },
            "What should I do if a feature is unavailable?",
            "Some features only appear for the right role: "
            "selling needs a Seller account and the dashboards "
            "need an administrator. If something you expect is "
            "missing, refresh the page and check that you are "
            "logged in. A product showing zero stock cannot be "
            "added to the cart, and if the whole site seems "
            "unavailable it may be temporary maintenance - your "
            "cart and orders are safe in the database."
        },
        {
            "help",
            { "help", "support", "contact", "human", "admin", "phone", "email" },
            "How do I get more help?",
            "I can answer most questions about the cart, "
            "checkout, orders, selling, accounts and reviews. For "
            "anything else, use the help widget on the site or "
            "contact the marketplace administrators."
        }
    };

    return table;
}

// Suggested starter questions shown as quick buttons in the
// chat panel.
inline std::vector<std::pair<std::string, std::string>>
suggestedQuestions()
{
    return
    {
        { "cart", "How do I add a product to my cart?" },
        { "checkout", "How does checkout work?" },
        { "orders", "Where can I find my orders?" },
        { "seller", "How can a seller manage products?" },
        { "account", "How do I create a seller account?" }
    };
}

// Lowercase, strip punctuation and collapse whitespace so
// "How do I add a PRODUCT to my cart?" matches "product".
inline std::string normalize(const std::string& text)
{
    std::string normalized;
    normalized.reserve(text.size());

    bool pendingSpace = false;

    for (unsigned char character : text)
    {
        bool isLetter =
            (character >= 'a' && character <= 'z') ||
            (character >= 'A' && character <= 'Z') ||
            (character >= '0' && character <= '9');

        if (isLetter)
        {
            if (pendingSpace && !normalized.empty())
                normalized.push_back(' ');

            pendingSpace = false;

            normalized.push_back(
                static_cast<char>(
                    character >= 'A' && character <= 'Z'
                        ? character - 'A' + 'a'
                        : character));
        }
        else
        {
            // Treat any non-alphanumeric run (spaces,
            // punctuation, apostrophes...) as one separator.
            pendingSpace = true;
        }
    }

    return normalized;
}

inline std::vector<std::string> tokenize(const std::string& text)
{
    std::vector<std::string> tokens;

    std::string current;

    for (char character : normalize(text))
    {
        if (character == ' ')
        {
            if (!current.empty())
                tokens.push_back(current);

            current.clear();
        }
        else
        {
            current.push_back(character);
        }
    }

    if (!current.empty())
        tokens.push_back(current);

    return tokens;
}

// Score one entry: every keyword that appears as a whole word in
// the question adds to the score. Longer (more specific)
// keywords weigh more, so one strong hit such as "checkout"
// beats two weak hits such as "add" + "put". Multi-word
// keywords ("sign up") must appear as a normalized phrase.
inline int scoreEntry(const FaqEntry& entry, const std::string& normalizedQuestion)
{
    int score = 0;

    const std::string paddedQuestion =
        " " + normalizedQuestion + " ";

    for (const std::string& keyword : entry.keywords)
    {
        const std::string keywordNormalized = normalize(keyword);

        if (keywordNormalized.empty())
            continue;

        // Word-boundary aware containment check.
        const std::string paddedKeyword =
            " " + keywordNormalized + " ";

        if (paddedQuestion.find(paddedKeyword) != std::string::npos)
        {
            const int weight =
                keywordNormalized.size() > 2
                    ? static_cast<int>(keywordNormalized.size())
                    : 2;

            score += weight;
        }
    }

    return score;
}

// Main entry point: pick the best-scoring FAQ topic, or report
// that nothing matched so callers can use the fallback answer.
inline FaqMatch answerQuestion(const std::string& question)
{
    const std::string normalizedQuestion = normalize(question);

    FaqMatch best;
    best.answer = fallbackAnswer();

    if (normalizedQuestion.empty())
        return best;

    // Every keyword hit counts (the smallest weight is 2), so a
    // score above 1 means at least one keyword matched. Ties go
    // to the first entry in the table, which is the more general
    // topic.
    const int minimumScore = 2;

    int bestScore = 0;

    for (const FaqEntry& entry : entries())
    {
        const int score = scoreEntry(entry, normalizedQuestion);

        if (score >= minimumScore && score > bestScore)
        {
            bestScore = score;
            best.matched = true;
            best.topic = entry.topic;
            best.answer = entry.answer;
        }
    }

    return best;
}

} // namespace faq
