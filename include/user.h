#ifndef USER_H
#define USER_H

#include <iostream>
#include <string>

using namespace std;

class User
{
private:
    int id;
    string name;
    string email;

public:
    // Default constructor
    User()
    {
        id = 0;
        name = "";
        email = "";
    }

    // Parameterized constructor
    User(int userId, const string& userName, const string& userEmail)
    {
        id = userId;
        name = userName;
        email = userEmail;
    }

    // Setters
    void setId(int userId)
    {
        id = userId;
    }

    void setName(const string& userName)
    {
        name = userName;
    }

    void setEmail(const string& userEmail)
    {
        email = userEmail;
    }

    // Getters
    int getId() const
    {
        return id;
    }

    string getName() const
    {
        return name;
    }

    string getEmail() const
    {
        return email;
    }

    // Display user information
    void displayUser() const
    {
        cout << "User ID: " << id << "\n";
        cout << "Name: " << name << "\n";
        cout << "Email: " << email << "\n";
    }
};

#endif