/*
  sec2_gr14_database.sql — BoonSonClon Master Relational Schema
  Purpose: Defines the comprehensive PostgreSQL database architecture, 
           including optimized transactional tables for product management, 
           authentication logs, and order fulfillment.
*/

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS NewsLetterSubscriber;
DROP TABLE IF EXISTS Contactors;
DROP TABLE IF EXISTS ProductColor;
DROP TABLE IF EXISTS OrderItem;
DROP TABLE IF EXISTS Image;
DROP TABLE IF EXISTS Review;
DROP TABLE IF EXISTS Product;
DROP TABLE IF EXISTS Delivery;
DROP TABLE IF EXISTS Address;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS MemberLoginLog;
DROP TABLE IF EXISTS MemberLoginInformation;
DROP TABLE IF EXISTS Member;
DROP TABLE IF EXISTS Material;
DROP TABLE IF EXISTS Color;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS AdminToken;
DROP TABLE IF EXISTS AdminLoginLog;
DROP TABLE IF EXISTS AdminLoginInformation;
DROP TABLE IF EXISTS AdminInformation;
DROP TABLE IF EXISTS "session";

CREATE TABLE AdminInformation (
    AdminId SERIAL PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Address VARCHAR(100) NOT NULL,
    Age SMALLINT NOT NULL,
    Email VARCHAR(50) NOT NULL,
    TelephoneNumber VARCHAR(15) NOT NULL
);

-- For express-session (connect-pg-simple)
CREATE TABLE "session" (
  "sid" varchar NOT NULL PRIMARY KEY,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
);

CREATE INDEX "IDX_session_expire" ON "session" ("expire");

