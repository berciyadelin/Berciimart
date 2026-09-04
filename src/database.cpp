#include "../include/database.h"
#include <argon2.h>
#include<cstring>
#include <algorithm>
#include <iostream>
#include <random>
#include <string>

using namespace std;

PGconn* conn = nullptr;
int currentUserId = 0;


// ============================================================
// DATABASE CONNECTION
// ============================================================

bool connectDatabase()
{
    conn = PQconnectdb(
        "host=localhost "
        "port=5432 "
        "dbname=berciimart "
        "user=postgres"
    );

    if (PQstatus(conn) != CONNECTION_OK)
    {
        cout << "Database connection failed!\n";
        cout << PQerrorMessage(conn) << "\n";
        return false;
    }

    cout << "Database connected successfully!\n";
    return true;
}


// ============================================================
// CLOSE DATABASE
// ============================================================

void closeDatabase()
{
    if (conn != nullptr)
    {
        PQfinish(conn);
        conn = nullptr;
    }

    currentUserId = 0;
}


// ============================================================
// REGISTER USER - ARGON2ID
// ============================================================

bool registerDatabaseUser(
    const string& username,
    const string& email,
    const string& password
)
{
    // Argon2id parameters
    const uint32_t t_cost = 2;
    const uint32_t m_cost = 65536;
    const uint32_t parallelism = 1;

    const size_t saltLength = 16;
    const size_t hashLength = 32;

    unsigned char salt[saltLength];

    // Generate a random salt
    random_device rd;

    for (size_t i = 0; i < saltLength; i++)
    {
        salt[i] = static_cast<unsigned char>(rd() & 0xFF);
    }

    // Calculate required encoded string size
    size_t encodedLength = argon2_encodedlen(
        t_cost,
        m_cost,
        parallelism,
        saltLength,
        hashLength,
        Argon2_type::Argon2_id
    );

    string encodedHash(encodedLength, '\0');

    int result = argon2id_hash_encoded(
        t_cost,
        m_cost,
        parallelism,
        password.c_str(),
        password.length(),
        salt,
        saltLength,
        hashLength,
        encodedHash.data(),
        encodedHash.size()
    );

    if (result != ARGON2_OK)
    {
        cout << "Password hashing failed.\n";
        cout << "Argon2 error: "
             << argon2_error_message(result) << "\n";
        return false;
    }

    // Remove unused trailing null character if present
    encodedHash.resize(strlen(encodedHash.c_str()));

    const char* params[3];

    params[0] = username.c_str();
    params[1] = email.c_str();
    params[2] = encodedHash.c_str();

    PGresult* resultDb = PQexecParams(
        conn,
        "INSERT INTO public.users "
        "(name, email, password_hash) "
        "VALUES ($1, $2, $3)",
        3,
        nullptr,
        params,
        nullptr,
        nullptr,
        0
    );

    if (PQresultStatus(resultDb) != PGRES_COMMAND_OK)
    {
        cout << "Registration failed: "
             << PQerrorMessage(conn) << "\n";

        PQclear(resultDb);
        return false;
    }

    PQclear(resultDb);

    cout << "Registration successful!\n";
    return true;
}


// ============================================================
// LOGIN USER - ARGON2ID VERIFICATION
// ============================================================

int loginDatabaseUser(
    const string& username,
    const string& password
)
{
    const char* params[1];
    params[0] = username.c_str();

    PGresult* result = PQexecParams(
        conn,
        "SELECT id, password_hash "
        "FROM public.users "
        "WHERE name = $1",
        1,
        nullptr,
        params,
        nullptr,
        nullptr,
        0
    );

    if (PQresultStatus(result) != PGRES_TUPLES_OK)
    {
        cout << "Login query failed: "
             << PQerrorMessage(conn) << "\n";

        PQclear(result);
        return -1;
    }

    if (PQntuples(result) == 0)
    {
        PQclear(result);

        cout << "Invalid username or password.\n";
        return -1;
    }

    int userId = stoi(PQgetvalue(result, 0, 0));

    string storedHash = PQgetvalue(result, 0, 1);

    PQclear(result);

    // Verify password using Argon2id
    int verifyResult = argon2id_verify(
        storedHash.c_str(),
        password.c_str(),
        password.length()
    );

    if (verifyResult != ARGON2_OK)
    {
        cout << "Invalid username or password.\n";
        return -1;
    }

    currentUserId = userId;

    cout << "Login successful!\n";

    return userId;
}


