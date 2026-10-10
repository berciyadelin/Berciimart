// Unit tests for the FAQ chatbot brain (src/service/FaqService.h).
// Pure C++ and dependency-free, so CI (ctest) runs it on every
// platform without a database or drogon install.

#include "../src/service/FaqService.h"

#include <iostream>
#include <string>

static int failures = 0;

void expectTopic(
    const std::string& question,
    const std::string& expectedTopic)
{
    const faq::FaqMatch match = faq::answerQuestion(question);

    if (!match.matched || match.topic != expectedTopic)
    {
        std::cout << "FAIL: \"" << question
                  << "\" -> topic \"" << match.topic
                  << "\" (matched=" << match.matched
                  << "), expected \"" << expectedTopic << "\""
                  << std::endl;

        failures++;
    }
    else
    {
        std::cout << "PASS: \"" << question
                  << "\" -> " << match.topic << std::endl;
    }
}

void expectFallback(const std::string& question)
{
    const faq::FaqMatch match = faq::answerQuestion(question);

    if (match.matched)
    {
        std::cout << "FAIL: \"" << question
                  << "\" matched topic \"" << match.topic
                  << "\", expected the fallback answer"
                  << std::endl;

        failures++;
    }
    else if (match.answer != faq::fallbackAnswer())
    {
        std::cout << "FAIL: \"" << question
                  << "\" did not return the fallback answer text"
                  << std::endl;

        failures++;
    }
    else
    {
        std::cout << "PASS: \"" << question
                  << "\" -> fallback" << std::endl;
    }
}

int main()
{
    // The exact questions the README lists for the chatbot.
    expectTopic(
        "How do I add a product to my cart?",
        "cart_add");

    expectTopic(
        "How does checkout work?",
        "checkout");

    expectTopic(
        "Where can I find my orders?",
        "orders_where");

    expectTopic(
        "How can a seller manage products?",
        "seller_products");

    expectTopic(
        "What should I do if a feature is unavailable?",
        "unavailable");

    // Case, punctuation and phrasing tolerance.
    expectTopic(
        "HOW DO I ADD AN ITEM TO MY CART?",
        "cart_add");

    expectTopic(
        "i want to pay for my things",
        "checkout");

    expectTopic(
        "show my previous orders history",
        "orders_where");

    expectTopic(
        "my package was never delivered, where is my tracking?",
        "orders_status");

    expectTopic(
        "i want to list my products for sale",
        "seller_products");

    expectTopic(
        "how do I become a seller?",
        "seller_register");

    expectTopic(
        "how do I manage the stock of my listings as a seller?",
        "seller_products");

    expectTopic(
        "how to sign up as a seller account",
        "seller_register");

    expectTopic(
        "i forgot my password and cannot log in",
        "account_login");

    expectTopic(
        "leave a review and star rating",
        "reviews");

    expectTopic("hi there", "greeting");

    expectTopic("I need to change the quantity in my basket", "cart_manage");

    expectTopic("can I talk to a human supporter", "help");

    // Empty and nonsense input must fall back, never invent.
    expectFallback("");
    expectFallback("   ");
    expectFallback("quantum blockchain zebra banana");

    // Fallback/notice text must stay non-empty.
    if (faq::fallbackAnswer().empty() || faq::offlineNotice().empty())
    {
        std::cout << "FAIL: fallback answer or offline notice is empty"
                  << std::endl;

        failures++;
    }

    // Suggested questions must all resolve to a real answer.
    for (const auto& suggestion : faq::suggestedQuestions())
    {
        const faq::FaqMatch match =
            faq::answerQuestion(suggestion.second);

        if (!match.matched)
        {
            std::cout << "FAIL: suggested question \""
                      << suggestion.second
                      << "\" has no matching topic" << std::endl;

            failures++;
        }
    }

    if (failures == 0)
    {
        std::cout << "All FaqService tests passed." << std::endl;
        return 0;
    }

    std::cout << failures << " test(s) failed." << std::endl;
    return 1;
}
