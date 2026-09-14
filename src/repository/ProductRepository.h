#ifndef PRODUCT_REPOSITORY_H
#define PRODUCT_REPOSITORY_H
#include<string>
#include <vector>
#include "../model/Product.h"

class ProductRepository
{
public:
    ProductRepository() = default;

    bool createProduct(Product& product);
    bool updateProduct(const Product& product);
    bool deleteProduct(int productId, int sellerId);
    bool findById(int productId,Product&product);
    std::vector<Product> getAllProducts();
    std::vector<Product> searchProducts(const std::string& keyword);
    std::vector<Product> filterByCategory(const std::string& category);
};
#endif