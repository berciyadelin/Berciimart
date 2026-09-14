#ifndef ORDER_MODEL_H
#define ORDER_MODEL_H
#include <cstdint>
#include<string>
class Order {
    public:
    int id=0;
    int buyerId=0;
    std::int64_t totalPriceCents=0;
    std::string status="";
}; 
#endif
