#include "OrderRepository.h"
#include "C:/Users/ADMINS/Documents/Berciimart/include/database.h"

#include <iostream>
#include <string>
#include <vector>
#include <cstdint>
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

    std::string buyerIdStr =
        std::to_string(order.buyerId);

    double totalAmount =
        static_cast<double>(order.totalPriceCents) / 100.0;

    std::string totalAmountStr =
        std::to_string(totalAmount);

    const char* params[3];

    params[0] = buyerIdStr.c_str();
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

    double price =
        static_cast<double>(item.priceCents) / 100.0;

    std::string priceStr =
        std::to_string(price);

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

    std::string buyerIdStr =
        std::to_string(buyerId);

    const char* params[1];

    params[0] = buyerIdStr.c_str();

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

        order.buyerId =
            std::stoi(PQgetvalue(result, i, 1));

        double totalAmount =
            std::stod(PQgetvalue(result, i, 2));

        order.totalPriceCents =
            static_cast<std::int64_t>(
                totalAmount * 100.0
            );

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

    std::string sellerIdStr =
        std::to_string(sellerId);

    const char* params[1];

    params[0] = sellerIdStr.c_str();

    /*
       This query assumes that the products table
       contains a seller_id column.
    */

    PGresult* result = PQexecParams(
        conn,
        "SELECT DISTINCT "
        "o.id, "
        "o.user_id, "
        "o.total_amount, "
        "o.status "
        "FROM public.orders o "
        "JOIN public.order_items oi "
        "ON o.id = oi.order_id "
        "JOIN public.products p "
        "ON oi.product_id = p.id "
        "WHERE p.seller_id = $1 "
        "ORDER BY o.id DESC",
        1,
        nullptr,
        params,
        nullptr,
        nullptr,
        0
    );

    if (PQresultStatus(result) != PGRES_TUPLES_OK)
    {
        std::cout << "Failed to load seller orders: "
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

        order.buyerId =
            std::stoi(PQgetvalue(result, i, 1));

        double totalAmount =
            std::stod(PQgetvalue(result, i, 2));

        order.totalPriceCents =
            static_cast<std::int64_t>(
                totalAmount * 100.0
            );

        order.status =
            PQgetvalue(result, i, 3);

        orders.push_back(order);
    }

    PQclear(result);

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
    }
    return orders;
}