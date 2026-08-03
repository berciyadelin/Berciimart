#include <iostream>
#include <fstream>
#include <string>
#include <sstream>
#include <vector>
#include <algorithm>

using namespace std;

string USERS_FILE = "database/users.txt";

string resolveUsersFile()
{
    // Try to open/create database/users.txt. If that fails (e.g. "database" is a file),
    // fall back to creating users.txt in the workspace root.
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
    return USERS_FILE; // last resort
}

vector<pair<string,string>> loadUsers()
{
    vector<pair<string,string>> users;
    ifstream in(USERS_FILE);
    if(!in.is_open()) return users;

    string line;
    while(getline(in, line))
    {
        if(line.empty()) continue;
        auto pos = line.find(':');
        if(pos == string::npos) continue;
        string u = line.substr(0,pos);
        string p = line.substr(pos+1);
        users.emplace_back(u,p);
    }
    return users;
}

bool userExists(const vector<pair<string,string>>& users, const string& username)
{
    return any_of(users.begin(), users.end(), [&](const pair<string,string>& up){ return up.first==username; });
}

bool registerUser()
{
    cout << "\n--- Register ---\n";
    string username, password;
    cout << "Enter username: ";
    cin >> username;
    cout << "Enter password: ";
    cin >> password;

    auto users = loadUsers();
    if(userExists(users, username))
    {
        cout << "User already exists. Choose another username.\n";
        return false;
    }

    ofstream out(USERS_FILE, ios::app);
    if(!out.is_open())
    {
        // try to create directory fallback: let ofstream fail gracefully
        cout << "Unable to open users database file.\n";
        return false;
    }
    out << username << ":" << password << "\n";
    cout << "Registration successful.\n";
    return true;
}

bool loginUser()
{
    cout << "\n--- Login ---\n";
    string username, password;
    cout << "Username: ";
    cin >> username;
    cout << "Password: ";
    cin >> password;

    auto users = loadUsers();
    for(const auto &up : users)
    {
        if(up.first == username && up.second == password)
        {
            cout << "Login successful. Welcome, " << username << "!\n";
            return true;
        }
    }
    cout << "Login failed. Invalid credentials.\n";
    return false;
}

int main()
{
    USERS_FILE = resolveUsersFile();
    int choice;

    do
    {
        cout << "\n==========================\n";
        cout << "BERCIIMART SYSTEM\n";
        cout << "==========================\n";
        cout << "1. Register\n";
        cout << "2. Login\n";
        cout << "3. Exit\n";
        cout << "Enter your choice: ";
        if(!(cin >> choice))
        {
            cout << "\nNo input detected. Exiting.\n";
            break;
        }

        switch(choice)
        {
            case 1:
                registerUser();
                break;

            case 2:
                loginUser();
                break;

            case 3:
                cout << "\nThank you for using BerciiMart!\n";
                break;

            default:
                cout << "\nInvalid choice! Please try again.\n";
        }
    } while(choice != 3);

    return 0;
}