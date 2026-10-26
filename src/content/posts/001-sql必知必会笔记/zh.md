---
title: SQL必知必会笔记
date: 2017-05-28T19:04:44.000Z
lang: zh
kind: old-notes
maturity: mature
tags:
  - Data Analyst
legacyPaths:
  - /zh/posts/001-sql必知必会笔记/
topics: [product]
titleEn: "Notes on “SQL in 10 Minutes”"
---
> Sams Teach Yourself SQL in 10 Minutes - Fourth Edition
> 语句备份，方便查阅，SQL Server版本
- 检索数据
- 排序数据
- 过滤语句
- 模糊过滤
- 字段计算
- 函数
- 分组数据
- 嵌套查询
- 连接表
- 组合查询
- 插入数据
- 更新删除数据
- 创建和操纵类
- 使用视图
- 使用存储过程(批处理)
- 管理事务处理（transaction processing）
- 使用游标
- 高级SQL特性
  - 约束
  - 索引
  - 触发器

<!-- more -->



# 检索数据
> SELECT语句

```SQL
检索单个列
SELECT column_name FROM tablename;

检索多个列
SELECT col_name1, col_name2 FROM tablename;

检索所有列
SELECT * from tablename;

检索不同的值, 使用 DISTINCT关键词
SELECT DISTINCT col_name1 FROM tablename;
注意：DISTINCT关键字用于所有的列，不仅仅是跟在其后的那一列。

返回前五行结果
SELECT top 5 prod_name
FROM Products

使用注释
----注释的方法---
  /* 这是注释
  的方法2 */
```

# 排序数据
> ORDER BY 语句
```SQL
--注意：在指定一条ORDER BY子句时，应该保证它是SELECT语句中最后一条子句--
SELECT col_name 
FROM tablename 
ORDER BY col_name

--多列排序--
SELECT col_name1, col_name2, col_name3 
FROM tablename ORDER 
BY col_name1, col_name2;

--降序排列--
SELECT col_name1, col_name2, col_name3 
FROM tablename 
ORDER BY col_name1 DESC, col_name2;

```

# 过滤语句
> WHERE 语句

```
SELECT col_name1, col_name2 FROM tablename WHERE col_name1 = 3.49;
SELECT col_name, col_name2 FROM tablename WHERE co_name2 BETWEEN 5 AND 10;
SELECT col_name FROM tablename WHERE col_name IS NULL;

--AND语句---
SELECT col_name1, col_name2, col_name3 
FROM tablename 
WHERE col_name1='ABC' AND col_name2 <= 4

--OR语句---
SELECT col_name1, col_name2, col_name3 
FROM tablename 
WHERE col_name1='ABC' OR col_name2 <= 4

--注意：SQL在处理OR操作符前，优先处理AND操作符。使用圆括号即可解决此问题。
SELECT prod_name, prod_price
FROM Products
WHERE (vend_id = 'DLL01' OR vend_id = ‘BRS01’) AND  prod_price >= 10;

--IN语句，与OR语句相当，但是速度更快，而且可以嵌套SELECT语句
SELECT prod_name, prod_price 
FROM Products 
WHERE vend_in IN ('DLL01', 'BSLKJL') 
ORDER BY prod_name;

--NOT语句，与<>类似，但是可以与IN配合使用完成更为复杂的筛选--
SELECT prod_name 
FROM Products 
WHERE NOT vend_id='DLL01' 
ORDER BY prod_name;
```

# 模糊过滤
> LIKE 