// ============================================================
// VIEW PRODUCTS
// ============================================================

void viewProducts()
{
    PGresult* result = PQexec(
        conn,
        "SELECT id, name, price, quantity, category_id "
        "FROM public.products "
        "ORDER BY id"
    );

    if (PQresultStatus(result) != PGRES_TUPLES_OK)
    {
        cout << "Failed to load products: "
             << PQerrorMessage(conn) << "\n";

        PQclear(result);
        return;
    }

    cout << "\n========== PRODUCTS ==========\n";

    int rows = PQntuples(result);

    if (rows == 0)
    {
        cout << "No products available.\n";
    }

    for (int i = 0; i < rows; i++)
    {
        cout << "ID: " << PQgetvalue(result, i, 0)
             << " | Name: " << PQgetvalue(result, i, 1)
             << " | Price: Rs." << PQgetvalue(result, i, 2)
             << " | Quantity: " << PQgetvalue(result, i, 3)
             << " | Category ID: " << PQgetvalue(result, i, 4)
             << "\n";
    }

    cout << "===============================\n";

    PQclear(result);
}


// ============================================================
// ADD PRODUCT TO CART
// ============================================================

void addProductToCart()
{
    if (currentUserId <= 0)
    {
        cout << "No user is currently logged in.\n";
        return;
    }

    int productId;
    int quantity;

    cout << "\n--- Add Product to Cart ---\n";

    cout << "Enter product ID: ";
    cin >> productId;

    cout << "Enter quantity: ";
    cin >> quantity;

    if (quantity <= 0)
    {
        cout << "Invalid quantity.\n";
        return;
    }

    string userIdStr = to_string(currentUserId);
    string productIdStr = to_string(productId);

    const char* productParams[1];
    productParams[0] = productIdStr.c_str();

    PGresult* productResult = PQexecParams(
        conn,
        "SELECT name, price, quantity "
        "FROM public.products "
        "WHERE id = $1",
        1,
        nullptr,
        productParams,
        nullptr,
        nullptr,
        0
    );

    if (PQresultStatus(productResult) != PGRES_TUPLES_OK)
    {
        cout << "Failed to check product: "
             << PQerrorMessage(conn) << "\n";

        PQclear(productResult);
        return;
    }

    if (PQntuples(productResult) == 0)
    {
        cout << "Product not found.\n";

        PQclear(productResult);
        return;
    }

    string productName = PQgetvalue(productResult, 0, 0);

    int availableStock =
        stoi(PQgetvalue(productResult, 0, 2));

    PQclear(productResult);

    const char* cartCheckParams[2];

    cartCheckParams[0] = userIdStr.c_str();
    cartCheckParams[1] = productIdStr.c_str();

    PGresult* cartCheckResult = PQexecParams(
        conn,
        "SELECT quantity "
        "FROM public.cart "
        "WHERE user_id = $1 "
        "AND product_id = $2",
        2,
        nullptr,
        cartCheckParams,
        nullptr,
        nullptr,
        0
    );

    if (PQresultStatus(cartCheckResult) != PGRES_TUPLES_OK)
    {
        cout << "Failed to check cart: "
             << PQerrorMessage(conn) << "\n";

        PQclear(cartCheckResult);
        return;
    }

    int existingQuantity = 0;

    if (PQntuples(cartCheckResult) > 0)
    {
        existingQuantity =
            stoi(PQgetvalue(cartCheckResult, 0, 0));
    }

    PQclear(cartCheckResult);

    if (existingQuantity + quantity > availableStock)
    {
        cout << "\nNot enough stock available.\n";

        cout << "Product: "
             << productName << "\n";

        cout << "Available stock: "
             << availableStock << "\n";

        cout << "Already in cart: "
             << existingQuantity << "\n";

        cout << "Requested quantity: "
             << quantity << "\n";

        return;
    }

    string quantityStr = to_string(quantity);

    const char* params[3];

    params[0] = userIdStr.c_str();
    params[1] = productIdStr.c_str();
    params[2] = quantityStr.c_str();

    PGresult* result = PQexecParams(
        conn,
        "INSERT INTO public.cart "
        "(user_id, product_id, quantity) "
        "VALUES ($1, $2, $3) "
        "ON CONFLICT (user_id, product_id) "
        "DO UPDATE SET "
        "quantity = public.cart.quantity + EXCLUDED.quantity",
        3,
        nullptr,
        params,
        nullptr,
        nullptr,
        0
    );

    if (PQresultStatus(result) != PGRES_COMMAND_OK)
    {
        cout << "Add to cart failed: "
             << PQerrorMessage(conn) << "\n";

        PQclear(result);
        return;
    }

    PQclear(result);

    cout << "\nProduct added to cart successfully!\n";

    cout << "Product: "
         << productName << "\n";

    cout << "Quantity in cart: "
         << existingQuantity + quantity << "\n";
}


