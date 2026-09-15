#include <drogon/drogon.h>

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

    Json::Value result;
    result["message"] = "Registration API is working";
    result["name"] = (*json)["name"].asString();
    result["email"] = (*json)["email"].asString();
    result["role"] = (*json)["role"].asString();

    auto response = drogon::HttpResponse::newHttpJsonResponse(result);
    callback(response);
}