```
---%表示任何字符出现任意次数,%还能匹配0个字符,注意：%不能匹配NULL;需要注意前后的空格---
SELECT prod_id, pro_name FROM Products WHERE prod_name LIKE 'Fish%';
SELECT prod_id, prod_name FROM Products WHERE prod_name LIKE '%bean bag%';+
SELECT prod_id, prod_name FROM Products WHERE prod_name LIKE 'F%y';

--下划线匹配单个字符--------------
SELECT prodid, prodname 
FROM Products
WHERE prod_name LIKE '__inch teddy bear';

--方括号[]匹配一个字符的可能选项，只有Access和SQL Server中才可以用--
--例如匹配J或M开头的任意cust_contact--
SELECT cust_contact
FROM Customers
WHERE cust_contact LIKE '[JM]%' 
ORDER BY cust_contact

--方括号通配符可以使用^来否定--
SELECT cust_contact
FROM Customers
WHERE cust_contact LIKE '[^JM]%' 
ORDER BY cust_contact

--上面的例子可以直接用NOT来重写--
SELECT cust_contact
FROM Customers
WHERE NOT cust_contact LIKE '[JM]%' 
ORDER BY cust_contact

```

- 不要过度使用通配符。如果其他操作符能达到相同的目的，应该使用其他操作符。
- 在确实需要使用通配符时，也尽量不要把它们用在搜索模式的开始处。把通配符置于开始处，搜索起来是最慢的。
- 仔细注意通配符的位置。如果放错地方，可能不会返回想要的数据。

# 字段计算
> +号连接字段
```
--拼接字段--
--Access和SQL  Server使用+号。DB2、Oracle、PostgreSQL、SQLite和Open Office Base使用||。详细请参阅具体的DBMS文档。
--大多数DBMS都支持RT RIM()（正如刚才所见，它去掉字符串右边的空格）、LT RIM()（去掉字符串左边的空格）以及T RIM()（去掉字符串
左右两边的空格）。
SELECT RTRIM(vend_name)+'('+RTRIM(vend_country)+')' AS  vend_title
FROM Vendors
ORDER BY vend_name

--字段之间加减乘除--
SELECT prod_id, quantity, item_price, quantity*item_price AS expended_price 
FROM OrderItems 
WHERE order_num=20008;
```
# 函数
> 文本函数

| 函数        | 说 明            |
| --------- | -------------- |
| LEFT()    | 返回字符串左边的字符     |
| LENGTH()  | 返回字符串的长度       |
| LOWER()   | 将字符串转为小写       |
| UPPER()   | 将字符串转为大写       |
| LTRIM()   | 去掉字符串左边的空格     |
| RIGHT()   | 返回字符串右边的字符     |
| RTRIM()   | 去掉字符串右边的空格     |
| SOUNDEX() | 返回字符串的SOUNDEX值 |



```
--找出发音类似的--
SELECT cust_name,cust_contact
FROM Customers
where SOUNDEX(cust_contact)=SOUNDEX('Michael Green')

```
> 时间函数
```
SELECT order_num
FROM Orders
WHERE DATEPART(yy,order_date) = 2012
```
> 数值处理函数

| 函数     | 说明    |
| ------ | ----- |
| ABS()  | 返回绝对值 |
| EXP()  | 返回指数值 |
| PI()   | 返回圆周率 |
| SQRT() | 返回平方根 |



> 聚集函数【AVG() COUNT()  MAX() MIN() SUM()】

- 使用COUNT (*)对表中行的数目进行计数，不管表列中包含的是空值（NULL）还是非空值。
- 使用COUNT (column)对特定列中具有值的行进行计数，忽略NULL值。

```
--求平均的时候要求不重复
SELECT AVG(DISTINCT prod_price) AS avg_price
FROM Products
WHERE vend_id = 'DLL01';

```

# 分组数据
> GROUP BY子句和HAVING子句

```
SELECT vend_id,COUNT(*) AS num_prods
FROM Products
GROUP BY vend_id

--结果---
vend_id	num_prods
BRS01     	3
DLL01     	4
FNG01     	2
```
- WHERE只能过滤行，而不是分组，分组过滤需要HAVING

```
SELECT vend_id,COUNT(*) AS num_prods
FROM Products
GROUP BY vend_id
HAVING COUNT(*)>2
```

# 嵌套查询

