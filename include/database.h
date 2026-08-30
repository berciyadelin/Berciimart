#ifndef DATABASE_H
#define DATABASE_H
#include <libpq-fe.h>
#include <string>
extern PGconn* conn;
extern int currentUserId;
bool connectDatabase();
void closeDatabase();
bool registerDatabaseUser(
    const std::string& username,
    const std::string& email,
    const std::string& password
);
int loginDatabaseUser(
    const std::string& username,
    const std::string& password
);
void viewProducts();
void addProductToCart();
void viewCart();
void checkout();
void viewMyOrders();
#endif