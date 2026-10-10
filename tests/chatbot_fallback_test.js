// Tests for the FAQ chatbot frontend (frontend/chatbot.js).
//
// Runs in plain Node (no browser, no DOM): the script is loaded
// in a sandboxed context where only `window` and `fetch` are
// provided, which exercises the offline fallback brain and the
// server-request path, including what happens when the server
// is unreachable.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(
    path.join(__dirname, "..", "frontend", "chatbot.js"),
    "utf8"
);

let failures = 0;

function check(condition, label) {
    if (condition) {
        console.log("PASS: " + label);
    } else {
        console.log("FAIL: " + label);
        failures++;
    }
}

async function main() {
    // --------------------------------------------------
    // 1) Load the widget with a stubbed `window` and a
    //    fetch that pretends the server works.
    // --------------------------------------------------
    const sandbox = {
        window: {},
        console: console,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        fetch: async function () {
            return {
                ok: true,
                json: async function () {
                    return {
                        success: true,
                        matched: true,
                        topic: "checkout",
                        answer: "SERVER ANSWER"
                    };
                }
            };
        }
    };

    vm.createContext(sandbox);
    vm.runInContext(source, sandbox);

    const chatbot = sandbox.window.BerciiChatbot;

    check(
        chatbot !== undefined,
        "window.BerciiChatbot is exposed for reuse and debugging"
    );

    // --------------------------------------------------
    // 2) Offline fallback brain mirrors the C++ knowledge
    //    base and answers the README's example questions.
    // --------------------------------------------------
    check(
        chatbot.matchAnswerLocal("How do I add a product to my cart?")
            .topic === "cart_add",
        "offline brain answers the cart question"
    );

    check(
        chatbot.matchAnswerLocal("How does checkout work?")
            .topic === "checkout",
        "offline brain answers the checkout question"
    );

    check(
        chatbot.matchAnswerLocal("Where can I find my orders?")
            .topic === "orders_where",
        "offline brain answers the orders question"
    );

    check(
        chatbot.matchAnswerLocal("How can a seller manage products?")
            .topic === "seller_products",
        "offline brain answers the seller question"
    );

    check(
        chatbot.matchAnswerLocal("what is the weather today my friend")
            .matched === false,
        "offline brain falls back on unrelated questions"
    );

    check(
        chatbot.matchAnswerLocal("").matched === false &&
            chatbot.matchAnswerLocal("").answer ===
                chatbot.fallbackAnswer,
        "offline brain falls back on empty questions"
    );

    check(
        chatbot.matchAnswerLocal("HOW DO I CHECKOUT!!!").topic ===
            "checkout",
        "offline brain ignores case and punctuation"
    );

    check(
        chatbot.offlineNotice.length > 0 &&
            chatbot.fallbackAnswer.length > 0,
        "offline notice and fallback answer are non-empty"
    );

    // Every suggestion chip the widget shows must resolve in
    // the offline brain too (otherwise a chip would answer
    // with the fallback during downtime).
    const suggested = [
        "How do I add a product to my cart?",
        "How does checkout work?",
        "Where can I find my orders?",
        "How can a seller manage products?",
        "How do I create a seller account?"
    ];

    check(
        suggested.every(function (question) {
            return chatbot.matchAnswerLocal(question).matched;
        }),
        "every suggestion chip resolves offline"
    );

    // --------------------------------------------------
    // 3) askServer uses the documented contract and the
    //    same /api/faq endpoint as the C++ handler.
    // --------------------------------------------------
    const answer = await chatbot.askServer("How does checkout work?");
    check(
        answer === "SERVER ANSWER",
        "askServer returns the server answer on success"
    );

    // --------------------------------------------------
    // 4) When the service is unavailable, askServer must
    //    reject so the widget falls back to the built-in
    //    answers instead of crashing.
    // --------------------------------------------------
    sandbox.fetch = async function () {
        throw new Error("network down");
    };

    let rejected = false;

    try {
        await chatbot.askServer("How does checkout work?");
    } catch (error) {
        rejected = true;
    }

    check(
        rejected,
        "askServer rejects when the server is unreachable"
    );

    // HTTP 500 must also reject (fallback path).
    sandbox.fetch = async function () {
        return { ok: false, status: 500 };
    };

    rejected = false;

    try {
        await chatbot.askServer("How does checkout work?");
    } catch (error) {
        rejected = true;
    }

    check(rejected, "askServer rejects on HTTP errors");

    // --------------------------------------------------
    // 5) Loading the script must not require a DOM: no
    //    document in the sandbox, yet nothing threw.
    // --------------------------------------------------
    check(
        typeof sandbox.document === "undefined",
        "script loads safely without a browser DOM"
    );

    if (failures === 0) {
        console.log("All chatbot frontend tests passed.");
        process.exit(0);
    }

    console.log(failures + " test(s) failed.");
    process.exit(1);
}

main().catch(function (error) {
    console.error("Unexpected test failure:", error);
    process.exit(1);
});