```SQL
---------------------------------------
SELECT cust_name,cust_contact
FROM Customers
WHERE cust_id IN (SELECT cust_id
				  FROM Orders
				  WHERE order_num IN (SELECT order_num 
									  FROM OrderItems
									  WHERE prod_id = 'RGAN01'));
------------------------------------
SELECT cust_name, cust_contact
FROM Customers, Orders, OrderItems
WHERE Customers.cust _id = Orders.cust _id
AND  OrderItems.order_num = Orders.order_num
AND  prod_id = 'RGAN01';
------------------------------------
SELECT cust_name,
       cust_state,
       (SELECT COUNT(*)
        FROM Orders
        WHERE Orders.cust_id = Customers.cust_id) AS orders
FROM Customers		
ORDER BY cust_name		  
```
# 连接表
> join

```SQL
------等值连接-----------
SELECT vend_name,prod_name,prod_price
FROM Vendors,Products  
WHERE Vendors.vend_id = Products.vend_id


------内连接-------------
SELECT vend_name,prod_name,prod_price
FROM Vendors INNER JOIN Products
ON Vendors.vend_id = Products.vend_id
------外连接---------------
-INNER JOIN 产生的结果是AB的交集
-LEFT [OUTER] JOIN 产生表A的完全集，而B表中匹配的则有值，没有匹配的则以null值取代。
-RIGHT [OUTER] JOIN 产生表B的完全集，而A表中匹配的则有值，没有匹配的则以null值取代。
-FULL [OUTER] JOIN 产生A和B的并集。对于没有匹配的记录，则会以null做为值。

SELECT vend_name,prod_name,prod_price
FROM Vendors LEFT OUTER JOIN Products
ON Vendors.vend_id = Products.vend_id

SELECT vend_name,prod_name,prod_price
FROM Vendors RIGHT OUTER JOIN Products
ON Vendors.vend_id = Products.vend_id
-------表别名-------------
SELECT cust_name,cust_contact
FROM Customers AS C ,Orders AS O,OrderItems AS OI
WHERE  C.cust_id = O.cust_id AND OI.order_num = O.order_num AND prod_id = 'RGAN01';
```

```
--这个例子使用左外部联结来包含所有顾客，甚至包含那些没有任何订单的顾客。
SELECT Customers.cust_id,
COUNT(Orders.order_num) AS  num_ord
FROM Cust omers LEFT OUTER JOIN  Orders
ON  Customers.cust _id = Orders.cust _id
GROUP BY Customers.cust _id;
```

# 组合查询
> UNION函数
> 直接在两条SELECT语句之间，将结果合并在一起，类似在WHERE中使用OR函数，UNION会默认去除重复数据，UNION ALL不去除重复数据。ORDER BY函数必须放在最后一个SELECT语句中，并作用于最后的合并结果
# 插入数据
> INSERT INTO 按照列名来可以重复使用，可以只插入部分数据，

```SQL
------插入一行数据------------
INSERT INTO Customers(cust_id, 
cust_name, 
cust_city,
cust_state, 
cust_zip, 
cust_country, 
cust_contact, 
cust_email)
VALUES('1000000001', 
'Village Toys',
 '200 Maple Lane', 
 'Detroit',
 'MI', 
 'USA',
 'John Smith',
 'sales@villagetoys.com');
```

```SQL
-----插入SELECT结果，只关注顺序，不关注筛选出的字段名-------
INSERT INTO Customers(cust_id,
                      cust_contact ,
                      cust_email,
                      cust_name,
                      cust_address,
                      cust_city ,
                      cust_state,
                      cust_zip,
                      cust_country )
SELECT cust_id,
       cust_contact ,
       cust_email,
       cust_name,
       cust_address,
       cust_city ,
       cust_state,
       cust_zip,
       cust_country
FROM CustNew;
```

```SQL
-----从一个表复制到另一个表-------
SELECT *
INTO CustCopy
FROM Customers

```

# 更新删除数据
> UPDATE  DELETE

