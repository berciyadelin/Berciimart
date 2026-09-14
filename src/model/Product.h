#ifndef PRODUCT_H
#define PRODUCT_H

#include <string>

class Product
{
private:
    int productId;
    int sellerId;
    std::string name;
    std::string description;
    double price;
    std::string category;

public:
    Product();

    Product(int productId,
            int sellerId,
            const std::string& name,
            const std::string& description,
            double price,
            const std::string& category);

    int getProductId() const;
    int getSellerId() const;
    std::string getName() const;
    std::string getDescription() const;
    double getPrice() const;
    std::string getCategory() const;

    void setProductId(int productId);
    void setSellerId(int sellerId);
    void setName(const std::string& name);
    void setDescription(const std::string& description);
    void setPrice(double price);
    void setCategory(const std::string& category);
};

#endif