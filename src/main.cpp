#include <drogon/drogon.h>

int main()
{
    drogon::app()
        .registerHandler(
            "/",
            [](const drogon::HttpRequestPtr&,
               std::function<void(const drogon::HttpResponsePtr&)>&& callback)
            {
                auto response = drogon::HttpResponse::newHttpResponse();
                response->setBody("Welcome to BerciiMart!");
                callback(response);
            },
            {drogon::Get}
        )

        .registerHandler(
            "/api/health",
            [](const drogon::HttpRequestPtr&,
               std::function<void(const drogon::HttpResponsePtr&)>&& callback)
            {
                auto response = drogon::HttpResponse::newHttpResponse();
                response->setContentTypeCode(drogon::CT_APPLICATION_JSON);
                response->setBody(R"({"status":"ok","service":"BerciiMart"})");
                callback(response);
            },
            {drogon::Get}
        )

        .addListener("0.0.0.0", 8080)
        .run();

    return 0;
}