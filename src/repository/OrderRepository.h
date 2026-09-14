#ifndef ORDER_REPOSITORY_H
#define ORDER_REPOSITORY_H

#include <vector>
#include <string>
#include "../model/Order.h"
#include "../model/OrderItem.h"

class OrderRepository
{
public:
    OrderRepository() = default;

    bool createOrder(Order& order);
    bool addOrderItem(const OrderItem& item);

    std::vector<Order> getOrdersByBuyer(int buyerId);
    std::vector<Order> getOrdersBySeller(int sellerId);
    std::vector<Order> getAllOrders();

    bool updateOrderStatus(int orderId, const std::string& status);
};

#endif