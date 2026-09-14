#ifndef REGISTER_REQUEST_DTO_H
#define REGISTER_REQUEST_DTO_H
#include <string>
struct RegisterRequest {
    std::string name;
    std::string email;
    std::string password;
    std::string role;
};
#endif