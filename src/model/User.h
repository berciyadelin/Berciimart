#ifndef USER_MODEL_H
#define USER_MODEL_H

#include <string>

class User
{
public:
    int id = 0;
    std::string name = "";
    std::string email = "";
    std::string passwordHash = "";
};

#endif