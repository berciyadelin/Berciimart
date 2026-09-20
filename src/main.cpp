#include <drogon/drogon.h>
#include "../include/database.h"

#include <argon2.h>
#include <cstdlib>
#include <iostream>
#include <string>

using namespace drogon;

// ------------------------------------------------------------
// Helper: get current user ID from HTTP header
// ------------------------------------------------------------

int getUserId(const HttpRequestPtr& req)
{
    std::string userId = req->getHeader("X-User-Id");

    if (userId.empty())
    {
        return -1;
    }

    try
    {
        return std::stoi(userId);
    }
    catch (...)
    {
        return -1;
    }
}

// ------------------------------------------------------------
// Helper: create JSON error response
// ------------------------------------------------------------

HttpResponsePtr jsonError(
    const std::string& message,
    HttpStatusCode status = k400BadRequest)
{
    Json::Value json;
    json["success"] = false;
    json["message"] = message;

    auto response = HttpResponse::newHttpJsonResponse(json);
    response->setStatusCode(status);

    return response;
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------

int main()
{
    // --------------------------------------------------------
    // Connect to PostgreSQL
    // --------------------------------------------------------

    if (!connectDatabase())
    {
        std::cerr << "Database connection failed.\n";
        return 1;
    }

    std::cout << "Database connected successfully!\n";

    // --------------------------------------------------------
    // Serve frontend
    // --------------------------------------------------------

    app().setDocumentRoot("./frontend");

    // --------------------------------------------------------
    // Use one Drogon worker thread.
    //
    // The current database.cpp uses a shared PostgreSQL
    // connection, so keeping one HTTP worker avoids concurrent
    // access to that connection.
    // --------------------------------------------------------

    app().setThreadNum(1);

    // ========================================================
    // GET /api/products
    // ========================================================

    app().registerHandler(
        "/api/products",
        [](const HttpRequestPtr& req,
           std::function<void(const HttpResponsePtr&)>&& callback)
        {
            (void)req;

            Json::Value products(Json::arrayValue);

            const char* query =
                "SELECT id, name, price, quantity, category_id "
                "FROM public.products "
                "ORDER BY id";

            PGresult* result = PQexec(conn, query);

            if (PQresultStatus(result) != PGRES_TUPLES_OK)
            {
                PQclear(result);
                callback(jsonError(
                    "Failed to load products.",
                    k500InternalServerError));
                return;
            }

            int rows = PQntuples(result);

            for (int i = 0; i < rows; ++i)
            {
                Json::Value product;

                product["id"] =
                    std::stoi(PQgetvalue(result, i, 0));

                product["name"] =
                    PQgetvalue(result, i, 1);

                product["price"] =
                    std::stod(PQgetvalue(result, i, 2));

                product["quantity"] =
                    std::stoi(PQgetvalue(result, i, 3));

                if (PQgetisnull(result, i, 4))
                {
                    product["category_id"] = Json::nullValue;
                }
                else
                {
                    product["category_id"] =
                        std::stoi(PQgetvalue(result, i, 4));
                }

                products.append(product);
            }

            PQclear(result);

            Json::Value responseJson;
            responseJson["success"] = true;
            responseJson["products"] = products;

            callback(
                HttpResponse::newHttpJsonResponse(responseJson));
        },
        {Get});

    // ========================================================
    // POST /api/register
    // ========================================================

    app().registerHandler(
        "/api/register",
        [](const HttpRequestPtr& req,
           std::function<void(const HttpResponsePtr&)>&& callback)
        {
            auto json = req->getJsonObject();

            if (!json)
            {
                callback(jsonError("Invalid JSON."));
                return;
            }

            std::string username =
                (*json)["username"].asString();

            std::string email =
                (*json)["email"].asString();

            std::string password =
                (*json)["password"].asString();

            if (username.empty() ||
                email.empty() ||
                password.empty())
            {
                callback(jsonError(
                    "Username, email and password are required."));
                return;
            }

            // ------------------------------------------------
            // Check whether username already exists
            // ------------------------------------------------

            const char* checkParams[] =
            {
                username.c_str()
            };

            PGresult* checkResult =
                PQexecParams(
                    conn,
                    "SELECT id FROM public.users "
                    "WHERE name = $1",
                    1,
                    nullptr,
                    checkParams,
                    nullptr,
                    nullptr,
                    0);

            if (PQresultStatus(checkResult) != PGRES_TUPLES_OK)
            {
                PQclear(checkResult);

                callback(jsonError(
                    "Failed to check username.",
                    k500InternalServerError));
                return;
            }

            if (PQntuples(checkResult) > 0)
            {
                PQclear(checkResult);

                callback(jsonError(
                    "Username already exists.",
                    k409Conflict));
                return;
            }

            PQclear(checkResult);

            // ------------------------------------------------
            // Hash password using Argon2id
            // ------------------------------------------------

            char encoded[256];

            int hashResult =
                argon2id_hash_encoded(
                    2,
                    65536,
                    1,
                    password.c_str(),
                    password.size(),
                    nullptr,
                    0,
                    32,
                    encoded,
                    sizeof(encoded));

            if (hashResult != ARGON2_OK)
            {
                callback(jsonError(
                    "Password hashing failed.",
                    k500InternalServerError));
                return;
            }

            const char* insertParams[] =
            {
                username.c_str(),
                email.c_str(),
                encoded
            };

            PGresult* insertResult =
                PQexecParams(
                    conn,
                    "INSERT INTO public.users "
                    "(name, email, password_hash, role) "
                    "VALUES ($1, $2, $3, 'BUYER') "
                    "RETURNING id",
                    3,
                    nullptr,
                    insertParams,
                    nullptr,
                    nullptr,
                    0);

            if (PQresultStatus(insertResult) != PGRES_TUPLES_OK)
            {
                std::string error =
                    PQresultErrorMessage(insertResult);

                PQclear(insertResult);

                callback(jsonError(
                    "Registration failed: " + error,
                    k500InternalServerError));
                return;
            }

            int userId =
                std::stoi(PQgetvalue(insertResult, 0, 0));

            PQclear(insertResult);

            Json::Value responseJson;
            responseJson["success"] = true;
            responseJson["message"] =
                "Registration successful.";
            responseJson["user_id"] = userId;
            responseJson["username"] = username;

            callback(
                HttpResponse::newHttpJsonResponse(responseJson));
        },
        {Post});

    // ========================================================
    // POST /api/login
    // ========================================================

    app().registerHandler(
        "/api/login",
        [](const HttpRequestPtr& req,
           std::function<void(const HttpResponsePtr&)>&& callback)
        {
            auto json = req->getJsonObject();

            if (!json)
            {
                callback(jsonError("Invalid JSON."));
                return;
            }

            std::string username =
                (*json)["username"].asString();

            std::string password =
                (*json)["password"].asString();

            if (username.empty() || password.empty())
            {
                callback(jsonError(
                    "Username and password are required."));
                return;
            }

            const char* params[] =
            {
                username.c_str()
            };

            PGresult* result =
                PQexecParams(
                    conn,
                    "SELECT id, password_hash "
                    "FROM public.users "
                    "WHERE name = $1",
                    1,
                    nullptr,
                    params,
                    nullptr,
                    nullptr,
                    0);

            if (PQresultStatus(result) != PGRES_TUPLES_OK)
            {
                PQclear(result);

                callback(jsonError(
                    "Login failed.",
                    k500InternalServerError));
                return;
            }

            if (PQntuples(result) == 0)
            {
                PQclear(result);

                callback(jsonError(
                    "Invalid username or password.",
                    k401Unauthorized));
                return;
            }

            int userId =
                std::stoi(PQgetvalue(result, 0, 0));

            std::string storedHash =
                PQgetvalue(result, 0, 1);

            PQclear(result);

            int verifyResult =
                argon2id_verify(
                    storedHash.c_str(),
                    password.c_str(),
                    password.size());

            if (verifyResult != ARGON2_OK)
            {
                callback(jsonError(
                    "Invalid username or password.",
                    k401Unauthorized));
                return;
            }

            Json::Value responseJson;
            responseJson["success"] = true;
            responseJson["message"] = "Login successful.";
            responseJson["user_id"] = userId;
            responseJson["username"] = username;

            callback(
                HttpResponse::newHttpJsonResponse(responseJson));
        },
        {Post});

    // ========================================================
    // GET /api/cart
    // ========================================================

    app().registerHandler(
        "/api/cart",
        [](const HttpRequestPtr& req,
           std::function<void(const HttpResponsePtr&)>&& callback)
        {
            int userId = getUserId(req);

            if (userId <= 0)
            {
                callback(jsonError(
                    "User authentication required.",
                    k401Unauthorized));
                return;
            }

            std::string userIdString =
                std::to_string(userId);

            const char* params[] =
            {
                userIdString.c_str()
            };

            PGresult* result =
                PQexecParams(
                    conn,
                    "SELECT c.product_id, "
                    "p.name, "
                    "p.price, "
                    "c.quantity "
                    "FROM public.cart c "
                    "JOIN public.products p "
                    "ON p.id = c.product_id "
                    "WHERE c.user_id = $1 "
                    "ORDER BY c.product_id",
                    1,
                    nullptr,
                    params,
                    nullptr,
                    nullptr,
                    0);

            if (PQresultStatus(result) != PGRES_TUPLES_OK)
            {
                PQclear(result);

                callback(jsonError(
                    "Failed to load cart.",
                    k500InternalServerError));
                return;
            }

            Json::Value items(Json::arrayValue);
            double total = 0.0;

            for (int i = 0; i < PQntuples(result); ++i)
            {
                int productId =
                    std::stoi(PQgetvalue(result, i, 0));

                std::string name =
                    PQgetvalue(result, i, 1);

                double price =
                    std::stod(PQgetvalue(result, i, 2));

                int quantity =
                    std::stoi(PQgetvalue(result, i, 3));

                double itemTotal =
                    price * quantity;

                total += itemTotal;

                Json::Value item;

                item["product_id"] = productId;
                item["name"] = name;
                item["price"] = price;
                item["quantity"] = quantity;
                item["subtotal"] = itemTotal;

                items.append(item);
            }

            PQclear(result);

            Json::Value responseJson;
            responseJson["success"] = true;
            responseJson["items"] = items;
            responseJson["total"] = total;

            callback(
                HttpResponse::newHttpJsonResponse(responseJson));
        },
        {Get});

    // ========================================================
    // POST /api/cart
    // ========================================================

    app().registerHandler(
        "/api/cart",
        [](const HttpRequestPtr& req,
           std::function<void(const HttpResponsePtr&)>&& callback)
        {
            auto json = req->getJsonObject();

            if (!json)
            {
                callback(jsonError("Invalid JSON."));
                return;
            }

            int userId = getUserId(req);

            if (userId <= 0 &&
                json->isMember("user_id"))
            {
                userId =
                    (*json)["user_id"].asInt();
            }

            if (userId <= 0)
            {
                callback(jsonError(
                    "User authentication required.",
                    k401Unauthorized));
                return;
            }

            if (!json->isMember("product_id") ||
                !json->isMember("quantity"))
            {
                callback(jsonError(
                    "product_id and quantity are required."));
                return;
            }

            int productId =
                (*json)["product_id"].asInt();

            int quantity =
                (*json)["quantity"].asInt();

            if (productId <= 0 || quantity <= 0)
            {
                callback(jsonError(
                    "Invalid product or quantity."));
                return;
            }

            std::string userIdString =
                std::to_string(userId);

            std::string productIdString =
                std::to_string(productId);

            std::string quantityString =
                std::to_string(quantity);

            const char* params[] =
            {
                userIdString.c_str(),
                productIdString.c_str(),
                quantityString.c_str()
            };

            PGresult* result =
                PQexecParams(
                    conn,
                    "INSERT INTO public.cart "
                    "(user_id, product_id, quantity) "
                    "VALUES ($1, $2, $3) "
                    "ON CONFLICT (user_id, product_id) "
                    "DO UPDATE SET quantity = "
                    "public.cart.quantity + EXCLUDED.quantity",
                    3,
                    nullptr,
                    params,
                    nullptr,
                    nullptr,
                    0);

            if (PQresultStatus(result) != PGRES_COMMAND_OK)
            {
                std::string error =
                    PQresultErrorMessage(result);

                PQclear(result);

                callback(jsonError(
                    "Failed to add product to cart: " + error,
                    k500InternalServerError));
                return;
            }

            PQclear(result);

            Json::Value responseJson;
            responseJson["success"] = true;
            responseJson["message"] =
                "Product added to cart.";

            callback(
                HttpResponse::newHttpJsonResponse(responseJson));
        },
        {Post});

    // ========================================================
    // POST /api/checkout
    // ========================================================

    app().registerHandler(
        "/api/checkout",
        [](const HttpRequestPtr& req,
           std::function<void(const HttpResponsePtr&)>&& callback)
        {
            int userId = getUserId(req);

            if (userId <= 0)
            {
                auto json = req->getJsonObject();

                if (json && json->isMember("user_id"))
                {
                    userId =
                        (*json)["user_id"].asInt();
                }
            }

            if (userId <= 0)
            {
                callback(jsonError(
                    "User authentication required.",
                    k401Unauthorized));
                return;
            }

            std::string userIdString =
                std::to_string(userId);

            const char* params[] =
            {
                userIdString.c_str()
            };

            // ------------------------------------------------
            // Load cart
            // ------------------------------------------------

            PGresult* cartResult =
                PQexecParams(
                    conn,
                    "SELECT c.product_id, "
                    "c.quantity, "
                    "p.price, "
                    "p.quantity "
                    "FROM public.cart c "
                    "JOIN public.products p "
                    "ON p.id = c.product_id "
                    "WHERE c.user_id = $1",
                    1,
                    nullptr,
                    params,
                    nullptr,
                    nullptr,
                    0);

            if (PQresultStatus(cartResult) != PGRES_TUPLES_OK)
            {
                PQclear(cartResult);

                callback(jsonError(
                    "Failed to load cart.",
                    k500InternalServerError));
                return;
            }

            int rowCount =
                PQntuples(cartResult);

            if (rowCount == 0)
            {
                PQclear(cartResult);

                callback(jsonError(
                    "Your cart is empty.",
                    k400BadRequest));
                return;
            }

            double total = 0.0;

            for (int i = 0; i < rowCount; ++i)
            {
                int requested =
                    std::stoi(PQgetvalue(cartResult, i, 1));

                int available =
                    std::stoi(PQgetvalue(cartResult, i, 3));

                if (requested > available)
                {
                    PQclear(cartResult);

                    callback(jsonError(
                        "One or more products do not have enough stock.",
                        k400BadRequest));
                    return;
                }

                double price =
                    std::stod(PQgetvalue(cartResult, i, 2));

                total += price * requested;
            }

            // ------------------------------------------------
            // Create order
            // ------------------------------------------------

            std::string totalString =
                std::to_string(total);

            const char* orderParams[] =
            {
                userIdString.c_str(),
                totalString.c_str()
            };

            PGresult* orderResult =
                PQexecParams(
                    conn,
                    "INSERT INTO public.orders "
                    "(user_id, total_amount, status) "
                    "VALUES ($1, $2, 'CONFIRMED') "
                    "RETURNING id",
                    2,
                    nullptr,
                    orderParams,
                    nullptr,
                    nullptr,
                    0);

            if (PQresultStatus(orderResult) != PGRES_TUPLES_OK)
            {
                std::string error =
                    PQresultErrorMessage(orderResult);

                PQclear(orderResult);
                PQclear(cartResult);

                callback(jsonError(
                    "Failed to create order: " + error,
                    k500InternalServerError));
                return;
            }

            int orderId =
                std::stoi(PQgetvalue(orderResult, 0, 0));

            PQclear(orderResult);

            // ------------------------------------------------
            // Create order items and update stock
            // ------------------------------------------------

            for (int i = 0; i < rowCount; ++i)
            {
                std::string productId =
                    PQgetvalue(cartResult, i, 0);

                std::string quantity =
                    PQgetvalue(cartResult, i, 1);

                std::string price =
                    PQgetvalue(cartResult, i, 2);

                std::string orderIdString =
                    std::to_string(orderId);

                const char* itemParams[] =
                {
                    orderIdString.c_str(),
                    productId.c_str(),
                    quantity.c_str(),
                    price.c_str()
                };

                PGresult* itemResult =
                    PQexecParams(
                        conn,
                        "INSERT INTO public.order_items "
                        "(order_id, product_id, quantity, price) "
                        "VALUES ($1, $2, $3, $4)",
                        4,
                        nullptr,
                        itemParams,
                        nullptr,
                        nullptr,
                        0);

                if (PQresultStatus(itemResult) != PGRES_COMMAND_OK)
                {
                    PQclear(itemResult);
                    PQclear(cartResult);

                    callback(jsonError(
                        "Failed to create order item.",
                        k500InternalServerError));
                    return;
                }

                PQclear(itemResult);

                const char* stockParams[] =
                {
                    quantity.c_str(),
                    productId.c_str()
                };

                PGresult* stockResult =
                    PQexecParams(
                        conn,
                        "UPDATE public.products "
                        "SET quantity = quantity - $1 "
                        "WHERE id = $2",
                        2,
                        nullptr,
                        stockParams,
                        nullptr,
                        nullptr,
                        0);

                if (PQresultStatus(stockResult) != PGRES_COMMAND_OK)
                {
                    PQclear(stockResult);
                    PQclear(cartResult);

                    callback(jsonError(
                        "Failed to update product stock.",
                        k500InternalServerError));
                    return;
                }

                PQclear(stockResult);
            }

            PQclear(cartResult);

            // ------------------------------------------------
            // Clear cart
            // ------------------------------------------------

            PGresult* clearResult =
                PQexecParams(
                    conn,
                    "DELETE FROM public.cart "
                    "WHERE user_id = $1",
                    1,
                    nullptr,
                    params,
                    nullptr,
                    nullptr,
                    0);

            if (PQresultStatus(clearResult) != PGRES_COMMAND_OK)
            {
                PQclear(clearResult);

                callback(jsonError(
                    "Order created but cart cleanup failed.",
                    k500InternalServerError));
                return;
            }

            PQclear(clearResult);

            Json::Value responseJson;
            responseJson["success"] = true;
            responseJson["message"] =
                "Order placed successfully.";
            responseJson["order_id"] = orderId;
            responseJson["total"] = total;

            callback(
                HttpResponse::newHttpJsonResponse(responseJson));
        },
        {Post});

    // ========================================================
    // GET /api/orders
    // ========================================================

    app().registerHandler(
        "/api/orders",
        [](const HttpRequestPtr& req,
           std::function<void(const HttpResponsePtr&)>&& callback)
        {
            int userId = getUserId(req);

            if (userId <= 0)
            {
                callback(jsonError(
                    "User authentication required.",
                    k401Unauthorized));
                return;
            }

            std::string userIdString =
                std::to_string(userId);

            const char* params[] =
            {
                userIdString.c_str()
            };

            PGresult* result =
                PQexecParams(
                    conn,
                    "SELECT id, total_amount, status, created_at "
                    "FROM public.orders "
                    "WHERE user_id = $1 "
                    "ORDER BY id DESC",
                    1,
                    nullptr,
                    params,
                    nullptr,
                    nullptr,
                    0);

            if (PQresultStatus(result) != PGRES_TUPLES_OK)
            {
                PQclear(result);

                callback(jsonError(
                    "Failed to load orders.",
                    k500InternalServerError));
                return;
            }

            Json::Value orders(Json::arrayValue);

            for (int i = 0; i < PQntuples(result); ++i)
            {
                Json::Value order;

                order["id"] =
                    std::stoi(PQgetvalue(result, i, 0));

                order["total"] =
                    std::stod(PQgetvalue(result, i, 1));

                order["status"] =
                    PQgetvalue(result, i, 2);

                order["created_at"] =
                    PQgetvalue(result, i, 3);

                orders.append(order);
            }

            PQclear(result);

            Json::Value responseJson;
            responseJson["success"] = true;
            responseJson["orders"] = orders;

            callback(
                HttpResponse::newHttpJsonResponse(responseJson));
        },
        {Get});

    // --------------------------------------------------------
    // Render port
    // --------------------------------------------------------

    const char* portEnvironment =
        std::getenv("PORT");

    int port = 8080;

    if (portEnvironment != nullptr)
    {
        try
        {
            port = std::stoi(portEnvironment);
        }
        catch (...)
        {
            port = 8080;
        }
    }

    std::cout
        << "BerciiMart HTTP server starting on port "
        << port
        << "...\n";

    // --------------------------------------------------------
    // Start HTTP server
    // --------------------------------------------------------

    app().addListener("0.0.0.0", port);

    app().run();

    closeDatabase();

    return 0;
}