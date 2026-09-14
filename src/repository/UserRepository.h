#ifndef USER_REPOSITORY_H
#define USER_REPOSITORY_H
#include <string>
#include "../model/User.h"
class UserRepository {
    public:
    UserRepository()=default;
    bool createUser(const User& user);
    bool findByEmail(const std::string& email,User& user);
    bool findById(int id,User& user);
};
#endif
