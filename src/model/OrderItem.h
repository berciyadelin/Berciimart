#ifndef ORDER_ITEM_MODEL_H
#define ORDER_ITEM_MODEL_H

#include <cstdint>
#include <string>

class OrderItem
{
public:
    int id = 0;
    int orderId = 0;
    int productId = 0;
    std::int64_t priceCents = 0;
    std::int64_t quantity = 0;
};

#endif