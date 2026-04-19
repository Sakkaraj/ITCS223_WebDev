-- PostgreSQL Schema for BoonSonClon Furniture Store
-- Generated from SQLite Schema

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

-- Seed Data (Converted from Content)

INSERT INTO AdminInformation (FirstName, LastName, Address, Age, Email, TelephoneNumber) VALUES ('Admin', 'BoonSon', '999 Phutthamonthon 4 Road, Nakhon Pathom', 30, 'admin@boonsonclon.com', '0696304272');
INSERT INTO AdminLoginInformation (AdminId, AdminUserName, AdminPassword, Role) VALUES (1, 'admin', '$2b$10$qeGhmRLLjsv4X45cC/kSBeEuHyAwPsT72NMXeHmZ3DHSlmIpjGRKW', 'admin');

-- Sample Member
INSERT INTO Member (FirstName, LastName, PhoneNumber, MemberEmail) VALUES ('John', 'Doe', '0812345678', 'john.doe@example.com');
INSERT INTO MemberLoginInformation (MemberId, MemberPassword) VALUES (1, '$2b$10$7Z2Gq7kX2kO9K7kX2kO9Ke2kO9K7kX2kO9K7kX2kO9K7kX2kO9K'); -- password: password123

INSERT INTO Category (Category) VALUES ('Chairs');
INSERT INTO Category (Category) VALUES ('Armchairs');
INSERT INTO Category (Category) VALUES ('Sofas');
INSERT INTO Category (Category) VALUES ('Tables');
INSERT INTO Category (Category) VALUES ('Beds');
INSERT INTO Category (Category) VALUES ('Cabinets');
INSERT INTO Category (Category) VALUES ('Decor');

INSERT INTO Color (ColorName, HexCode) VALUES ('Blue', '#3b82f6');
INSERT INTO Color (ColorName, HexCode) VALUES ('Brown', '#a6866a');
INSERT INTO Color (ColorName, HexCode) VALUES ('Green', '#4ade80');
INSERT INTO Color (ColorName, HexCode) VALUES ('Grey', '#6b7280');
INSERT INTO Color (ColorName, HexCode) VALUES ('White', '#f3f4f6');
INSERT INTO Color (ColorName, HexCode) VALUES ('Black', '#222');

INSERT INTO Material (MaterialName, MaterialType) VALUES ('Solid Wood', 'Natural');
INSERT INTO Material (MaterialName, MaterialType) VALUES ('Metal', 'Industrial');
INSERT INTO Material (MaterialName, MaterialType) VALUES ('Fabric', 'Soft');
INSERT INTO Material (MaterialName, MaterialType) VALUES ('Glass', 'Hard');
INSERT INTO Material (MaterialName, MaterialType) VALUES ('MDF', 'Engineered');
INSERT INTO Material (MaterialName, MaterialType) VALUES ('Ceramic', 'Clay');