```
----更新指定行-------------
UPDATE Customers
SET cust_contact  = 'Sam Roberts',
    cust_email = 'sam@toyland.com'
WHERE cust_id = '1000000006';
------删除指定行--------
DELETE FROM Cust omers
WHERE cust_id = '1000000006';
--DELETE只能删除行，删除列则用update
--删除表中的所有数据TRUNCATE TABLE速度更快
```

# 创建和操纵类

```SQL
----创建表-------------
CREATE TABLE Products
(
  prod_id    char(10)      NOT NULL ,
  vend_id    char(10)      NOT NULL ,
  prod_name  char(255)     NOT NULL ,
  prod_price decimal(8,2)  DEFAULT 1,
  prod_desc  varchar(1000) NULL 
);
```

```
------更新表---------
ALTER  TABLE Vendos
ADD vend_phone CHAR(20);
ALTER  TABLE Vendos
DROP COULUMN vend_phone;
```

```
----删除表-------
DROP TABLE CustCopy ;
```

- 每个DBMS对表重命名的支持有所不同。对于这个操作，不存在严格的标准。DB2、MariaDB、My SQL、Oracle和PostgreSQL用户使
  用RENAME语句，SQL  Server用户使用sp_rename存储过程，SQLite用户使用ALTER TABLE语句。

# 使用视图
> CREATE  VIEW viewname

- 视图是虚拟的表
- 视图可以重用SQL语句
- 可以简化复杂SQL操作，在编写查询后，可以方便重用它，而不必知道其查询的细节
- 使用表的一部分而不是整个表
- 保护数据
- 更改数据的表现格式
- 视图不包含数据，每次使用的时候都会重新检索，因此如果特别复杂的SQL查询性能会下降的很厉害。

```SQL
---创建视图------
CREATE VIEW ProductCustomers AS
SELECT cust_name,cust_contact,prod_id
FROM Customers,Orders,OrderItems
WHERE Customers.cust_id = Orders.cust_id AND OrderItems.order_item = Orders.order_num
---查看视图-----------
--这条语句创建一个名为ProductCustomers的视图，它联结三个表，返回已订购了任意产品的所有顾客的列表。
SELECT * FROM ProductCustomers
--检索订购了产品RGA N01的顾客
SELECT * FROM ProductCustomers
WHERE prod_id = 'RGAN01'
----用视图重新格式化检索数据------
CREATE VIEW VendorLocations AS
SELECT RTRIM(vend_name)+'('+RTRIM(vend_country)+')' AS  vend_title
FROM Vendors

```






# 使用存储过程(批处理)

```SQL
CREATE PROCEDURE MailingListCount
AS
DECLARE @cnt INTEGER
SELECT @cnt = COUNT(*)
FROM Customers
WHERE NOT cust_email IS NULL
RETURN @cnt

DECLARE @ReturnValue INT
EXECUTE @ReturnValue=MailingListCount;
SELECT @ReturnValue
```

- 在Orders表中插入一个新订单

```
CREATE PROCEDURE NewOrder @cust_id CHAR(10)
AS
--Declare variable for order number
DECLARE @order_num INTEGER
--Get current highest order number
SELECT @order_num = MAX(order_num)
FROM Orders
--Determine next order number
SELECT @order_num = @order_num+1
--Insert new order
INSERT INTO Orders(order_num,order_date,cust_id)
VALUES(@order_num,GETDATE(),@cust_id)
--Return order number
RETURN @order_num;
```
- 此存储过程在O rders表中创建一个新订单。它只有一个参数，即下订单顾客的I D。订单号和订单日期这两列在存储过程中自动生成。代码首先声明一个局部变量来存储订单号。接着，检索当前最大订单号（使用MA X()函数）并增加1（使用SELECT 语句）。然后用INSERT 语句插入由新生成的订单号、当前系统日期（用GET DA T E()函数检索）和传递的顾客I D组成的订单。最后，用RET U RN @order_num返回订单号（处理订单物品需要它）。请注意，此代码加了注释，在编写存储过程时应该多加注释

```
CREATE PROCEDURE NewOrder @cust_id CHAR(10)
AS
--Insert new order
INSERT INFO Orders(cust_id)
VALUES(@cust_id)
--Return order number
SELECT order_num = @@IDENTITY
```

