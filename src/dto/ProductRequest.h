#ifndef PRODUCT_REQUEST_DTO_H
#define PRODUCT_REQUEST_DTO_H
#include <cstring>
#include <string>
struct ProductRequest {
    std::string name;
    std::string description;
    std::int64_t priceCents;
    std::int64_t stockQty;
    std::string category;
    std::string imageUrl;
};
#endif
