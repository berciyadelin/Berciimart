#include "Product.h"

Product::Product()
    : productId(0),
      sellerId(0),
      name(""),
      description(""),
      price(0.0),
      category("")
{
}

Product::Product(int productId,
                 int sellerId,
                 const std::string& name,
                 const std::string& description,
                 double price,
                 const std::string& category)
    : productId(productId),
      sellerId(sellerId),
      name(name),
      description(description),
      price(price),
      category(category)
{
}

int Product::getProductId() const
{
    return productId;
}

int Product::getSellerId() const
{
    return sellerId;
}

std::string Product::getName() const
{
    return name;
}

std::string Product::getDescription() const
{
    return description;
}

double Product::getPrice() const
{
    return price;
}

std::string Product::getCategory() const
{
    return category;
}

void Product::setProductId(int productId)
{
    this->productId = productId;
}

void Product::setSellerId(int sellerId)
{
    this->sellerId = sellerId;
}

void Product::setName(const std::string& name)
{
    this->name = name;
}

void Product::setDescription(const std::string& description)
{
    this->description = description;
}

void Product::setPrice(double price)
{
    this->price = price;
}

void Product::setCategory(const std::string& category)
{
    this->category = category;
}