- 此存储过程也在Orders表中创建一个新订单。这次由DBMS生成订单号。大多数DBMS都支持这种功能；SQL  Serv er中称这些自动增量的列为标识字段（i den t i t y   f i el d），而其他DBMS称之为自动编号（au t o  n u mber）或序列（sequ en ce）。传递给此过程的参数也是一个，即下订单的顾客ID。订单号和订单日期没有给出，DBMS对日期使用默认值（GETDATE()函数），订单号自动生成。怎样才能得到这个自动生成的I D？在SQL  Serv er上可在全局变量@@IDENT ITY 中得到，它返回到调用程序（这里使用SELECT 语句）。



# 管理事务处理（transaction processing）
> COMMIT 和ROLLBACK语句

-  事务处理是通过确保成批SQL操作要么完全执行，要么完全不执行
-  在使用事务处理时，有几个反复出现的关键词。下面是关于事务处理需要知道的几个术语：
1. 事务（transaction ）指一组SQL语句；
2. 回退（rollback）指撤销指定SQL语句的过程；
3. 提交（commit）指将未存储的SQL语句结果写入数据库表；
4. 保留点（savepoint）指事务处理中设置的临时占位符（pl aceholder），可以对它发布回退（与回退整个事务处理不同）。


```SQL
BEGINT RANSACTION
INSERT INTO Customers(cust_id,cust_name)
VALUES('1000000010','ToysEmporium');
--定义保存点
SAVE TRANSACTION StartOrder;
INSERT INTO Orders(order_num,order_date,cust_id)
VALUES(20100,'2001/12/1','1000000010');
--若执行不成功就回退到保存点
IF @@ERROR<>0 ROLLBACK TRANSACTION StartOrder;
INSERT INTO OrderItems(order_num,order_item,prod_id,quantity,item_price)
VALUES(20100,1,'BR01',100,5.49);
IF @@ERROR<>0 ROLLBACK TRANSACTION StartOrder;
INSERT INTO OrderItems(order_num,order_item,prod_id,quantity,item_price)
VALUES(20100,2,'BR03',100,10.99);
IF @@ERROR<>0 ROLLBACK TRANSACTION StartOrder;
COMMIT TRANSACTION
```

# 使用游标

```
--创建游标
--在上面两个版本中，DECLA RE语句用来定义和命名游标，这里为CustCursor。SELECT 语句定义一个包含没有电子邮件地址（NU LL值）的所有
顾客的游标。
DECLARE CustCursor CURSOR
FOR
SELECT * FROM Customers
WHERE cust_email is NULL
---------------------
DECLARE @cust_id CHAR(10),
        @cust_name CHAR(50),
        @cust_address CHAR(50),
        @cust_city CHAR(50),
        @cust_state CHAR(5),
        @cust_zip CHAR(10),
        @cust_country CHAR(50),
        @cust_contact CHAR(50),
        @cust_email CHAR(255)
OPEN CustCursor
FETCH NEXT FROM CustCursor
INTO @cust_id,@cust_name,@cust_address,
     @cust_city,@cust_state,@cust_zip,
     @cust_country,@cust_contact,@cust_email
WHILE @@FETCH_STATUS=0
BEGIN
    --占位符
FETCH NEXT FROM CustCursor
	INTO @cust_id,@cust_name,@cust_address,
         @cust_city,@cust_state,@cust_zip,
         @cust_country,@cust_contact,@cust_email
END
CLOSE CustCursor
DEALLOCATE  CustCursor
```
- 在此例中，为每个检索出的列声明一个变量，FET CH语句检索一行并保存值到这些变量中。使用WHILE循环处理每一行，条件WHILE @@FET CH_ST A T U S = 0在取不出更多的行时终止处理（退出循环）。这个例子也不进行具体的处理，实际代码中，应该用具体的处理代码替换其中的…占位符。

# 高级SQL特性

## 约束
## 索引
## 触发器
