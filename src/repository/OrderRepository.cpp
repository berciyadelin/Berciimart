#include "OrderRepository.h"
#include "../../include/database.h"

#include <iostream>
#include <string>
#include <vector>

// ============================================================
// CREATE ORDER
// ============================================================

bool OrderRepository::createOrder(Order& order)
{
    if (conn == nullptr)
    {
        std::cout << "Database is not connected.\n";
        return false;
    }

    std::string userIdStr =
        std::to_string(order.userId);

    std::string totalAmountStr =
        std::to_string(order.totalAmount);

    const char* params[3];

    params[0] = userIdStr.c_str();
    params[1] = totalAmountStr.c_str();
    params[2] = order.status.c_str();

    PGresult* result = PQexecParams(
        conn,
        "INSERT INTO public.orders "
        "(user_id, total_amount, status, order_date) "
        "VALUES ($1, $2, $3, CURRENT_TIMESTAMP) "
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
        std::cout << "Failed to create order: "
                  << PQerrorMessage(conn) << "\n";

        PQclear(result);
        return false;
    }

    order.id =
        std::stoi(PQgetvalue(result, 0, 0));

    PQclear(result);

    return true;
}


// ============================================================
// ADD ORDER ITEM
// ============================================================

bool OrderRepository::addOrderItem(const OrderItem& item)
{
    if (conn == nullptr)
    {
        std::cout << "Database is not connected.\n";
        return false;
    }

    std::string orderIdStr =
        std::to_string(item.orderId);

    std::string productIdStr =
        std::to_string(item.productId);

    std::string quantityStr =
        std::to_string(item.quantity);

    std::string priceStr =
        std::to_string(item.price);

    const char* params[4];

    params[0] = orderIdStr.c_str();
    params[1] = productIdStr.c_str();
    params[2] = quantityStr.c_str();
    params[3] = priceStr.c_str();

    PGresult* result = PQexecParams(
        conn,
        "INSERT INTO public.order_items "
        "(order_id, product_id, quantity, price) "
        "VALUES ($1, $2, $3, $4)",
        4,
        nullptr,
        params,
        nullptr,
        nullptr,
        0
    );

    if (PQresultStatus(result) != PGRES_COMMAND_OK)
    {
        std::cout << "Failed to add order item: "
                  << PQerrorMessage(conn) << "\n";

        PQclear(result);
        return false;
    }

    PQclear(result);

    return true;
}


// ============================================================
// GET ORDERS BY BUYER
// ============================================================

std::vector<Order>
OrderRepository::getOrdersByBuyer(int buyerId)
{
    std::vector<Order> orders;

    if (conn == nullptr)
    {
        std::cout << "Database is not connected.\n";
        return orders;
    }

    std::string userIdStr =
        std::to_string(buyerId);

    const char* params[1];

    params[0] = userIdStr.c_str();

    PGresult* result = PQexecParams(
        conn,
        "SELECT id, "
        "user_id, "
        "total_amount, "
        "status "
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
        std::cout << "Failed to load buyer orders: "
                  << PQerrorMessage(conn) << "\n";

        PQclear(result);
        return orders;
    }

    int rows = PQntuples(result);

    for (int i = 0; i < rows; i++)
    {
        Order order;

        order.id =
            std::stoi(PQgetvalue(result, i, 0));

        order.userId =
            std::stoi(PQgetvalue(result, i, 1));

        order.totalAmount =
            std::stod(PQgetvalue(result, i, 2));

        order.status =
            PQgetvalue(result, i, 3);

        orders.push_back(order);
    }

    PQclear(result);

    return orders;
}


// ============================================================
// GET ORDERS BY SELLER
// ============================================================

std::vector<Order>
OrderRepository::getOrdersBySeller(int sellerId)
{
    std::vector<Order> orders;

    if (conn == nullptr)
    {
        std::cout << "Database is not connected.\n";
        return orders;
    }

    /*
        The current products table does not contain seller_id.

        Therefore, seller-specific orders cannot be retrieved
        using the current database structure.

        This function is kept so that the repository interface
        remains complete.
    */

    std::cout << "Seller orders are not available.\n";
    std::cout << "The products table does not contain seller_id.\n";

    return orders;
}


// ============================================================
// GET ALL ORDERS
// ============================================================

std::vector<Order>
OrderRepository::getAllOrders()
{
    std::vector<Order> orders;

    if (conn == nullptr)
    {
        std::cout << "Database is not connected.\n";
        return orders;
    }

    PGresult* result = PQexec(
        conn,
        "SELECT id, "
        "user_id, "
        "total_amount, "
        "status "
        "FROM public.orders "
        "ORDER BY id DESC"
    );

    if (PQresultStatus(result) != PGRES_TUPLES_OK)
    {
        std::cout << "Failed to load orders: "
                  << PQerrorMessage(conn) << "\n";

        PQclear(result);
        return orders;
    }

    int rows = PQntuples(result);

    for (int i = 0; i < rows; i++)
    {
        Order order;

        order.id =
            std::stoi(PQgetvalue(result, i, 0));

        order.userId =
            std::stoi(PQgetvalue(result, i, 1));

        order.totalAmount =
            std::stod(PQgetvalue(result, i, 2));

        order.status =
            PQgetvalue(result, i, 3);

        orders.push_back(order);
    }

    PQclear(result);

    return orders;
}


// ============================================================
// UPDATE ORDER STATUS
// ============================================================

bool OrderRepository::updateOrderStatus(
    int orderId,
    const std::string& status)
{
    if (conn == nullptr)
    {
        std::cout << "Database is not connected.\n";
        return false;
    }

    std::string orderIdStr =
        std::to_string(orderId);

    const char* params[2];

    params[0] = status.c_str();
    params[1] = orderIdStr.c_str();

    PGresult* result = PQexecParams(
        conn,
        "UPDATE public.orders "
        "SET status = $1 "
        "WHERE id = $2",
        2,
        nullptr,
        params,
        nullptr,
        nullptr,
        0
    );

    if (PQresultStatus(result) != PGRES_COMMAND_OK)
    {
        std::cout << "Failed to update order status: "
                  << PQerrorMessage(conn) << "\n";

        PQclear(result);
        return false;
    }

    PQclear(result);

    return true;
}