#ifndef ORDER_ITEM_MODEL_H
#define ORDER_ITEM_MODEL_H

#include <string>

class OrderItem
{
public:
    int id = 0;
    int orderId = 0;
    int productId = 0;
    int quantity = 0;
    double price = 0.0;
};

#endif