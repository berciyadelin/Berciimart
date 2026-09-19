#include <drogon/drogon.h>
#include "../include/database.h"
void registerUser(
    const drogon::HttpRequestPtr& req,
    std::function<void(const drogon::HttpResponsePtr&)>&& callback)
{
    auto json = req->getJsonObject();

    if (!json)
    {
        Json::Value error;
        error["error"] = "Invalid JSON";

        auto response = drogon::HttpResponse::newHttpJsonResponse(error);
        response->setStatusCode(drogon::k400BadRequest);
        callback(response);
        return;
    }
std::string name = (*json)["name"].asString();
std::string email = (*json)["email"].asString();
std::string password = (*json)["password"].asString();
std::string role = (*json)["role"].asString();

if (name.empty() || email.empty() || password.empty() || role.empty())
{
    Json::Value error;
    error["error"] = "Name, email, password and role are required";

    auto response = drogon::HttpResponse::newHttpJsonResponse(error);
    response->setStatusCode(drogon::k400BadRequest);
    callback(response);
    return;
}

if (role != "Buyer" && role != "Seller")
{
    Json::Value error;
    error["error"] = "Role must be Buyer or Seller";

    auto response = drogon::HttpResponse::newHttpJsonResponse(error);
    response->setStatusCode(drogon::k400BadRequest);
    callback(response);
    return;
}

if (!connectDatabase())
{
    Json::Value error;
    error["error"] = "Database connection failed";

    auto response = drogon::HttpResponse::newHttpJsonResponse(error);
    response->setStatusCode(drogon::k500InternalServerError);
    callback(response);
    return;
}

if (!registerDatabaseUser(name, email, password, role))
{
    Json::Value error;
    error["error"] = "Registration failed. Email may already be registered.";

    auto response = drogon::HttpResponse::newHttpJsonResponse(error);
    response->setStatusCode(drogon::k400BadRequest);
    callback(response);
    return;
}

Json::Value result;
result["message"] = "Registration successful";
result["name"] = name;
result["email"] = email;
result["role"] = role;

auto response = drogon::HttpResponse::newHttpJsonResponse(result);
callback(response);

closeDatabase();
  
}