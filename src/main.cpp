#include <iostream>
#include"../include/database.h"
#include <fstream>
#include <string>
#include "../include/user.h"

using namespace std;
extern PGconn* conn;
string USERS_FILE = "database/users.txt";

string resolveUsersFile()
{
    ofstream out(USERS_FILE, ios::app);

    if(out.is_open())
    {
        out.close();
        return USERS_FILE;
    }

    string fallback = "users.txt";

    ofstream out2(fallback, ios::app);

    if(out2.is_open())
    {
        out2.close();
        return fallback;
    }

    return USERS_FILE;
}
int main()
{
    if (!connectDatabase())
    {
        return 1;
    }

    USERS_FILE = resolveUsersFile();

    int choice;

    do
    {
        cout << "\n==========================\n";
        cout << "      BERCIIMART SYSTEM\n";
        cout << "==========================\n";
        cout << "1. Register\n";
        cout << "2. Login\n";
        cout << "3. Exit\n";
        cout << "Enter your choice: ";

        if (!(cin >> choice))
        {
            cout << "\nInvalid input. Exiting.\n";
            break;
        }

        switch (choice)
        {
            case 1:
            {
                string username;
                string email;
                string password;

                cout << "\n--- Register ---\n";

                cout << "Enter username: ";
                cin >> username;

                cout << "Enter email: ";
                cin >> email;

                cout << "Enter password: ";
                cin >> password;

                registerDatabaseUser(username, email, password);

                break;
            }

            case 2:
            {
                string username;
                string password;

                cout << "\n--- Login ---\n";

                cout << "Enter username: ";
                cin >> username;

                cout << "Enter password: ";
                cin >> password;

                int userId = loginDatabaseUser(username, password);

                if (userId != -1)
                {
                    cout << "\nWelcome to BerciiMart!\n";

                    int shopChoice;

                    do
                    {
                        cout << "\n========================\n";
                        cout << "     BERCIIMART SHOP\n";
                        cout << "========================\n";
                        cout << "1. View Products\n";
                        cout << "2. Add to Cart\n";
                        cout << "3. View Cart\n";
                        cout << "4. Checkout\n";
                        cout << "5. My Orders\n";
                        cout << "6. Logout\n";
                        cout << "Enter your choice: ";

                        cin >> shopChoice;

                        switch (shopChoice)
                        {
                            case 1:
                                viewProducts();
                                break;

                            case 2:
                                addProductToCart();
                                break;

                            case 3:
                                viewCart();
                                break;

                            case 4:
                                checkout();
                                break;

                            case 5:
                                viewMyOrders();
                                break;

                            case 6:
                                cout << "\nLogged out successfully.\n";
                                break;

                            default:
                                cout << "\nInvalid choice.\n";
                        }

                    } while (shopChoice != 6);
                }

                break;
            }

            case 3:
                cout << "\nThank you for using BerciiMart!\n";
                break;

            default:
                cout << "\nInvalid choice! Please try again.\n";
        }

    } while (choice != 3);

    closeDatabase();

    return 0;
}