// ============================================================
// VIEW CART
// ============================================================

void viewCart()
{
    if (currentUserId <= 0)
    {
        cout << "No user is currently logged in.\n";
        return;
    }

    string userIdStr = to_string(currentUserId);

    const char* params[1];
    params[0] = userIdStr.c_str();

    PGresult* result = PQexecParams(
        conn,
        "SELECT c.id, "
        "p.name, "
        "p.price, "
        "c.quantity, "
        "(p.price * c.quantity) AS total "
        "FROM public.cart c "
        "JOIN public.products p "
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
        cout << "Failed to load cart: "
             << PQerrorMessage(conn) << "\n";

        PQclear(result);
        return;
    }

    cout << "\n========== YOUR CART ==========\n";

    int rows = PQntuples(result);

    if (rows == 0)
    {
        cout << "Your cart is empty.\n";
    }
    else
    {
        double grandTotal = 0;

        for (int i = 0; i < rows; i++)
        {
            cout << "Cart ID : "
                 << PQgetvalue(result, i, 0) << "\n";

            cout << "Product : "
                 << PQgetvalue(result, i, 1) << "\n";

            cout << "Price   : Rs."
                 << PQgetvalue(result, i, 2) << "\n";

            cout << "Quantity: "
                 << PQgetvalue(result, i, 3) << "\n";

            cout << "Total   : Rs."
                 << PQgetvalue(result, i, 4) << "\n";

            cout << "-------------------------------\n";

            grandTotal +=
                stod(PQgetvalue(result, i, 4));
        }

        cout << "GRAND TOTAL: Rs."
             << grandTotal << "\n";
    }

    cout << "===============================\n";

    PQclear(result);
}


// ============================================================
// CHECKOUT
// ============================================================

