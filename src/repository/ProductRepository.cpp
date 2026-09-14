#include "ProductRepository.h"
#include "../../include/database.h"

bool ProductRepository::createProduct(Product& product)
{
    if (conn == nullptr)
    {
        return false;
    }

    std::string productId = std::to_string(product.getProductId());
    std::string sellerId = std::to_string(product.getSellerId());
    std::string name = product.getName();
    std::string description = product.getDescription();
    std::string price = std::to_string(product.getPrice());
    std::string category = product.getCategory();

    const char* params[6];

    params[0] = sellerId.c_str();
    params[1] = name.c_str();
    params[2] = description.c_str();
    params[3] = price.c_str();
    params[4] = category.c_str();
    params[5] = productId.c_str();

    PGresult* result = PQexecParams(
        conn,
        "INSERT INTO public.products "
        "(seller_id, name, description, price, category) "
        "VALUES ($1, $2, $3, $4, $5)",
        5,
        nullptr,
        params,
        nullptr,
        nullptr,
        0
    );

    bool success = PQresultStatus(result) == PGRES_COMMAND_OK;

    if (success)
    {
        if (PQntuples(result) > 0)
        {
            product.setProductId(
                std::stoi(PQgetvalue(result, 0, 0))
            );
        }
    }

    PQclear(result);

    return success;
}

bool ProductRepository::updateProduct(const Product& product)
{
    if (conn == nullptr)
    {
        return false;
    }

    std::string productId = std::to_string(product.getProductId());
    std::string name = product.getName();
    std::string description = product.getDescription();
    std::string price = std::to_string(product.getPrice());
    std::string category = product.getCategory();

    const char* params[5];

    params[0] = name.c_str();
    params[1] = description.c_str();
    params[2] = price.c_str();
    params[3] = category.c_str();
    params[4] = productId.c_str();

    PGresult* result = PQexecParams(
        conn,
        "UPDATE public.products "
        "SET name = $1, "
        "description = $2, "
        "price = $3, "
        "category = $4 "
        "WHERE id = $5",
        5,
        nullptr,
        params,
        nullptr,
        nullptr,
        0
    );

    bool success = PQresultStatus(result) == PGRES_COMMAND_OK;

    PQclear(result);

    return success;
}

bool ProductRepository::deleteProduct(int productId, int sellerId)
{
    if (conn == nullptr)
    {
        return false;
    }

    std::string productIdStr = std::to_string(productId);
    std::string sellerIdStr = std::to_string(sellerId);

    const char* params[2];

    params[0] = productIdStr.c_str();
    params[1] = sellerIdStr.c_str();

    PGresult* result = PQexecParams(
        conn,
        "DELETE FROM public.products "
        "WHERE id = $1 AND seller_id = $2",
        2,
        nullptr,
        params,
        nullptr,
        nullptr,
        0
    );

    bool success = PQresultStatus(result) == PGRES_COMMAND_OK;

    PQclear(result);

    return success;
}

std::vector<Product> ProductRepository::getAllProducts()
{
    std::vector<Product> products;

    if (conn == nullptr)
    {
        return products;
    }

    PGresult* result = PQexec(
        conn,
        "SELECT id, seller_id, name, description, price, category "
        "FROM public.products "
        "ORDER BY id"
    );

    if (PQresultStatus(result) != PGRES_TUPLES_OK)
    {
        PQclear(result);
        return products;
    }

    int rows = PQntuples(result);

    for (int i = 0; i < rows; i++)
    {
        Product product(
            std::stoi(PQgetvalue(result, i, 0)),
            std::stoi(PQgetvalue(result, i, 1)),
            PQgetvalue(result, i, 2),
            PQgetvalue(result, i, 3),
            std::stod(PQgetvalue(result, i, 4)),
            PQgetvalue(result, i, 5)
        );

        products.push_back(product);
    }

    PQclear(result);

    return products;
}

std::vector<Product> ProductRepository::searchProducts(
    const std::string& keyword)
{
    std::vector<Product> products;

    if (conn == nullptr)
    {
        return products;
    }

    const char* params[1];
    params[0] = keyword.c_str();

    PGresult* result = PQexecParams(
        conn,
        "SELECT id, seller_id, name, description, price, category "
        "FROM public.products "
        "WHERE name ILIKE '%' || $1 || '%' "
        "OR description ILIKE '%' || $1 || '%' "
        "ORDER BY id",
        1,
        nullptr,
        params,
        nullptr,
        nullptr,
        0
    );

    if (PQresultStatus(result) != PGRES_TUPLES_OK)
    {
        PQclear(result);
        return products;
    }

    int rows = PQntuples(result);

    for (int i = 0; i < rows; i++)
    {
        products.emplace_back(
            std::stoi(PQgetvalue(result, i, 0)),
            std::stoi(PQgetvalue(result, i, 1)),
            PQgetvalue(result, i, 2),
            PQgetvalue(result, i, 3),
            std::stod(PQgetvalue(result, i, 4)),
            PQgetvalue(result, i, 5)
        );
    }

    PQclear(result);

    return products;
}

std::vector<Product> ProductRepository::filterByCategory(
    const std::string& category)
{
    std::vector<Product> products;

    if (conn == nullptr)
    {
        return products;
    }

    const char* params[1];
    params[0] = category.c_str();

    PGresult* result = PQexecParams(
        conn,
        "SELECT id, seller_id, name, description, price, category "
        "FROM public.products "
        "WHERE category = $1 "
        "ORDER BY id",
        1,
        nullptr,
        params,
        nullptr,
        nullptr,
        0
    );

    if (PQresultStatus(result) != PGRES_TUPLES_OK)
    {
        PQclear(result);
        return products;
    }

    int rows = PQntuples(result);

    for (int i = 0; i < rows; i++)
    {
        products.emplace_back(
            std::stoi(PQgetvalue(result, i, 0)),
            std::stoi(PQgetvalue(result, i, 1)),
            PQgetvalue(result, i, 2),
            PQgetvalue(result, i, 3),
            std::stod(PQgetvalue(result, i, 4)),
            PQgetvalue(result, i, 5)
        );
    }

    PQclear(result);

    return products;
}

bool ProductRepository::findById(
    int productId,
    Product& product)
{
    if (conn == nullptr)
    {
        return false;
    }

    std::string productIdStr = std::to_string(productId);

    const char* params[1];
    params[0] = productIdStr.c_str();

    PGresult* result = PQexecParams(
        conn,
        "SELECT id, seller_id, name, description, price, category "
        "FROM public.products "
        "WHERE id = $1",
        1,
        nullptr,
        params,
        nullptr,
        nullptr,
        0
    );

    if (PQresultStatus(result) != PGRES_TUPLES_OK)
    {
        PQclear(result);
        return false;
    }

    if (PQntuples(result) == 0)
    {
        PQclear(result);
        return false;
    }

    product = Product(
        std::stoi(PQgetvalue(result, 0, 0)),
        std::stoi(PQgetvalue(result, 0, 1)),
        PQgetvalue(result, 0, 2),
        PQgetvalue(result, 0, 3),
        std::stod(PQgetvalue(result, 0, 4)),
        PQgetvalue(result, 0, 5)
    );

    PQclear(result);

    return true;
}