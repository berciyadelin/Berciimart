# include<iostream>
# include<string>
# include<libpq-fe.h>
using namespace std;
int main(){
    string password;
    cout<<"Enter password: ";
    cin>>password;
    string conninfo = "host=localhost port=5432 dbname=testdb user=postgres password=" + password;
    PGconn *conn = PQconnectdb(conninfo.c_str());
    if (PQstatus(conn) != CONNECTION_OK) {
        cerr << "Connection to database failed: " << PQerrorMessage(conn) << endl;
        PQfinish(conn);
        return 1;
    }
    PQfinish(conn);
    return 0;
}