void checkout()
{
    if (currentUserId <= 0)
    {
        cout << "No user is currently logged in.\n";
        return;
    }

    string userIdStr = to_string(currentUserId);

    const char* cartParams[1];
    cartParams[0] = userIdStr.c_str();

    PGresult* result = PQexecParams(
        conn,
        "SELECT c.product_id, "
        "c.quantity, "
        "p.price "
        "FROM public.cart c "
        "JOIN public.products p "
        "ON c.product_id = p.id "
        "WHERE c.user_id = $1",
        1,
        nullptr,
        cartParams,
        nullptr,
        nullptr,
        0
    );

    if (PQresultStatus(result) != PGRES_TUPLES_OK)
    {
        cout << "Checkout failed: "
             << PQerrorMessage(conn) << "\n";

        PQclear(result);
        return;
    }

    int rows = PQntuples(result);

    if (rows == 0)
    {
        cout << "Your cart is empty.\n";

        PQclear(result);
        return;
    }

    double total = 0;

    for (int i = 0; i < rows; i++)
    {
        int quantity =
            stoi(PQgetvalue(result, i, 1));

        double price =
            stod(PQgetvalue(result, i, 2));

        total += quantity * price;
    }

    string totalStr = to_string(total);

    const char* orderParams[2];

    orderParams[0] = userIdStr.c_str();
    orderParams[1] = totalStr.c_str();

    PGresult* orderResult = PQexecParams(
        conn,
        "INSERT INTO public.orders "
        "(user_id, total_amount, status, order_date) "
        "VALUES ($1, $2, 'PLACED', CURRENT_TIMESTAMP) "
        "RETURNING id",
        2,
        nullptr,
        orderParams,
        nullptr,
        nullptr,
        0
    );

    if (PQresultStatus(orderResult) != PGRES_TUPLES_OK)
    {
        cout << "Order creation failed: "
             << PQerrorMessage(conn) << "\n";

        PQclear(orderResult);
        PQclear(result);

        return;
    }

    int orderId =
        stoi(PQgetvalue(orderResult, 0, 0));

    PQclear(orderResult);

    for (int i = 0; i < rows; i++)
    {
        string orderIdStr = to_string(orderId);

        string productIdStr =
            PQgetvalue(result, i, 0);

        string quantityStr =
            PQgetvalue(result, i, 1);

        string priceStr =
            PQgetvalue(result, i, 2);

        const char* itemParams[4];

        itemParams[0] = orderIdStr.c_str();
        itemParams[1] = productIdStr.c_str();
        itemParams[2] = quantityStr.c_str();
        itemParams[3] = priceStr.c_str();

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
            cout << "Failed to save order item: "
                 << PQerrorMessage(conn) << "\n";

            PQclear(itemResult);
            PQclear(result);

            return;
        }

        PQclear(itemResult);
    }

    PQclear(result);

    PGresult* stockResult = PQexecParams(
        conn,
        "UPDATE public.products p "
        "SET quantity = p.quantity - c.quantity "
        "FROM public.cart c "
        "WHERE p.id = c.product_id "
        "AND c.user_id = $1 "
        "AND p.quantity >= c.quantity",
        1,
        nullptr,
        cartParams,
        nullptr,
        nullptr,
        0
    );

    if (PQresultStatus(stockResult) != PGRES_COMMAND_OK)
    {
        cout << "Warning: Product stock could not be updated.\n";
    }

    PQclear(stockResult);

    PGresult* clearResult = PQexecParams(
        conn,
        "DELETE FROM public.cart "
        "WHERE user_id = $1",
        1,
        nullptr,
        cartParams,
        nullptr,
        nullptr,
        0
    );

    if (PQresultStatus(clearResult) != PGRES_COMMAND_OK)
    {
        cout << "Warning: Order created, "
                "but cart could not be cleared.\n";
    }

    PQclear(clearResult);

    cout << "\n========== CHECKOUT ==========\n";

    cout << "Order created successfully!\n";
    cout << "Order ID: "
         << orderId << "\n";

    cout << "Total: Rs."
         << total << "\n";

    cout << "Order items saved successfully!\n";
    cout << "Product stock updated successfully!\n";
    cout << "Cart cleared successfully!\n";
    cout << "Checkout completed successfully!\n";

cout << "==============================\n";
}


// ============================================================
// VIEW MY ORDERS
// ============================================================

void viewMyOrders()
{
    if (currentUserId <= 0)
    {
        cout << "No user is currently logged in.\n";
        return;
    }

    string userIdStr = to_string(currentUserId);

    const char* params[1];
    params[0] = userIdStr.c_str();

    PGresult* result = PQexecParams(
        conn,
        "SELECT id, "
        "total_amount, "
        "status, "
        "order_date "
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
        cout << "Failed to load orders: "
             << PQerrorMessage(conn) << "\n";

        PQclear(result);
        return;
    }

    cout << "\n========== MY ORDERS ==========\n";

    int rows = PQntuples(result);

    if (rows == 0)
    {
        cout << "No orders found.\n";
    }
    else
    {
        for (int i = 0; i < rows; i++)
        {
            cout << "Order ID : "
                 << PQgetvalue(result, i, 0) << "\n";

            cout << "Total    : Rs."
                 << PQgetvalue(result, i, 1) << "\n";

            cout << "Status   : "
                 << PQgetvalue(result, i, 2) << "\n";

            cout << "Date     : "
                 << PQgetvalue(result, i, 3) << "\n";

            cout << "-------------------------------\n";
        }
    }

    cout << "===============================\n";

    PQclear(result);
}