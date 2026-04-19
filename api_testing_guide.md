# BoonSonClon API Master Guide

This guide follows the exact structure of your Postman collection. Use these JSON payloads at `http://localhost:3000/api`.

---

## 📂 Auth

### Member Register
**`POST /api/auth/member/register`**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "0812345678"
}
```

### Admin Register
**`POST /api/auth/admin/register`**
```json
{
  "firstName": "Super",
  "lastName": "Admin",
  "email": "admin@example.com",
  "password": "adminpassword",
  "address": "Admin HQ, Bangkok",
  "age": 35,
  "phone": "0998887776"
}
```

### Member Login
**`POST /api/auth/member/login`**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Admin Login
**`POST /api/auth/admin/login`**
```json
{
  "email": "admin@example.com",
  "password": "adminpassword"
}
```

### Get Current User
**`GET /api/auth/me`**
*(Requires Login Cookie)*

---

## 📂 Products

### Get Products
**`GET /api/products?page=1&limit=9&sort=latest`**

### Get Filter Meta
**`GET /api/products/meta/filters`**

### Get Categories
**`GET /api/products/meta/categories`**

### Get Colors
**`GET /api/products/meta/colors`**

### Get Materials
**`GET /api/products/meta/materials`**

### Create Category
**`POST /api/products/meta/categories`**
```json
{ "name": "Office Furniture" }
```

### Create Color
**`POST /api/products/meta/colors`**
```json
{ "name": "Midnight Blue", "hex": "#191970" }
```

### Create Material
**`POST /api/products/meta/materials`**
```json
{ "name": "Solid Teak" }
```

### Get Product By ID
**`GET /api/products/1`**

### Create Product
**`POST /api/products`**
*(Requires Admin Login)*
```json
{
  "productName": "Ergonomic Desk",
  "categoryId": 2,
  "price": 450.00,
  "quantityLeft": 15,
  "productDescription": "Adjustable height standing desk.",
  "featured": true,
  "imageUrls": ["https://example.com/desk.jpg"],
  "colorIds": [1, 2]
}
```

### Update Product
**`PUT /api/products/1`**
```json
{
  "price": 399.99,
  "featured": false
}
```

### Delete Product
**`DELETE /api/products/1`**

---

## 📂 Cart

### Get Cart
**`GET /api/cart`**

### Add To Cart
**`POST /api/cart`**
```json
{
  "productId": 1,
  "quantity": 2,
  "colorId": 1
}
```

### Update Cart Item Quantity
**`PATCH /api/cart/update`**
```json
{
  "cartId": 10,
  "quantity": 5
}
```

### Remove Cart Item
**`DELETE /api/cart/remove`**
```json
{
  "cartId": 10
}
```

### Clear Cart
**`DELETE /api/cart/clear`**

---

## 📂 Orders

### Create Order
**`POST /api/orders/checkout`**
```json
{
  "shippingAddress": "123 Test St, Bangkok",
  "paymentMethod": "Credit Card"
}
```

### Get My Orders
**`GET /api/orders/my-orders`**

### Get My Order By ID
**`GET /api/orders/my-orders/1`**

---

## 📂 Contact

### Submit Contact Form
**`POST /api/contact`**
```json
{
  "name": "Jane User",
  "email": "jane@example.com",
  "message": "I love your furniture!"
}
```

### Subscribe Newsletter
**`POST /api/newsletter/subscribe`**
```json
{
  "email": "jane@example.com"
}
```

---

## 📂 Admin

### Get Admin Stats
**`GET /api/admin/stats`**

### Get All Orders
**`GET /api/admin/orders`**

### Get Admin Order By ID
**`GET /api/admin/orders/1`**

### Get Members
**`GET /api/admin/members`**

---

## 📂 Utility

### Health Check
**`GET /api/health`**
