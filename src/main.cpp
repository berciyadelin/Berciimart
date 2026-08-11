#include <iostream>
#include <fstream>
#include <string>
#include "../include/user.h"

using namespace std;

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

        if(!(cin >> choice))
        {
            cout << "\nInvalid input. Exiting.\n";
            break;
        }

        switch(choice)
        {
            case 1:
            {
                string username;
                string password;

                cout << "\n--- Register ---\n";

                cout << "Enter username: ";
                cin >> username;

                cout << "Enter password: ";
                cin >> password;

                // Creating User object
                User user(username, password);

                // Calling class function
                user.registerUser(USERS_FILE);

                break;
            }

            case 2:
            {
                string username;
                string password;

                cout << "\n--- Login ---\n";

                cout << "Username: ";
                cin >> username;

                cout << "Password: ";
                cin >> password;

                // Creating User object
                User user(username, password);

                // Calling class function
                user.loginUser(USERS_FILE);

                break;
            }

            case 3:
                cout << "\nThank you for using BerciiMart!\n";
                break;

            default:
                cout << "\nInvalid choice! Please try again.\n";
        }

    } while(choice != 3);

    return 0;
}