#ifndef ORDER_MODEL_H
#define ORDER_MODEL_H

#include <string>

class Order
{
public:
    int id = 0;
    int userId = 0;
    double totalAmount = 0.0;
    std::string status = "";
};

#endif