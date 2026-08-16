#include "../include/database.h"
#include <iostream>

using namespace std;

PGconn* conn = nullptr;

bool connectDatabase()
{
    conn = PQconnectdb(
        "host=localhost "
        "port=5432 "
        "dbname=berciimart "
        "user=postgres "
        "password=bercii@7117"
    );

    if (PQstatus(conn) != CONNECTION_OK)
    {
        cout << "Database connection failed!\n";
        cout << PQerrorMessage(conn);
        return false;
    }

    cout << "Database connected successfully!\n";
    return true;
}

void closeDatabase()
{
    if (conn != nullptr)
    {
        PQfinish(conn);
        conn = nullptr;
    }
}