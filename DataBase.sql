CREATE DATABASE IF NOT EXISTS BoonSunClon;

USE BoonSunClon;

CREATE TABLE IF NOT EXISTS AdminInformation (
    AdminId INT AUTO_INCREMENT NOT NULL,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Address VARCHAR(100) NOT NULL,
    Age TINYINT NOT NULL,
    Email VARCHAR(50) NOT NULL,
    TelephoneNumber VARCHAR(15) NOT NULL,
    CONSTRAINT AdmInf_Pk PRIMARY KEY (AdminId)
);

CREATE TABLE IF NOT EXISTS AdminLoginInformation (
    AdminId INT NOT NULL,
    AdminUserName VARCHAR(50) NOT NULL,
    AdminPassword VARCHAR(255) NOT NULL,
    Role VARCHAR(50) NOT NULL,
    CONSTRAINT AdmLoginInf_Fk FOREIGN KEY (AdminId) REFERENCES AdminInformation (AdminId) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS AdminLoginLog (
    LogId INT AUTO_INCREMENT NOT NULL,
    AdminId INT NOT NULL,
    LoginTimeStamp DATETIME DEFAULT CURRENT_TIMESTAMP(),
    CONSTRAINT AdmLoginLog_Pk PRIMARY KEY (LogId),
    CONSTRAINT AdmLoginLog_Fk FOREIGN KEY (AdminId) REFERENCES AdminInformation (AdminId) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS AdminToken (
    TokenId INT AUTO_INCREMENT NOT NULL,
    AdminId INT NOT NULL,
    TokenHash VARCHAR(255) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    CreateAt DATETIME DEFAULT CURRENT_TIMESTAMP(),
    RevokeStatus BOOLEAN DEFAULT FALSE,
    CONSTRAINT AdmTkn_Pk PRIMARY KEY (TokenId),
    CONSTRAINT AdmTkn_Fk FOREIGN KEY (AdminId) REFERENCES AdminInformation (AdminId) ON DELETE CASCADE on UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS Category (
    CategoryId INT AUTO_INCREMENT NOT NULL,
    Category VARCHAR(50) NOT NULL,
    CONSTRAINT Cate_Pk PRIMARY KEY (CategoryId)
);

CREATE TABLE IF NOT EXISTS Color (
    ColorId INT AUTO_INCREMENT NOT NULL,
    ColorName VARCHAR(50) NOT NULL,
    HexCode VARCHAR(10) NOT NULL,
    CONSTRAINT Col_Pk PRIMARY KEY (ColorId)
);

CREATE TABLE IF NOT EXISTS Material (
    MaterialId INT AUTO_INCREMENT NOT NULL,
    MaterialName VARCHAR(50) NOT NULL,
    MaterialType VARCHAR(50) NOT NULL,
    CONSTRAINT Mat_Pk PRIMARY KEY (MaterialId)
);

CREATE TABLE IF NOT EXISTS Member (
    MemberId INT AUTO_INCREMENT NOT NULL,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    PhoneNumber VARCHAR(15) NOT NULL,
    MemberEmail VARCHAR(50) NOT NULL,
    CONSTRAINT Memb_Pk PRIMARY KEY (MemberId)
);

CREATE TABLE IF NOT EXISTS MemberLoginInformation (
    MemberId INT NOT NULL,
    MemberPassword VARCHAR(255) NOT NULL,
    CONSTRAINT MemLoginInf_Pk PRIMARY KEY (MemberId),
    CONSTRAINT MemLoginInf_Fk FOREIGN KEY (MemberId) REFERENCES Member (MemberId) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS MemberLoginLog (
    LogId INT AUTO_INCREMENT NOT NULL,
    MemberId INT NOT NULL,
    LoginTimeStamp DATETIME DEFAULT CURRENT_TIMESTAMP(),
    CONSTRAINT MemLoginLog_Pk PRIMARY KEY (LogId),
    CONSTRAINT MemLoginLog_Fk FOREIGN KEY (MemberId) REFERENCES Member (MemberId) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS Address (
    AddressId INT AUTO_INCREMENT NOT NULL,
    MemberId INT NOT NULL,
    AddressDetail VARCHAR(100) NOT NULL,
    CONSTRAINT Addr_Pk PRIMARY KEY (AddressId),
    CONSTRAINT Addr_Fk FOREIGN KEY (MemberId) REFERENCES Member (MemberId) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS Delivery (
    TrackingId INT AUTO_INCREMENT NOT NULL,
    AddressId INT NOT NULL,
    Status VARCHAR(50) NOT NULL,
    CONSTRAINT Del_Pk PRIMARY KEY (TrackingId),
    CONSTRAINT Del_Fk FOREIGN KEY (AddressId) REFERENCES Address (AddressId)
);

CREATE TABLE IF NOT EXISTS Orders (
    OrderId INT AUTO_INCREMENT NOT NULL,
    MemberId INT NOT NULL,
    TrackingId INT NOT NULL,
    ContactEmail VARCHAR(50),
    TotalAmount DECIMAL(10, 2) NOT NULL,
    VatAmount DECIMAL(10, 2) NOT NULL,
    OrderDate DATETIME DEFAULT CURRENT_TIMESTAMP(),
    CONSTRAINT Ord_Pk PRIMARY KEY (OrderId),
    CONSTRAINT OrdMem_Fk FOREIGN KEY (MemberId) REFERENCES Member (MemberId),
    CONSTRAINT OrdTrk_Fk FOREIGN KEY (TrackingId) REFERENCES Delivery (TrackingId)
);

CREATE TABLE IF NOT EXISTS Product (
    ProductId INT AUTO_INCREMENT NOT NULL,
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
    CONSTRAINT Prod_Pk PRIMARY KEY (ProductId),
    CONSTRAINT ProdCate_Fk FOREIGN KEY (CategoryId) REFERENCES Category (CategoryId)
);

CREATE TABLE IF NOT EXISTS Review (
    ReviewId INT AUTO_INCREMENT NOT NULL,
    ProductId INT NOT NULL,
    MemberId INT NOT NULL,
    Rating TINYINT NOT NULL,
    ReviewComment VARCHAR(255),
    CONSTRAINT Review_Pk PRIMARY KEY (ReviewId),
    CONSTRAINT ReviewProd_Fk FOREIGN KEY (ProductId) REFERENCES Product (ProductId),
    CONSTRAINT ReviewMem_Fk FOREIGN KEY (MemberId) REFERENCES Member (MemberId)
);

CREATE TABLE IF NOT EXISTS Image (
    ImageId INT AUTO_INCREMENT NOT NULL,
    ProductId INT NOT NULL,
    ImageUrl VARCHAR(255),
    CONSTRAINT Img_Pk PRIMARY KEY (ImageId),
    CONSTRAINT ImgProd_Fk FOREIGN KEY (ProductId) REFERENCES Product (ProductId)
);

CREATE TABLE IF NOT EXISTS OrderItem (
    ProductId INT NOT NULL,
    OrderId INT NOT NULL,
    ItemQuantity INT NOT NULL,
    CONSTRAINT OrdItm_Pk PRIMARY KEY (ProductId, OrderId)
);

CREATE TABLE IF NOT EXISTS ProductColor (
    ProductId INT NOT NULL,
    ColorId INT NOT NULL,
    CONSTRAINT ProdCol_Pk PRIMARY KEY (ProductId, ColorId)
);

CREATE TABLE IF NOT EXISTS Contactors (
    ContactorId INT AUTO_INCREMENT NOT NULL,
    FirstName VARCHAR(50),
    LastName VARCHAR(50),
    Email VARCHAR(50),
    Message VARCHAR(255),
    CONSTRAINT Contactors_Pk PRIMARY KEY (ContactorId)
);

CREATE TABLE IF NOT EXISTS NewsLetterSubscriber (
    SubscriberId INT AUTO_INCREMENT NOT NULL,
    Email VARCHAR(50),
    CONSTRAINT NLS_Pk PRIMARY KEY (SubscriberId)
);
