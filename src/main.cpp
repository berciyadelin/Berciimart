#include <drogon/drogon.h>
#include "../include/database.h"
#include <argon2.h>
#include <cstdlib>
#include <iostream>
#include <string>

using namespace drogon;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

int getUserId(const HttpRequestPtr& req)
{
    auto header = req->getHeader("X-User-Id");

    if (header.empty())
        return 0;

    try
    {
        return std::stoi(header);
    }
    catch (...)
    {
        return 0;
    }
}

HttpResponsePtr jsonError(
    const std::string& message,
    HttpStatusCode status = k400BadRequest)
{
    Json::Value body;

    body["success"] = false;
    body["error"] = message;

    auto response = HttpResponse::newHttpJsonResponse(body);
    response->setStatusCode(status);

    return response;
}

bool isValidUserId(int userId)
{
    return userId > 0;
}

// =====================================================
// MAIN
// =====================================================

int main()
{
    // Connect to PostgreSQL
    if (!connectDatabase())
    {
        std::cerr << "Database connection failed!" << std::endl;
        return 1;
    }

    std::cout << "Database connected successfully!" << std::endl;

    // Frontend folder
    app().setDocumentRoot("./frontend");

    // Use one thread
    app().setThreadNum(1);

    // =================================================
    // GET PRODUCTS
    // =================================================

    app().registerHandler(
        "/api/products",
        [](const HttpRequestPtr& req,
           std::function<void(const HttpResponsePtr&)>&& callback)
        {
            (void)req;

            PGresult* result = PQexec(
                conn,
                "SELECT id, name, price, quantity "
                "FROM public.product "
                "ORDER BY id"
            );

            if (PQresultStatus(result) != PGRES_TUPLES_OK)
            {
                std::string error = PQerrorMessage(conn);

                PQclear(result);

                callback(jsonError(
                    "Failed to load products: " + error,
                    k500InternalServerError
                ));

                return;
            }

            Json::Value response;

            response["success"] = true;
            response["products"] =
                Json::Value(Json::arrayValue);

            int rows = PQntuples(result);

            for (int i = 0; i < rows; i++)
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

                response["products"].append(product);
            }

            PQclear(result);

            callback(
                HttpResponse::newHttpJsonResponse(response)
            );
        },
        {Get}
    );

    // =================================================
    // REGISTER
    // =================================================

    app().registerHandler(
        "/api/register",
        [](const HttpRequestPtr& req,
           std::function<void(const HttpResponsePtr&)>&& callback)
        {
            auto json = req->getJsonObject();

            if (!json)
            {
                callback(jsonError("Invalid JSON"));
                return;
            }

            std::string username;

            if ((*json).isMember("username"))
            {
                username =
                    (*json)["username"].asString();
            }
            else if ((*json).isMember("name"))
            {
                username =
                    (*json)["name"].asString();
            }

            std::string email =
                (*json).get("email", "").asString();

            std::string password =
                (*json).get("password", "").asString();

            if (username.empty() ||
                email.empty() ||
                password.empty())
            {
                callback(jsonError(
                    "Username, email and password are required"
                ));

                return;
            }

            std::string role =
                (*json).get("role", "BUYER").asString();

            if (role != "BUYER" && role != "SELLER")
            {
                role = "BUYER";
            }

            // Check email
            const char* checkParams[1];

            checkParams[0] = email.c_str();

            PGresult* checkResult = PQexecParams(
                conn,
                "SELECT id FROM public.users "
                "WHERE email = $1 LIMIT 1",
                1,
                nullptr,
                checkParams,
                nullptr,
                nullptr,
                0
            );

            if (PQresultStatus(checkResult) != PGRES_TUPLES_OK)
            {
                std::string error = PQerrorMessage(conn);

                PQclear(checkResult);

                callback(jsonError(
                    "Database error: " + error,
                    k500InternalServerError
                ));

                return;
            }

            if (PQntuples(checkResult) > 0)
            {
                PQclear(checkResult);

                callback(jsonError(
                    "Email already registered",
                    k409Conflict
                ));

                return;
            }

            PQclear(checkResult);

            // Password hash
            char hash[256];

            int hashResult = argon2id_hash_encoded(
                3,
                65536,
                1,
                password.c_str(),
                password.length(),
                nullptr,
                0,
                32,
                hash,
                sizeof(hash)
            );

            if (hashResult != ARGON2_OK)
            {
                callback(jsonError(
                    "Password hashing failed",
                    k500InternalServerError
                ));

                return;
            }

            const char* params[4];

            params[0] = username.c_str();
            params[1] = email.c_str();
            params[2] = hash;
            params[3] = role.c_str();

            PGresult* result = PQexecParams(
                conn,
                "INSERT INTO public.users "
                "(name, email, password_hash, role) "
                "VALUES ($1, $2, $3, $4) "
                "RETURNING id",
                4,
                nullptr,
                params,
                nullptr,
                nullptr,
                0
            );

            if (PQresultStatus(result) != PGRES_TUPLES_OK)
            {
                std::string error = PQerrorMessage(conn);

                PQclear(result);

                callback(jsonError(
                    "Registration failed: " + error,
                    k500InternalServerError
                ));

                return;
            }

            int userId =
                std::stoi(PQgetvalue(result, 0, 0));

            PQclear(result);

            Json::Value response;

            response["success"] = true;
            response["message"] =
                "Registration successful";
            response["user_id"] = userId;

            callback(
                HttpResponse::newHttpJsonResponse(response)
            );
        },
        {Post}
    );

    // =================================================
    // LOGIN
    // =================================================

    app().registerHandler(
        "/api/login",
        [](const HttpRequestPtr& req,
           std::function<void(const HttpResponsePtr&)>&& callback)
        {
            auto json = req->getJsonObject();

            if (!json)
            {
                callback(jsonError("Invalid JSON"));
                return;
            }

            std::string username =
                (*json).get("username", "").asString();

            if (username.empty())
            {
                username =
                    (*json).get("email", "").asString();
            }

            std::string password =
                (*json).get("password", "").asString();

            if (username.empty() || password.empty())
            {
                callback(jsonError(
                    "Username/email and password are required"
                ));

                return;
            }

            const char* params[1];

            params[0] = username.c_str();

            PGresult* result = PQexecParams(
                conn,
                "SELECT id, name, email, password_hash, role "
                "FROM public.users "
                "WHERE name = $1 OR email = $1 "
                "LIMIT 1",
                1,
                nullptr,
                params,
                nullptr,
                nullptr,
                0
            );

            if (PQresultStatus(result) != PGRES_TUPLES_OK)
            {
                std::string error = PQerrorMessage(conn);

                PQclear(result);

                callback(jsonError(
                    "Login database error: " + error,
                    k500InternalServerError
                ));

                return;
            }

            if (PQntuples(result) == 0)
            {
                PQclear(result);

                callback(jsonError(
                    "Invalid username/email or password",
                    k401Unauthorized
                ));

                return;
            }

            int userId =
                std::stoi(PQgetvalue(result, 0, 0));

            std::string name =
                PQgetvalue(result, 0, 1);

            std::string email =
                PQgetvalue(result, 0, 2);

            std::string passwordHash =
                PQgetvalue(result, 0, 3);

            std::string role =
                PQgetvalue(result, 0, 4);

            int verifyResult = argon2id_verify(
                passwordHash.c_str(),
                password.c_str(),
                password.length()
            );

            if (verifyResult != ARGON2_OK)
            {
                PQclear(result);

                callback(jsonError(
                    "Invalid username/email or password",
                    k401Unauthorized
                ));

                return;
            }

            currentUserId = userId;

            PQclear(result);

            Json::Value response;

            response["success"] = true;
            response["message"] = "Login successful";
            response["user_id"] = userId;
            response["name"] = name;
            response["email"] = email;
            response["role"] = role;

            callback(
                HttpResponse::newHttpJsonResponse(response)
            );
        },
        {Post}
    );

    // =================================================
    // GET CART
    // =================================================

    app().registerHandler(
        "/api/cart",
        [](const HttpRequestPtr& req,
           std::function<void(const HttpResponsePtr&)>&& callback)
        {
            int userId = getUserId(req);

            if (!isValidUserId(userId))
            {
                callback(jsonError(
                    "Invalid user ID",
                    k401Unauthorized
                ));

                return;
            }

            std::string userIdString =
                std::to_string(userId);

            const char* params[1];

            params[0] = userIdString.c_str();

            PGresult* result = PQexecParams(
                conn,
                "SELECT c.id, c.product_id, "
                "p.name, p.price, c.quantity, "
                "(p.price * c.quantity) AS subtotal "
                "FROM public.cart c "
                "JOIN public.product p "
                "ON c.product_id = p.id "
                "WHERE c.user_id = $1 "
                "ORDER BY c.id",
                1,
                nullptr,
                params,
                nullptr,
                nullptr,
                0
            );

            if (PQresultStatus(result) != PGRES_TUPLES_OK)
            {
                std::string error = PQerrorMessage(conn);

                PQclear(result);

                callback(jsonError(
                    "Failed to load cart: " + error,
                    k500InternalServerError
                ));

                return;
            }

            Json::Value response;

            response["success"] = true;
            response["cart"] =
                Json::Value(Json::arrayValue);
            response["total"] = 0.0;

            int rows = PQntuples(result);

            for (int i = 0; i < rows; i++)
            {
                Json::Value item;

                item["id"] =
                    std::stoi(PQgetvalue(result, i, 0));

                item["product_id"] =
                    std::stoi(PQgetvalue(result, i, 1));

                item["name"] =
                    PQgetvalue(result, i, 2);

                item["price"] =
                    std::stod(PQgetvalue(result, i, 3));

                item["quantity"] =
                    std::stoi(PQgetvalue(result, i, 4));

                double subtotal =
                    std::stod(PQgetvalue(result, i, 5));

                item["subtotal"] = subtotal;

                response["total"] =
                    response["total"].asDouble()
                    + subtotal;

                response["cart"].append(item);
            }

            PQclear(result);

            callback(
                HttpResponse::newHttpJsonResponse(response)
            );
        },
        {Get}
    );

    // =================================================
    // ADD TO CART
    // =================================================

    app().registerHandler(
        "/api/cart",
        [](const HttpRequestPtr& req,
           std::function<void(const HttpResponsePtr&)>&& callback)
        {
            int userId = getUserId(req);

            auto json = req->getJsonObject();

            if (json && (*json).isMember("user_id"))
            {
                userId =
                    (*json)["user_id"].asInt();
            }

            if (!isValidUserId(userId))
            {
                callback(jsonError(
                    "Invalid user ID",
                    k401Unauthorized
                ));

                return;
            }

            if (!json)
            {
                callback(jsonError("Invalid JSON"));
                return;
            }

            int productId =
                (*json).get("product_id", 0).asInt();

            int quantity =
                (*json).get("quantity", 1).asInt();

            if (productId <= 0)
            {
                callback(jsonError(
                    "Invalid product ID"
                ));

                return;
            }

            if (quantity <= 0)
            {
                callback(jsonError(
                    "Quantity must be greater than 0"
                ));

                return;
            }

            std::string userIdString =
                std::to_string(userId);

            std::string productIdString =
                std::to_string(productId);

            std::string quantityString =
                std::to_string(quantity);

            const char* params[3];

            params[0] = userIdString.c_str();
            params[1] = productIdString.c_str();
            params[2] = quantityString.c_str();

            PGresult* result = PQexecParams(
                conn,
                "INSERT INTO public.cart "
                "(user_id, product_id, quantity) "
                "VALUES ($1, $2, $3) "
                "ON CONFLICT (user_id, product_id) "
                "DO UPDATE SET quantity = "
                "public.cart.quantity + EXCLUDED.quantity "
                "RETURNING id",
                3,
                nullptr,
                params,
                nullptr,
                nullptr,
                0
            );

            if (PQresultStatus(result) != PGRES_TUPLES_OK)
            {
                std::string error = PQerrorMessage(conn);

                PQclear(result);

                callback(jsonError(
                    "Failed to add to cart: " + error,
                    k500InternalServerError
                ));

                return;
            }

            int cartId =
                std::stoi(PQgetvalue(result, 0, 0));

            PQclear(result);

            Json::Value response;

            response["success"] = true;
            response["message"] =
                "Product added to cart";
            response["cart_id"] = cartId;

            callback(
                HttpResponse::newHttpJsonResponse(response)
            );
        },
        {Post}
    );

    // =================================================
    // CHECKOUT
    // =================================================

    app().registerHandler(
        "/api/checkout",
        [](const HttpRequestPtr& req,
           std::function<void(const HttpResponsePtr&)>&& callback)
        {
            int userId = getUserId(req);

            auto json = req->getJsonObject();

            if (json && (*json).isMember("user_id"))
            {
                userId =
                    (*json)["user_id"].asInt();
            }

            if (!isValidUserId(userId))
            {
                callback(jsonError(
                    "Invalid user ID",
                    k401Unauthorized
                ));

                return;
            }

            std::string userIdString =
                std::to_string(userId);

            const char* params[1];

            params[0] = userIdString.c_str();

            PGresult* cartResult = PQexecParams(
                conn,
                "SELECT c.product_id, "
                "c.quantity, "
                "p.price, "
                "p.quantity "
                "FROM public.cart c "
                "JOIN public.product p "
                "ON c.product_id = p.id "
                "WHERE c.user_id = $1",
                1,
                nullptr,
                params,
                nullptr,
                nullptr,
                0
            );

            if (PQresultStatus(cartResult) != PGRES_TUPLES_OK)
            {
                std::string error = PQerrorMessage(conn);

                PQclear(cartResult);

                callback(jsonError(
                    "Failed to read cart: " + error,
                    k500InternalServerError
                ));

                return;
            }

            int rows = PQntuples(cartResult);

            if (rows == 0)
            {
                PQclear(cartResult);

                callback(jsonError(
                    "Cart is empty"
                ));

                return;
            }

            double total = 0.0;

            for (int i = 0; i < rows; i++)
            {
                int cartQuantity =
                    std::stoi(PQgetvalue(cartResult, i, 1));

                double price =
                    std::stod(PQgetvalue(cartResult, i, 2));

                int stock =
                    std::stoi(PQgetvalue(cartResult, i, 3));

                if (cartQuantity > stock)
                {
                    PQclear(cartResult);

                    callback(jsonError(
                        "Insufficient stock"
                    ));

                    return;
                }

                total += price * cartQuantity;
            }

            // Begin transaction
            PGresult* beginResult =
                PQexec(conn, "BEGIN");

            if (PQresultStatus(beginResult) != PGRES_COMMAND_OK)
            {
                PQclear(beginResult);
                PQclear(cartResult);

                callback(jsonError(
                    "Could not start transaction",
                    k500InternalServerError
                ));

                return;
            }

            PQclear(beginResult);

            // Convert total to string
            std::string totalString =
                std::to_string(total);

            // IMPORTANT:
            // Build the query as std::string,
            // then use .c_str() in PQexecParams.
            std::string orderQuery =
                "INSERT INTO public.orders "
                "(user_id, total_amount, status, order_date) "
                "VALUES ($1, " +
                totalString +
                ", 'PLACED', CURRENT_TIMESTAMP) "
                "RETURNING id";

            PGresult* orderResult = PQexecParams(
                conn,
                orderQuery.c_str(),   // FIX
                1,
                nullptr,
                params,
                nullptr,
                nullptr,
                0
            );

            if (PQresultStatus(orderResult) != PGRES_TUPLES_OK)
            {
                std::string error = PQerrorMessage(conn);

                PQexec(conn, "ROLLBACK");

                PQclear(orderResult);
                PQclear(cartResult);

                callback(jsonError(
                    "Order creation failed: " + error,
                    k500InternalServerError
                ));

                return;
            }

            int orderId =
                std::stoi(PQgetvalue(orderResult, 0, 0));

            PQclear(orderResult);

            // Insert order items
            for (int i = 0; i < rows; i++)
            {
                int productId =
                    std::stoi(PQgetvalue(cartResult, i, 0));

                int quantity =
                    std::stoi(PQgetvalue(cartResult, i, 1));

                double price =
                    std::stod(PQgetvalue(cartResult, i, 2));

                std::string orderIdString =
                    std::to_string(orderId);

                std::string productIdString =
                    std::to_string(productId);

                std::string quantityString =
                    std::to_string(quantity);

                std::string priceString =
                    std::to_string(price);

                const char* itemParams[4];

                itemParams[0] =
                    orderIdString.c_str();

                itemParams[1] =
                    productIdString.c_str();

                itemParams[2] =
                    quantityString.c_str();

                itemParams[3] =
                    priceString.c_str();

                PGresult* itemResult = PQexecParams(
                    conn,
                    "INSERT INTO public.order_items "
                    "(order_id, product_id, quantity, price) "
                    "VALUES ($1, $2, $3, $4)",
                    4,
                    nullptr,
                    itemParams,
                    nullptr,
                    nullptr,
                    0
                );

                if (PQresultStatus(itemResult) != PGRES_COMMAND_OK)
                {
                    PQclear(itemResult);

                    PQexec(conn, "ROLLBACK");

                    PQclear(cartResult);

                    callback(jsonError(
                        "Failed to create order item",
                        k500InternalServerError
                    ));

                    return;
                }

                PQclear(itemResult);

                // Update stock
                const char* stockParams[2];

                stockParams[0] =
                    quantityString.c_str();

                stockParams[1] =
                    productIdString.c_str();

                PGresult* stockResult = PQexecParams(
                    conn,
                    "UPDATE public.product "
                    "SET quantity = quantity - $1 "
                    "WHERE id = $2",
                    2,
                    nullptr,
                    stockParams,
                    nullptr,
                    nullptr,
                    0
                );

                if (PQresultStatus(stockResult) != PGRES_COMMAND_OK)
                {
                    PQclear(stockResult);

                    PQexec(conn, "ROLLBACK");

                    PQclear(cartResult);

                    callback(jsonError(
                        "Failed to update stock",
                        k500InternalServerError
                    ));

                    return;
                }

                PQclear(stockResult);
            }

            PQclear(cartResult);

            // Clear cart
            PGresult* clearResult = PQexecParams(
                conn,
                "DELETE FROM public.cart "
                "WHERE user_id = $1",
                1,
                nullptr,
                params,
                nullptr,
                nullptr,
                0
            );

            if (PQresultStatus(clearResult) != PGRES_COMMAND_OK)
            {
                PQclear(clearResult);

                PQexec(conn, "ROLLBACK");

                callback(jsonError(
                    "Failed to clear cart",
                    k500InternalServerError
                ));

                return;
            }

            PQclear(clearResult);

            // Commit
            PGresult* commitResult =
                PQexec(conn, "COMMIT");

            if (PQresultStatus(commitResult) != PGRES_COMMAND_OK)
            {
                PQclear(commitResult);

                callback(jsonError(
                    "Checkout failed",
                    k500InternalServerError
                ));

                return;
            }

            PQclear(commitResult);

            Json::Value response;

            response["success"] = true;
            response["message"] =
                "Order placed successfully";
            response["order_id"] = orderId;
            response["total"] = total;

            callback(
                HttpResponse::newHttpJsonResponse(response)
            );
        },
        {Post}
    );

    // =================================================
    // GET ORDERS
    // =================================================

    app().registerHandler(
        "/api/orders",
        [](const HttpRequestPtr& req,
           std::function<void(const HttpResponsePtr&)>&& callback)
        {
            int userId = getUserId(req);

            if (!isValidUserId(userId))
            {
                callback(jsonError(
                    "Invalid user ID",
                    k401Unauthorized
                ));

                return;
            }

            std::string userIdString =
                std::to_string(userId);

            const char* params[1];

            params[0] = userIdString.c_str();

            PGresult* result = PQexecParams(
                conn,
                "SELECT id, total_amount, status, order_date "
                "FROM public.orders "
                "WHERE user_id = $1 "
                "ORDER BY id DESC",
                1,
                nullptr,
                params,
                nullptr,
                nullptr,
                0
            );

            if (PQresultStatus(result) != PGRES_TUPLES_OK)
            {
                std::string error = PQerrorMessage(conn);

                PQclear(result);

                callback(jsonError(
                    "Failed to load orders: " + error,
                    k500InternalServerError
                ));

                return;
            }

            Json::Value response;

            response["success"] = true;
            response["orders"] =
                Json::Value(Json::arrayValue);

            int rows = PQntuples(result);

            for (int i = 0; i < rows; i++)
            {
                Json::Value order;

                order["id"] =
                    std::stoi(PQgetvalue(result, i, 0));

                order["total_amount"] =
                    std::stod(PQgetvalue(result, i, 1));

                order["status"] =
                    PQgetvalue(result, i, 2);

                order["order_date"] =
                    PQgetvalue(result, i, 3);

                response["orders"].append(order);
            }

            PQclear(result);

            callback(
                HttpResponse::newHttpJsonResponse(response)
            );
        },
        {Get}
    );

    // =================================================
    // HEALTH CHECK
    // =================================================

    app().registerHandler(
        "/api/health",
        [](const HttpRequestPtr& req,
           std::function<void(const HttpResponsePtr&)>&& callback)
        {
            (void)req;

            Json::Value response;

            response["server"] = "UP";

            response["database"] =
                (conn != nullptr &&
                 PQstatus(conn) == CONNECTION_OK)
                ? "UP"
                : "DOWN";

            callback(
                HttpResponse::newHttpJsonResponse(response)
            );
        },
        {Get}
    );

    // =================================================
    // START SERVER
    // =================================================

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
        << "BerciiMart server starting on port "
        << port
        << "..."
        << std::endl;

    app().addListener("0.0.0.0", port);

    app().run();

    closeDatabase();

    return 0;
}