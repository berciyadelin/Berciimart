#ifndef REVIEW_REQUEST_DTO_H
#define REVIEW_REQUEST_DTO_H
#include <string>
struct ReviewRequest {
    int productId=0;
    int rating=0;
    std::string comment="";
};
#endif