INSERT INTO Product (CategoryId, ProductName, Price, QuantityLeft, ProductDescription, ProductDetail, WidthDimension, HeightDimension, LengthDimension, Weight, Featured, Status, CreatedAt, MaterialId) VALUES (1, 'Classic Oak Chair', 119, 20, 'A beautiful handcrafted oak chair designed for maximum comfort.', 'Made from solid oak wood with a smooth finish. Assembly required.', 55, 90, 55, 8, TRUE, 'Active', '2026-04-16 05:16:10', 1);
INSERT INTO Product (CategoryId, ProductName, Price, QuantityLeft, ProductDescription, ProductDetail, WidthDimension, HeightDimension, LengthDimension, Weight, Featured, Status, CreatedAt, MaterialId) VALUES (2, 'Modern Armchair', 249.99, 15, 'Sleek modern armchair upholstered in premium fabric.', 'Available in multiple colors. Solid wood legs. Easy assembly.', 80, 85, 82, 14, TRUE, 'Active', '2026-04-16 05:16:10', 2);
INSERT INTO Product (CategoryId, ProductName, Price, QuantityLeft, ProductDescription, ProductDetail, WidthDimension, HeightDimension, LengthDimension, Weight, Featured, Status, CreatedAt, MaterialId) VALUES (3, 'Comfort Sofa', 799, 8, 'A plush, deep-seated sofa perfect for modern interiors.', 'High-density foam cushions. Removable covers. 3-seater.', 220, 85, 95, 65, TRUE, 'Active', '2026-04-16 05:16:10', 3);
INSERT INTO Product (CategoryId, ProductName, Price, QuantityLeft, ProductDescription, ProductDetail, WidthDimension, HeightDimension, LengthDimension, Weight, Featured, Status, CreatedAt, MaterialId) VALUES (3, 'L-Shape Corner Sofa', 1299, 5, 'Spacious L-shaped corner sofa for the whole family.', 'Premium microfibre. Chaise lounge section. 5-year frame warranty.', 280, 85, 200, 90, FALSE, 'Active', '2026-04-16 05:16:10', 3);
INSERT INTO Product (CategoryId, ProductName, Price, QuantityLeft, ProductDescription, ProductDetail, WidthDimension, HeightDimension, LengthDimension, Weight, Featured, Status, CreatedAt, MaterialId) VALUES (4, 'Coffee Table', 150, 25, 'Minimalist coffee table with tempered glass top.', 'Tempered glass top, iron legs. Wipe clean. Flat-pack delivery.', 110, 45, 60, 18, FALSE, 'Active', '2026-04-16 05:16:10', 1);
INSERT INTO Product (CategoryId, ProductName, Price, QuantityLeft, ProductDescription, ProductDetail, WidthDimension, HeightDimension, LengthDimension, Weight, Featured, Status, CreatedAt, MaterialId) VALUES (4, 'Dining Table Set', 450, 10, '6-person dining table with matching chairs.', 'Solid pine wood. Includes 6 chairs. Easy assembly.', 180, 75, 90, 55, TRUE, 'Active', '2026-04-16 05:16:10', 1);
INSERT INTO Product (CategoryId, ProductName, Price, QuantityLeft, ProductDescription, ProductDetail, WidthDimension, HeightDimension, LengthDimension, Weight, Featured, Status, CreatedAt, MaterialId) VALUES (5, 'King Size Bed Frame', 599, 12, 'Sturdy king size bed frame with slatted base.', 'Solid oak construction. Fits 180x200cm mattress. Assembly required.', 200, 100, 215, 80, FALSE, 'Active', '2026-04-16 05:16:11', 1);
INSERT INTO Product (CategoryId, ProductName, Price, QuantityLeft, ProductDescription, ProductDetail, WidthDimension, HeightDimension, LengthDimension, Weight, Featured, Status, CreatedAt, MaterialId) VALUES (5, 'Storage Bed with Drawers', 849, 6, 'Double bed with 4 integrated storage drawers.', 'Upholstered headboard. Hydraulic lift storage. Fits 160x200cm mattress.', 185, 120, 215, 95, TRUE, 'Active', '2026-04-16 05:16:11', 1);
INSERT INTO Product (CategoryId, ProductName, Price, QuantityLeft, ProductDescription, ProductDetail, WidthDimension, HeightDimension, LengthDimension, Weight, Featured, Status, CreatedAt, MaterialId) VALUES (6, 'Wardrobe Cabinet', 399, 9, '3-door wardrobe with hanging rail and shelves.', 'MDF construction with oak veneer. Mirror door option available.', 150, 200, 58, 70, FALSE, 'Active', '2026-04-16 05:16:11', 5);
INSERT INTO Product (CategoryId, ProductName, Price, QuantityLeft, ProductDescription, ProductDetail, WidthDimension, HeightDimension, LengthDimension, Weight, Featured, Status, CreatedAt, MaterialId) VALUES (6, 'Bookshelf Cabinet', 199, 18, '5-Tier open bookshelf for your study or office.', 'Engineered wood. Adjustable shelves. Easy self-assembly.', 80, 180, 30, 25, FALSE, 'Active', '2026-04-16 05:16:11', 5);
INSERT INTO Product (CategoryId, ProductName, Price, QuantityLeft, ProductDescription, ProductDetail, WidthDimension, HeightDimension, LengthDimension, Weight, Featured, Status, CreatedAt, MaterialId) VALUES (7, 'Table Lamp', 49.99, 50, 'Elegant ceramic table lamp with linen shade.', 'E27 bulb (not included). 1.5m fabric cord. Height: 45cm.', 20, 45, 20, 1.5, FALSE, 'Active', '2026-04-16 05:16:11', 2);
INSERT INTO Product (CategoryId, ProductName, Price, QuantityLeft, ProductDescription, ProductDetail, WidthDimension, HeightDimension, LengthDimension, Weight, Featured, Status, CreatedAt, MaterialId) VALUES (7, 'Decorative Vase Set', 35, 35, 'Set of 3 ceramic vases in complementary sizes.', 'Handcrafted ceramic. Waterproof interior. Sizes: Small, Medium, Large.', 15, 30, 15, 0.8, FALSE, 'Active', '2026-04-16 05:16:11', 6);

INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (1, 'assets/images/chair.avif', 0);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (2, 'assets/images/new-product/chair1.avif', 0);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (2, 'assets/images/new-product/chair-blue.jpeg', 1);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (2, 'assets/images/new-product/chair-brown.jpeg', 2);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (3, 'assets/images/new-product/sofa-grey.jpeg', 0);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (3, 'assets/images/new-product/sofa-green.jpg', 1);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (3, 'assets/images/new-product/sofa-brown.png', 2);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (4, 'assets/images/sofa.avif', 0);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (5, 'assets/images/table.avif', 0);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (6, 'assets/images/new-product/table.jpg', 0);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (6, 'assets/images/new-product/table1.jpeg', 1);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (6, 'assets/images/new-product/table2.jpeg', 2);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (7, 'https://www.laura-james.co.uk/cdn/shop/files/cavill-grey-fabric-bed-frame-upholstered-king-size-laura-james-1.png?v=1753187376&width=1445', 0);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (8, 'https://au.tommyswiss.com/cdn/shop/files/bf053_cc_dr_wire1a.jpg?v=1725926683', 0);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (9, 'assets/images/best-seller/img4.avif', 0);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (10, 'https://eurekaergonomic.com/cdn/shop/files/Walnut_Napa_Wood_Bookcase_Cabinet_Bottom_Storage_Adjustable_Book_Shelves.jpg?v=1747809436&width=1946', 0);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (11, 'https://www.ikea.com/th/en/images/products/flyghoejd-table-lamp-brass-beige__1244487_pe921207_s5.jpg', 0);
INSERT INTO Image (ProductId, ImageUrl, SortOrder) VALUES (12, 'https://m.media-amazon.com/images/I/8110Qq9US-L.jpg', 0);

INSERT INTO ProductColor (ProductId, ColorId, SortOrder) VALUES (2, 4, 1);
INSERT INTO ProductColor (ProductId, ColorId, SortOrder) VALUES (2, 1, 2);
INSERT INTO ProductColor (ProductId, ColorId, SortOrder) VALUES (2, 2, 3);
INSERT INTO ProductColor (ProductId, ColorId, SortOrder) VALUES (3, 2, 1);
INSERT INTO ProductColor (ProductId, ColorId, SortOrder) VALUES (3, 3, 2);
INSERT INTO ProductColor (ProductId, ColorId, SortOrder) VALUES (3, 4, 3);
INSERT INTO ProductColor (ProductId, ColorId, SortOrder) VALUES (6, 5, 1);
INSERT INTO ProductColor (ProductId, ColorId, SortOrder) VALUES (6, 2, 2);
INSERT INTO ProductColor (ProductId, ColorId, SortOrder) VALUES (6, 6, 3);