CREATE TABLE AdminLoginInformation (
    AdminId INT NOT NULL,
    AdminUserName VARCHAR(50) NOT NULL,
    AdminPassword VARCHAR(255) NOT NULL,
    Role VARCHAR(50) NOT NULL,
    CONSTRAINT AdmLoginInf_Fk FOREIGN KEY (AdminId) REFERENCES AdminInformation (AdminId) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE AdminLoginLog (
    LogId SERIAL PRIMARY KEY,
    AdminId INT NOT NULL,
    LoginTimeStamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT AdmLoginLog_Fk FOREIGN KEY (AdminId) REFERENCES AdminInformation (AdminId) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE AdminToken (
    TokenId SERIAL PRIMARY KEY,
    AdminId INT NOT NULL,
    TokenHash VARCHAR(255) NOT NULL,
    ExpiresAt TIMESTAMP NOT NULL,
    CreateAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    RevokeStatus BOOLEAN DEFAULT FALSE,
    CONSTRAINT AdmTkn_Fk FOREIGN KEY (AdminId) REFERENCES AdminInformation (AdminId) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Category (
    CategoryId SERIAL PRIMARY KEY,
    Category VARCHAR(50) NOT NULL
);

CREATE TABLE Color (
    ColorId SERIAL PRIMARY KEY,
    ColorName VARCHAR(50) NOT NULL,
    HexCode VARCHAR(10) NOT NULL
);

CREATE TABLE Material (
    MaterialId SERIAL PRIMARY KEY,
    MaterialName VARCHAR(50) NOT NULL,
    MaterialType VARCHAR(50) NOT NULL
);

CREATE TABLE Member (
    MemberId SERIAL PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    PhoneNumber VARCHAR(15) NOT NULL,
    MemberEmail VARCHAR(50) NOT NULL
);

CREATE TABLE MemberLoginInformation (
    MemberId INT NOT NULL PRIMARY KEY,
    MemberPassword VARCHAR(255) NOT NULL,
    CONSTRAINT MemLoginInf_Fk FOREIGN KEY (MemberId) REFERENCES Member (MemberId) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE MemberLoginLog (
    LogId SERIAL PRIMARY KEY,
    MemberId INT NOT NULL,
    LoginTimeStamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT MemLoginLog_Fk FOREIGN KEY (MemberId) REFERENCES Member (MemberId) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Address (
    AddressId SERIAL PRIMARY KEY,
    MemberId INT NOT NULL,
    AddressDetail VARCHAR(255) NOT NULL,
    CONSTRAINT Addr_Fk FOREIGN KEY (MemberId) REFERENCES Member (MemberId) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE Delivery (
    TrackingId SERIAL PRIMARY KEY,
    AddressId INT NOT NULL,
    Status VARCHAR(50) NOT NULL,
    CONSTRAINT Del_Fk FOREIGN KEY (AddressId) REFERENCES Address (AddressId) ON DELETE CASCADE
);

CREATE TABLE Orders (
    OrderId SERIAL PRIMARY KEY,
    MemberId INT NOT NULL,
    TrackingId INT NOT NULL,
    ContactEmail VARCHAR(50),
    TotalAmount DECIMAL(10, 2) NOT NULL,
    VatAmount DECIMAL(10, 2) NOT NULL,
    ShippingAmount DECIMAL(10, 2) DEFAULT 0,
    OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT OrdMem_Fk FOREIGN KEY (MemberId) REFERENCES Member (MemberId) ON DELETE RESTRICT,
    CONSTRAINT OrdTrk_Fk FOREIGN KEY (TrackingId) REFERENCES Delivery (TrackingId) ON DELETE CASCADE
);

CREATE TABLE Product (
    ProductId SERIAL PRIMARY KEY,
    CategoryId INT NOT NULL,
    ProductName VARCHAR(100) NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    QuantityLeft INT DEFAULT 0,
    ProductDescription VARCHAR(255) NOT NULL,
    ProductDetail VARCHAR(255) NOT NULL,
    WidthDimension DECIMAL(7, 2) DEFAULT 0,
    HeightDimension DECIMAL(7, 2) DEFAULT 0,
    LengthDimension DECIMAL(7, 2) DEFAULT 0,
    Weight DECIMAL(7, 2) DEFAULT 0,
    Featured BOOLEAN DEFAULT FALSE,
    Status VARCHAR(20) DEFAULT 'Active',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    MaterialId INT,
    CONSTRAINT ProdCate_Fk FOREIGN KEY (CategoryId) REFERENCES Category (CategoryId) ON DELETE RESTRICT,
    CONSTRAINT ProdMat_Fk FOREIGN KEY (MaterialId) REFERENCES Material (MaterialId) ON DELETE SET NULL
);

CREATE TABLE Review (
    ReviewId SERIAL PRIMARY KEY,
    ProductId INT NOT NULL,
    MemberId INT NOT NULL,
    Rating SMALLINT NOT NULL,
    ReviewComment VARCHAR(255),
    CONSTRAINT ReviewProd_Fk FOREIGN KEY (ProductId) REFERENCES Product (ProductId) ON DELETE CASCADE,
    CONSTRAINT ReviewMem_Fk FOREIGN KEY (MemberId) REFERENCES Member (MemberId) ON DELETE CASCADE
);

CREATE TABLE Image (
    ImageId SERIAL PRIMARY KEY,
    ProductId INT NOT NULL,
    ImageUrl VARCHAR(255),
    SortOrder INTEGER DEFAULT 0,
    CONSTRAINT ImgProd_Fk FOREIGN KEY (ProductId) REFERENCES Product (ProductId) ON DELETE CASCADE
);

CREATE TABLE OrderItem (
    OrderItemId SERIAL PRIMARY KEY,
    ProductId INT NOT NULL,
    OrderId INT NOT NULL,
    ItemQuantity INT NOT NULL,
    ColorName VARCHAR(50),
    MaterialName VARCHAR(50),
    CONSTRAINT OrdItmProd_Fk FOREIGN KEY (ProductId) REFERENCES Product (ProductId) ON DELETE RESTRICT,
    CONSTRAINT OrdItmOrd_Fk FOREIGN KEY (OrderId) REFERENCES Orders (OrderId) ON DELETE CASCADE
);

CREATE TABLE ProductColor (
    ProductId INT NOT NULL,
    ColorId INT NOT NULL,
    SortOrder INTEGER DEFAULT 0,
    PRIMARY KEY (ProductId, ColorId),
    CONSTRAINT ProdColProd_Fk FOREIGN KEY (ProductId) REFERENCES Product (ProductId) ON DELETE CASCADE,
    CONSTRAINT ProdColCol_Fk FOREIGN KEY (ColorId) REFERENCES Color (ColorId) ON DELETE CASCADE
);

CREATE TABLE Contactors (
    ContactorId SERIAL PRIMARY KEY,
    FirstName VARCHAR(50),
    LastName VARCHAR(50),
    Email VARCHAR(100),
    Message TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE NewsLetterSubscriber (
    SubscriberId SERIAL PRIMARY KEY,
    Email VARCHAR(50)
);

-- Seed Data (Comprehensive Phase I Population)

-- 1. Admin Information (10 Records)
INSERT INTO AdminInformation (FirstName, LastName, Address, Age, Email, TelephoneNumber) VALUES 
('Admin', 'BoonSon', '999 Phutthamonthon 4 Road, Nakhon Pathom', 30, 'admin@boonsonclon.com', '0696304272'),
('Somsak', 'Pornprasert', '123 Sukhumvit Rd, Bangkok', 45, 'somsak.p@boonsonclon.com', '0812345671'),
('Wichai', 'Rattana', '456 Rama II Rd, Bangkok', 38, 'wichai.r@boonsonclon.com', '0812345672'),
('Ananda', 'Siri', '789 Nimman Rd, Chiang Mai', 32, 'ananda.s@boonsonclon.com', '0812345673'),
('Patchara', 'Kwan', '101 Mittraphap Rd, Khon Kaen', 29, 'patchara.k@boonsonclon.com', '0812345674'),
('Malee', 'Thong', '202 Beach Rd, Pattaya', 41, 'malee.t@boonsonclon.com', '0812345675'),
('Kittisak', 'Chai', '303 Old Town, Phuket', 35, 'kittisak.c@boonsonclon.com', '0812345676'),
('Nattapon', 'Dee', '404 Industrial Park, Rayong', 27, 'nattapon.d@boonsonclon.com', '0812345677'),
('Preecha', 'Sang', '505 Riverside, Ayutthaya', 50, 'preecha.s@boonsonclon.com', '0812345678'),
('Siriporn', 'Manee', '606 Mountain View, Khao Yai', 33, 'siriporn.m@boonsonclon.com', '0812345679');

-- 2. Admin Login Information (10 Records)
-- All passwords are 'password123' hashed: $2b$10$qeGhmRLLjsv4X45cC/kSBeEuHyAwPsT72NMXeHmZ3DHSlmIpjGRKW
INSERT INTO AdminLoginInformation (AdminId, AdminUserName, AdminPassword, Role) VALUES 
(1, 'admin', '$2b$10$qeGhmRLLjsv4X45cC/kSBeEuHyAwPsT72NMXeHmZ3DHSlmIpjGRKW', 'SuperAdmin'),
(2, 'somsak_p', '$2b$10$qeGhmRLLjsv4X45cC/kSBeEuHyAwPsT72NMXeHmZ3DHSlmIpjGRKW', 'Manager'),
(3, 'wichai_r', '$2b$10$qeGhmRLLjsv4X45cC/kSBeEuHyAwPsT72NMXeHmZ3DHSlmIpjGRKW', 'Inventory'),
(4, 'ananda_s', '$2b$10$qeGhmRLLjsv4X45cC/kSBeEuHyAwPsT72NMXeHmZ3DHSlmIpjGRKW', 'Sales'),
(5, 'patchara_k', '$2b$10$qeGhmRLLjsv4X45cC/kSBeEuHyAwPsT72NMXeHmZ3DHSlmIpjGRKW', 'Support'),
(6, 'malee_t', '$2b$10$qeGhmRLLjsv4X45cC/kSBeEuHyAwPsT72NMXeHmZ3DHSlmIpjGRKW', 'Manager'),
(7, 'kittisak_c', '$2b$10$qeGhmRLLjsv4X45cC/kSBeEuHyAwPsT72NMXeHmZ3DHSlmIpjGRKW', 'Inventory'),
(8, 'nattapon_d', '$2b$10$qeGhmRLLjsv4X45cC/kSBeEuHyAwPsT72NMXeHmZ3DHSlmIpjGRKW', 'Sales'),
(9, 'preecha_s', '$2b$10$qeGhmRLLjsv4X45cC/kSBeEuHyAwPsT72NMXeHmZ3DHSlmIpjGRKW', 'Support'),
(10, 'siriporn_m', '$2b$10$qeGhmRLLjsv4X45cC/kSBeEuHyAwPsT72NMXeHmZ3DHSlmIpjGRKW', 'SuperAdmin');

-- 3. Admin Login Logs (10 Records)
INSERT INTO AdminLoginLog (AdminId, LoginTimeStamp) VALUES 
(1, '2026-04-27 10:00:00'),
(2, '2026-04-26 10:00:00'),
(3, '2026-04-25 10:00:00'),
(4, '2026-04-24 10:00:00'),
(5, '2026-04-23 10:00:00'),
(1, '2026-04-22 10:00:00'),
(6, '2026-04-21 10:00:00'),
(7, '2026-04-20 10:00:00'),
(8, '2026-04-19 10:00:00'),
(10, '2026-04-18 10:00:00');

-- 4. Admin Tokens (10 Records)
INSERT INTO AdminToken (AdminId, TokenHash, ExpiresAt, CreateAt, RevokeStatus) VALUES 
(1, 'hash_token_1', '2026-04-30 10:00:00', CURRENT_TIMESTAMP, FALSE),
(2, 'hash_token_2', '2026-04-30 10:00:00', CURRENT_TIMESTAMP, FALSE),
(3, 'hash_token_3', '2026-04-30 10:00:00', CURRENT_TIMESTAMP, FALSE),
(4, 'hash_token_4', '2026-04-30 10:00:00', CURRENT_TIMESTAMP, FALSE),
(5, 'hash_token_5', '2026-04-30 10:00:00', CURRENT_TIMESTAMP, FALSE),
(6, 'hash_token_6', '2026-04-30 10:00:00', CURRENT_TIMESTAMP, FALSE),
(7, 'hash_token_7', '2026-04-30 10:00:00', CURRENT_TIMESTAMP, FALSE),
(8, 'hash_token_8', '2026-04-30 10:00:00', CURRENT_TIMESTAMP, FALSE),
(9, 'hash_token_9', '2026-04-30 10:00:00', CURRENT_TIMESTAMP, FALSE),
(10, 'hash_token_10', '2026-04-30 10:00:00', CURRENT_TIMESTAMP, FALSE);

-- 5. Categories (10 Records)
INSERT INTO Category (Category) VALUES 
('Chairs'), ('Armchairs'), ('Sofas'), ('Tables'), ('Beds'), 
('Cabinets'), ('Decor'), ('Lighting'), ('Rugs'), ('Office');

-- 6. Colors (11 Unique Records - Duplicates Removed)
INSERT INTO Color (ColorName, HexCode) VALUES 
('Blue', '#3b82f6'), ('Brown', '#a6866a'), ('Green', '#4ade80'), 
('Grey', '#6b7280'), ('White', '#f3f4f6'), ('Black', '#222222'),
('Red', '#ff0000'), ('Yellow', '#ffff00'), ('Pink', '#ff00ff'), 
('Orange', '#ff8000'), ('Purple', '#800080');

-- 7. Materials (10 Records)
INSERT INTO Material (MaterialName, MaterialType) VALUES 
('Solid Wood', 'Natural'), ('Metal', 'Industrial'), ('Fabric', 'Soft'), 
('Glass', 'Hard'), ('MDF', 'Engineered'), ('Ceramic', 'Clay'),
('Leather', 'Animal'), ('Marble', 'Stone'), ('Plastic', 'Synthetic'), ('Velvet', 'Luxury');

-- 8. Members (10 Records)
INSERT INTO Member (FirstName, LastName, PhoneNumber, MemberEmail) VALUES 
('John', 'Doe', '0812345678', 'john.doe@example.com'),
('Jane', 'Smith', '0812345679', 'jane.smith@example.com'),
('Alice', 'Johnson', '0812345680', 'alice.j@example.com'),
('Bob', 'Brown', '0812345681', 'bob.b@example.com'),
('Charlie', 'Davis', '0812345682', 'charlie.d@example.com'),
('Emily', 'Wilson', '0812345683', 'emily.w@example.com'),
('Frank', 'Miller', '0812345684', 'frank.m@example.com'),
('Grace', 'Lee', '0812345685', 'grace.l@example.com'),
('Henry', 'Taylor', '0812345686', 'henry.t@example.com'),
('Ivy', 'Anderson', '0812345687', 'ivy.a@example.com');

-- 9. Member Login Information (10 Records)
-- All passwords are 'password123'
INSERT INTO MemberLoginInformation (MemberId, MemberPassword) VALUES 
(1, '$2b$10$7Z2Gq7kX2kO9K7kX2kO9Ke2kO9K7kX2kO9K7kX2kO9K7kX2kO9K'),
(2, '$2b$10$7Z2Gq7kX2kO9K7kX2kO9Ke2kO9K7kX2kO9K7kX2kO9K7kX2kO9K'),
(3, '$2b$10$7Z2Gq7kX2kO9K7kX2kO9Ke2kO9K7kX2kO9K7kX2kO9K7kX2kO9K'),
(4, '$2b$10$7Z2Gq7kX2kO9K7kX2kO9Ke2kO9K7kX2kO9K7kX2kO9K7kX2kO9K'),
(5, '$2b$10$7Z2Gq7kX2kO9K7kX2kO9Ke2kO9K7kX2kO9K7kX2kO9K7kX2kO9K'),
(6, '$2b$10$7Z2Gq7kX2kO9K7kX2kO9Ke2kO9K7kX2kO9K7kX2kO9K7kX2kO9K'),
(7, '$2b$10$7Z2Gq7kX2kO9K7kX2kO9Ke2kO9K7kX2kO9K7kX2kO9K7kX2kO9K'),
(8, '$2b$10$7Z2Gq7kX2kO9K7kX2kO9Ke2kO9K7kX2kO9K7kX2kO9K7kX2kO9K'),
(9, '$2b$10$7Z2Gq7kX2kO9K7kX2kO9Ke2kO9K7kX2kO9K7kX2kO9K7kX2kO9K'),
(10, '$2b$10$7Z2Gq7kX2kO9K7kX2kO9Ke2kO9K7kX2kO9K7kX2kO9K7kX2kO9K');

-- 10. Member Login Logs (10 Records)
INSERT INTO MemberLoginLog (MemberId, LoginTimeStamp) VALUES 
(1, '2026-04-28 09:00:00'),
(2, '2026-04-28 08:00:00'),
(3, '2026-04-28 07:00:00'),
(4, '2026-04-28 06:00:00'),
(5, '2026-04-28 05:00:00'),
(6, '2026-04-28 04:00:00'),
(7, '2026-04-28 03:00:00'),
(8, '2026-04-28 02:00:00'),
(9, '2026-04-28 01:00:00'),
(10, '2026-04-27 23:00:00');

-- 11. Addresses (10 Records)
INSERT INTO Address (MemberId, AddressDetail) VALUES 
(1, '123 Maple St, Springfield'),
(2, '456 Oak Ave, Metropolis'),
(3, '789 Pine Ln, Gotham City'),
(4, '101 Cedar Rd, Star City'),
(5, '202 Birch Dr, Central City'),
(6, '303 Elm St, Coast City'),
(7, '404 Walnut Blvd, Bludhaven'),
(8, '505 Cherry Ct, National City'),
(9, '606 Willow Way, Hill Valley'),
(10, '707 Ash Rd, Twin Peaks');

-- 12. Deliveries (10 Records)
INSERT INTO Delivery (AddressId, Status) VALUES 
(1, 'Delivered'), (2, 'Shipped'), (3, 'Processing'), (4, 'Delivered'), (5, 'Pending'),
(6, 'Shipped'), (7, 'Delivered'), (8, 'Cancelled'), (9, 'Processing'), (10, 'Delivered');

-- 13. Products (12 Records)
INSERT INTO Product (CategoryId, ProductName, Price, QuantityLeft, ProductDescription, ProductDetail, WidthDimension, HeightDimension, LengthDimension, Weight, Featured, Status, CreatedAt, MaterialId) VALUES 
(1, 'Classic Oak Chair', 119.00, 20, 'Handcrafted oak chair.', 'Solid oak, smooth finish.', 55, 90, 55, 8, TRUE, 'Active', '2026-04-16 05:16:10', 1),
(2, 'Modern Armchair', 249.99, 15, 'Sleek armchair.', 'Premium fabric, wood legs.', 80, 85, 82, 14, TRUE, 'Active', '2026-04-16 05:16:10', 2),
(3, 'Comfort Sofa', 799.00, 8, 'Plush 3-seater sofa.', 'High-density foam.', 220, 85, 95, 65, TRUE, 'Active', '2026-04-16 05:16:10', 3),
(3, 'L-Shape Corner Sofa', 1299.00, 5, 'Spacious corner sofa.', 'Premium microfibre.', 280, 85, 200, 90, FALSE, 'Active', '2026-04-16 05:16:10', 3),
(4, 'Coffee Table', 150.00, 25, 'Minimalist table.', 'Tempered glass, iron legs.', 110, 45, 60, 18, FALSE, 'Active', '2026-04-16 05:16:10', 1),
(4, 'Dining Table Set', 450.00, 10, '6-person dining set.', 'Solid pine wood.', 180, 75, 90, 55, TRUE, 'Active', '2026-04-16 05:16:10', 1),
(5, 'King Size Bed Frame', 599.00, 12, 'Sturdy bed frame.', 'Solid oak construction.', 200, 100, 215, 80, FALSE, 'Active', '2026-04-16 05:16:11', 1),
(5, 'Storage Bed with Drawers', 849.00, 6, 'Double bed with 4 drawers.', 'Upholstered, hydraulic lift.', 185, 120, 215, 95, TRUE, 'Active', '2026-04-16 05:16:11', 1),
(6, 'Wardrobe Cabinet', 399.00, 9, '3-door wardrobe.', 'MDF, oak veneer.', 150, 200, 58, 70, FALSE, 'Active', '2026-04-16 05:16:11', 5),
(6, 'Bookshelf Cabinet', 199.00, 18, '5-Tier open bookshelf.', 'Engineered wood.', 80, 180, 30, 25, FALSE, 'Active', '2026-04-16 05:16:11', 5),
(7, 'Table Lamp', 49.99, 50, 'Elegant ceramic lamp.', 'Linen shade, E27 bulb.', 20, 45, 20, 1.5, FALSE, 'Active', '2026-04-16 05:16:11', 2),
(7, 'Decorative Vase Set', 35.00, 35, 'Set of 3 vases.', 'Handcrafted ceramic.', 15, 30, 15, 0.8, FALSE, 'Active', '2026-04-16 05:16:11', 6);

-- 14. Orders (10 Records)
INSERT INTO Orders (MemberId, TrackingId, ContactEmail, TotalAmount, VatAmount, ShippingAmount) VALUES 
(1, 1, 'john.doe@example.com', 119.00, 8.33, 10.00),
(2, 2, 'jane.smith@example.com', 249.99, 17.50, 15.00),
(3, 3, 'alice.j@example.com', 799.00, 55.93, 50.00),
(4, 4, 'bob.b@example.com', 150.00, 10.50, 20.00),
(5, 5, 'charlie.d@example.com', 450.00, 31.50, 30.00),
(6, 6, 'emily.w@example.com', 599.00, 41.93, 40.00),
(7, 7, 'frank.m@example.com', 35.00, 2.45, 5.00),
(8, 8, 'grace.l@example.com', 49.99, 3.50, 5.00),
(9, 9, 'henry.t@example.com', 399.00, 27.93, 25.00),
(10, 10, 'ivy.a@example.com', 849.00, 59.43, 60.00);

-- 15. Order Items (10 Records)
INSERT INTO OrderItem (ProductId, OrderId, ItemQuantity, ColorName, MaterialName) VALUES 
(1, 1, 1, 'Brown', 'Solid Wood'),
(2, 2, 1, 'Blue', 'Fabric'),
(3, 3, 1, 'Grey', 'Fabric'),
(5, 4, 1, 'White', 'Glass'),
(6, 5, 1, 'Brown', 'Solid Wood'),
(7, 6, 1, 'White', 'Solid Wood'),
(12, 7, 1, 'White', 'Ceramic'),
(11, 8, 1, 'Grey', 'Metal'),
(9, 9, 1, 'Brown', 'MDF'),
(8, 10, 1, 'Grey', 'Fabric');

-- 16. Reviews (10 Records)
INSERT INTO Review (ProductId, MemberId, Rating, ReviewComment) VALUES 
(1, 1, 5, 'Excellent quality chair!'),
(2, 2, 4, 'Very comfortable, but assembly took some time.'),
(3, 3, 5, 'Best sofa I have ever owned.'),
(4, 4, 3, 'A bit smaller than expected but looks good.'),
(5, 5, 5, 'Perfect minimalist coffee table.'),
(6, 6, 4, 'Great dining set for the price.'),
(7, 7, 5, 'Sturdy and beautiful bed frame.'),
(8, 8, 2, 'Missing some screws in the package.'),
(9, 9, 4, 'Spacious wardrobe, fits everything.'),
(10, 10, 5, 'Perfect for my home office.');

-- 17. Images (10+ Records)
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES 
(1, 'assets/images/chair.avif', 0),
(2, 'assets/images/new-product/chair1.avif', 0),
(2, 'assets/images/new-product/chair-blue.jpeg', 1),
(2, 'assets/images/new-product/chair-brown.jpeg', 2),
(3, 'assets/images/new-product/sofa-grey.jpeg', 0),
(3, 'assets/images/new-product/sofa-green.jpg', 1),
(3, 'assets/images/new-product/sofa-brown.png', 2),
(4, 'assets/images/sofa.avif', 0),
(5, 'assets/images/table.avif', 0),
(6, 'assets/images/new-product/table.jpg', 0),
(6, 'assets/images/new-product/table1.jpeg', 1),
(6, 'assets/images/new-product/table2.jpeg', 2),
(7, 'https://www.laura-james.co.uk/cdn/shop/files/cavill-grey-fabric-bed-frame-upholstered-king-size-laura-james-1.png?v=1753187376&width=1445', 0),
(8, 'https://au.tommyswiss.com/cdn/shop/files/bf053_cc_dr_wire1a.jpg?v=1725926683', 0),
(9, 'assets/images/best-seller/img4.avif', 0),
(10, 'https://eurekaergonomic.com/cdn/shop/files/Walnut_Napa_Wood_Bookcase_Cabinet_Bottom_Storage_Adjustable_Book_Shelves.jpg?v=1747809436&width=1946', 0),
(11, 'https://www.ikea.com/th/en/images/products/flyghoejd-table-lamp-brass-beige__1244487_pe921207_s5.jpg', 0),
(12, 'https://m.media-amazon.com/images/I/8110Qq9US-L.jpg', 0);

-- 18. Product Colors (10+ Records)
INSERT INTO ProductColor (ProductId, ColorId, SortOrder) VALUES 
(2, 4, 1), (2, 1, 2), (2, 2, 3), 
(3, 2, 1), (3, 3, 2), (3, 4, 3),
(6, 5, 1), (6, 2, 2), (6, 6, 3),
(1, 2, 1), (5, 5, 1), (11, 4, 1);

-- 19. Contactors (10 Records)
INSERT INTO Contactors (FirstName, LastName, Email, Message) VALUES 
('John', 'Smith', 'john.smith@gmail.com', 'Do you offer bulk discounts?'),
('Jane', 'Doe', 'jane.doe@yahoo.com', 'I am interested in the Comfort Sofa.'),
('Mark', 'Wilson', 'mark.w@outlook.com', 'Can you deliver to Chiang Mai?'),
('Sarah', 'Brown', 'sarah.b@gmail.com', 'I have a question about the wardrobe dimensions.'),
('David', 'Lee', 'david.l@gmail.com', 'When will the L-Shape sofa be back in stock?'),
('Emily', 'Chen', 'emily.c@gmail.com', 'Great products, I love the design!'),
('Kevin', 'Park', 'kevin.p@gmail.com', 'Is assembly service available in Bangkok?'),
('Linda', 'Garcia', 'linda.g@gmail.com', 'I want to change my delivery address.'),
('Chris', 'Martin', 'chris.m@gmail.com', 'The table lamp is beautiful.'),
('Sophia', 'Lee', 'sophia.l@gmail.com', 'Thank you for the quick support!');

-- 20. Newsletter Subscribers (10 Records)
INSERT INTO NewsLetterSubscriber (Email) VALUES 
('sub1@example.com'), ('sub2@example.com'), ('sub3@example.com'), 
('sub4@example.com'), ('sub5@example.com'), ('sub6@example.com'), 
('sub7@example.com'), ('sub8@example.com'), ('sub9@example.com'), ('sub10@example.com');

