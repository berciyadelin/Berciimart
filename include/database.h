#ifndef DATABASE_H
#define DATABASE_H

#include<libpq-fe.h>

bool connectDatabase();
void closeDatabase();
#endif