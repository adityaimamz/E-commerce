# MASTER IMPLEMENTATION PROMPT
Production-Grade E-Commerce Backend

You are a senior backend architect and full-stack engineer.

Your task is to generate a **complete backend implementation** for an e-commerce system using **Next.js App Router + Prisma + PostgreSQL + Auth.js + Midtrans**.

The system must be clean, scalable, and production-ready.

Follow ALL specifications below strictly.

Do NOT invent alternative architecture.

---

# PROJECT GOAL

Build a backend API system supporting:

1. Authentication (User & Admin)
2. Product catalog
3. Category management
4. Shopping cart
5. Checkout system
6. Transaction management
7. Midtrans payment integration
8. Admin product management
9. Secure API architecture

Frontend will consume these APIs.

---

# TECH STACK

Use EXACTLY these technologies:

Framework:
Next.js 14+ (App Router)

Auth:
Auth.js (NextAuth v5)

Database:
PostgreSQL (Neon)

ORM:
Prisma

Validation:
Zod

Password Hashing:
bcryptjs

Payment Gateway:
Midtrans Snap

Language:
TypeScript

---

# PROJECT STRUCTURE

You must generate the following structure:


/app
/api
/auth
/register
/login
/products
/products/[id]
/categories
/cart
/cart/add
/cart/remove
/checkout
/webhook
/webhook/midtrans

/lib
/auth.ts
/prisma.ts
/midtrans.ts
/validators

/services
/product.service.ts
/cart.service.ts
/transaction.service.ts

/middleware
/auth.middleware.ts

/prisma
schema.prisma

/types
api.ts


Follow this structure strictly.

---

# ENVIRONMENT VARIABLES

Create `.env.example`


DATABASE_URL=

NEXTAUTH_SECRET=
NEXTAUTH_URL=

MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false


---

# DATABASE SCHEMA

Use Prisma schema.

Generate models:

User
Category
Product
ProductImage
Cart
CartItem
Transaction
TransactionItem

Enums:

Role
TransactionStatus

---

# PRISMA MODELS

## Role Enum


enum Role {
ADMIN
USER
}


---

## User

Fields:


id
name
email
password
role
createdAt
updatedAt


Relations:


transactions
carts


---

## Category

Fields:


id
name
slug
createdAt
updatedAt


---

## Product

Fields:


id
name
slug
description
price
stock
categoryId
createdAt
updatedAt


Relations:


category
images


---

## ProductImage

Fields:


id
url
productId


---

## Cart

Fields:


id
userId
createdAt
updatedAt


Relations:


items


---

## CartItem

Fields:


id
cartId
productId
quantity


---

## Transaction

Fields:


id
userId
totalAmount
status
snapToken
paymentUrl
createdAt
updatedAt


---

## TransactionStatus Enum


PENDING
PAID
FAILED
CANCELLED
EXPIRED


---

## TransactionItem

Fields:


id
transactionId
productId
quantity
price


---

# AUTHENTICATION SYSTEM

Use Auth.js with:

Credentials Provider

Login via:

Email
Password

Password must be hashed using bcryptjs.

Session strategy:

JWT

---

# AUTHORIZATION

Use role-based authorization.

Roles:

ADMIN
USER

Restrictions:

ADMIN


create product
update product
delete product
manage categories


USER


view products
add to cart
checkout


---

# VALIDATION

All input must be validated using Zod.

Create validators for:


register
login
createProduct
addToCart
checkout


Store validators in:


/lib/validators


---

# API ENDPOINTS

Implement the following endpoints.

---

# AUTH

Register


POST /api/auth/register


Login handled by Auth.js.

---

# PRODUCTS

Get products


GET /api/products


Supports:


pagination
search
category filter


Example:


/api/products?page=1&limit=20


---

Get product detail


GET /api/products/[id]


---

Admin create product


POST /api/products


---

Admin update product


PATCH /api/products/[id]


---

Admin delete product


DELETE /api/products/[id]


---

# CATEGORY

Create category


POST /api/categories


Get categories


GET /api/categories


---

# CART

Add item


POST /api/cart/add


Remove item


POST /api/cart/remove


Get cart


GET /api/cart


---

# CHECKOUT

Endpoint:


POST /api/checkout


Flow:

1. Get user's cart
2. Validate stock
3. Calculate total price
4. Create transaction
5. Create transaction items
6. Request Midtrans Snap token
7. Save snapToken
8. Return snapToken to frontend

---

# MIDTRANS INTEGRATION

Create Midtrans client in:


/lib/midtrans.ts


Use:


midtrans-client


Snap API.

---

# WEBHOOK

Endpoint:


POST /api/webhook/midtrans


Flow:

1. Receive Midtrans notification
2. Verify signature
3. Get order_id
4. Update transaction status

Mapping:


settlement -> PAID
capture -> PAID
pending -> PENDING
expire -> EXPIRED
cancel -> CANCELLED


---

# SERVICE LAYER

Business logic must be separated from API routes.

Create services:


product.service.ts
cart.service.ts
transaction.service.ts


API routes must only:


validate input
call service
return response


---

# SECURITY REQUIREMENTS

Must implement:

Password hashing
JWT sessions
Input validation
Admin authorization
Webhook verification

---

# ERROR HANDLING

Create standardized API response.

Success


{
success: true,
data: ...
}


Error


{
success: false,
message: "error message"
}


---

# DEVELOPMENT ORDER

Follow this order strictly:

Step 1


Prisma schema
database connection
migration


Step 2


authentication
register
login
session


Step 3


product APIs
category APIs


Step 4


cart system


Step 5


checkout system


Step 6


midtrans integration


Step 7


webhook


---

# CODE QUALITY RULES

Follow these rules:

1. Use TypeScript strictly
2. Avoid duplicated logic
3. Use service layer
4. Validate all inputs
5. Use async/await
6. Use Prisma transactions when needed

---

# FINAL OUTPUT

Generate:

1. Prisma schema
2. All API routes
3. Auth.js configuration
4. Service layer
5. Zod validators
6. Midtrans integration
7. Webhook handler

The result must be a **fully runnable backend project**.