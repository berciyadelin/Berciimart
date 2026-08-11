#ifndef USER_H
#define USER_H

#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

class User
{
private:
    string username;
    string password;

public:
    User()
    {
        username = "";
        password = "";
    }

    User(string u, string p)
    {
        username = u;
        password = p;
    }

    string getUsername()
    {
        return username;
    }

    bool registerUser(string file)
    {
        vector<pair<string, string>> users;

        ifstream in(file);
        string line;

        while(getline(in, line))
        {
            if(line.empty())
                continue;

            size_t pos = line.find(':');

            if(pos != string::npos)
            {
                users.push_back({
                    line.substr(0, pos),
                    line.substr(pos + 1)
                });
            }
        }

        in.close();

        for(auto &u : users)
        {
            if(u.first == username)
            {
                cout << "User already exists.\n";
                return false;
            }
        }

        ofstream out(file, ios::app);

        if(!out.is_open())
        {
            cout << "Unable to open users database.\n";
            return false;
        }

        out << username << ":" << password << "\n";
        out.close();

        cout << "Registration successful.\n";
        return true;
    }

    bool loginUser(string file)
    {
        ifstream in(file);

        if(!in.is_open())
        {
            cout << "Unable to open users database.\n";
            return false;
        }

        string line;

        while(getline(in, line))
        {
            size_t pos = line.find(':');

            if(pos == string::npos)
                continue;

            string savedUsername = line.substr(0, pos);
            string savedPassword = line.substr(pos + 1);

            if(savedUsername == username &&
               savedPassword == password)
            {
                cout << "Login successful. Welcome, "
                     << username << "!\n";

                in.close();
                return true;
            }
        }

        in.close();

        cout << "Login failed. Invalid credentials.\n";
        return false;
    }
};

#endif