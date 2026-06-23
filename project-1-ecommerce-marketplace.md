# Project 1: Multi-Vendor E-commerce Marketplace

## Overview

A platform where independent sellers can register, list products, and process orders — while customers browse, buy, and track deliveries. Think a lightweight Etsy/Shopify hybrid. This project showcases multi-tenancy, payment processing, role-based access, and real-time order management.

## Freelance Value

Small agencies and independent retailers constantly hire developers to build or customize marketplaces. This project directly mirrors what clients pay $5,000–$25,000 for. A NestJS backend signals enterprise-grade architecture, which commands higher rates.

---

## Tech Stack

| Layer         | Technology                                                             |
| ------------- | ---------------------------------------------------------------------- |
| Frontend      | Next.js 16 (App Router), Tailwind CSS, shadcn/ui                       |
| Backend       | **NestJS** (modular architecture, dependency injection)                |
| ORM           | **TypeORM**                                                            |
| Database      | **PostgreSQL**                                                         |
| Auth          | **Passport.js** (JWT + Google OAuth strategies) via `@nestjs/passport` |
| Validation    | `class-validator` + `class-transformer` (DTOs)                         |
| Payments      | Stripe Connect (for multi-vendor payouts)                              |
| File Storage  | Cloudinary (product images)                                            |
| API Docs      | Swagger via `@nestjs/swagger`                                          |
| Config        | `@nestjs/config` (env management)                                      |
| Frontend Data | TanStack Query (React Query) + Axios                                   |
| Deployment    | Vercel (frontend) + Railway/Render (NestJS API + PostgreSQL)           |
| Email         | Nodemailer (via a `MailModule`)                                        |

> **Architecture note:** Frontend (Next.js) and backend (NestJS) are **separate apps/repos**. The Next.js app calls the NestJS REST API over HTTP. Auth is JWT-based (access + refresh tokens), not NextAuth, since the backend owns auth.

---

## NestJS Project Structure

```
src/
├── main.ts                      # Bootstrap, Swagger, global pipes/filters
├── app.module.ts                # Root module
├── config/
│   ├── typeorm.config.ts        # DataSource for migrations
│   └── configuration.ts         # Env config factory
├── common/
│   ├── decorators/              # @CurrentUser(), @Roles()
│   ├── guards/                  # JwtAuthGuard, RolesGuard, StoreOwnerGuard
│   ├── interceptors/            # TransformInterceptor, LoggingInterceptor
│   ├── filters/                 # HttpExceptionFilter
│   └── enums/                   # Role, ProductStatus, OrderStatus
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/              # jwt.strategy.ts, google.strategy.ts, refresh.strategy.ts
│   └── dto/                     # signup.dto.ts, login.dto.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── entities/user.entity.ts
├── stores/
│   ├── stores.module.ts
│   ├── stores.controller.ts
│   ├── stores.service.ts
│   ├── dto/
│   └── entities/store.entity.ts
├── products/
│   ├── products.module.ts
│   ├── products.controller.ts
│   ├── products.service.ts
│   ├── dto/                     # create-product.dto.ts, query-product.dto.ts
│   └── entities/product.entity.ts
├── categories/
│   └── entities/category.entity.ts
├── cart/
│   ├── cart.module.ts
│   ├── cart.controller.ts
│   ├── cart.service.ts
│   └── entities/cart-item.entity.ts
├── orders/
│   ├── orders.module.ts
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── entities/order.entity.ts, order-item.entity.ts
├── checkout/
│   ├── checkout.module.ts
│   ├── checkout.controller.ts   # includes Stripe webhook (raw body)
│   └── checkout.service.ts
├── reviews/
│   ├── reviews.module.ts
│   ├── reviews.controller.ts
│   ├── reviews.service.ts
│   └── entities/review.entity.ts
├── admin/
│   ├── admin.module.ts
│   ├── admin.controller.ts
│   └── admin.service.ts
├── cloudinary/
│   ├── cloudinary.module.ts
│   └── cloudinary.service.ts
└── mail/
    ├── mail.module.ts
    └── mail.service.ts
```

---

## Roles & Permissions

- **Admin** — platform owner; manages all sellers, products, disputes, commissions
- **Seller** — registers a store, manages listings and orders for their store only
- **Buyer** — browses all stores, adds to cart, checks out, tracks orders
- **Guest** — browse-only; prompted to sign up at checkout

Implemented via a custom `@Roles()` decorator + `RolesGuard`. Store-scoped resources additionally use a `StoreOwnerGuard` that verifies the authenticated seller owns the store/product being mutated.

---

## Feature Requirements

### Authentication & Onboarding

- [ ] Email/password signup and login (bcrypt password hashing)
- [ ] JWT access token (15 min) + refresh token (7 days, httpOnly cookie)
- [ ] Google OAuth login (Passport Google strategy)
- [ ] Role selection during signup (buyer vs seller)
- [ ] Seller onboarding: store name, description, logo upload, Stripe Connect account setup
- [ ] Email verification on signup (token emailed via MailModule)
- [ ] Forgot password / reset password flow
- [ ] Refresh token rotation endpoint

### Seller Dashboard

- [ ] Store profile management (name, logo, banner, bio)
- [ ] Product CRUD: title, description, price, stock quantity, category, images (up to 5)
- [ ] Product status toggle (active / draft / out of stock)
- [ ] Order management: view incoming orders, update status (processing → shipped → delivered)
- [ ] Sales analytics: revenue chart (7d / 30d / 90d), top products, total orders
- [ ] Payout history from Stripe Connect

### Product Catalog (Buyer-facing)

- [ ] Homepage with featured products and categories
- [ ] Product listing page with filters: category, price range, rating, in-stock only
- [ ] Search with debounced input (searches title + description)
- [ ] Sort by: newest, price low-high, price high-low, best rated
- [ ] Pagination (cursor or offset; documented in query DTO)
- [ ] Product detail page: images carousel, description, seller info, reviews section
- [ ] Related products (same category)

### Shopping Cart & Checkout

- [ ] Add to cart (localStorage for guests, DB for logged-in users)
- [ ] Cart drawer/sidebar with item count badge
- [ ] Quantity adjustment and item removal
- [ ] Stripe Checkout Session (hosted checkout page)
- [ ] Order summary before payment
- [ ] Multiple sellers in one cart (Stripe Connect handles split payouts)
- [ ] Post-checkout confirmation page with order number

### Orders

- [ ] Buyer order history with status tracking
- [ ] Individual order detail page (items, seller, total, status timeline)
- [ ] Email notification to buyer on order confirmation
- [ ] Email notification to seller on new order
- [ ] Admin can view and manage all orders

### Reviews & Ratings

- [ ] Buyers can leave a 1–5 star rating + text review after order is delivered
- [ ] One review per product per order
- [ ] Average rating displayed on product card and detail page
- [ ] Seller can respond to a review (one reply)

### Admin Panel

- [ ] User management: list, ban/unban, role change
- [ ] Seller approval (optional: require admin approval before seller goes live)
- [ ] All products overview with ability to remove/hide
- [ ] Platform-wide sales report (revenue, GMV, commission earned)
- [ ] Commission rate configuration (e.g., platform takes 10%)

---

## Data Models (TypeORM Entities)

Entities use decorators. Enable `synchronize: false` in production and use **migrations**.

```typescript
// common/enums/index.ts
export enum Role {
  ADMIN = "ADMIN",
  SELLER = "SELLER",
  BUYER = "BUYER",
}
export enum ProductStatus {
  ACTIVE = "ACTIVE",
  DRAFT = "DRAFT",
  OUT_OF_STOCK = "OUT_OF_STOCK",
}
export enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}
```

```typescript
// users/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  CreateDateColumn,
} from "typeorm";
import { Role } from "../../common/enums";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ unique: true }) email: string;

  @Column({ nullable: true, select: false }) passwordHash: string;

  @Column() name: string;

  @Column({ type: "enum", enum: Role, default: Role.BUYER }) role: Role;

  @Column({ type: "timestamptz", nullable: true }) emailVerifiedAt: Date | null;

  @Column({ nullable: true, select: false }) refreshTokenHash: string | null;

  @OneToOne(() => Store, (store) => store.owner) store: Store;

  @OneToMany(() => Order, (order) => order.buyer) orders: Order[];

  @OneToMany(() => Review, (review) => review.user) reviews: Review[];

  @OneToMany(() => CartItem, (item) => item.user) cartItems: CartItem[];

  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
}
```

```typescript
// stores/entities/store.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from "typeorm";

@Entity("stores")
export class Store {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column() name: string;

  @Column({ unique: true }) slug: string;

  @Column({ nullable: true }) description: string;

  @Column({ nullable: true }) logoUrl: string;

  @Column({ nullable: true }) bannerUrl: string;

  @Column({ nullable: true }) stripeAccountId: string;

  @Column({ default: false }) isApproved: boolean;

  @OneToOne(() => User, (user) => user.store) @JoinColumn() owner: User;

  @Column() ownerId: string;

  @OneToMany(() => Product, (product) => product.store) products: Product[];

  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
}
```

```typescript
// products/entities/product.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  Index,
} from "typeorm";
import { ProductStatus } from "../../common/enums";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Index() @Column() title: string;

  @Column("text") description: string;

  @Column("decimal", { precision: 10, scale: 2 }) price: string;

  @Column({ default: 0 }) stock: number;

  @Column({ type: "enum", enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  @Column("text", { array: true, default: "{}" }) images: string[];

  @ManyToOne(() => Category, (c) => c.products, { eager: true })
  category: Category;

  @Column() categoryId: string;

  @ManyToOne(() => Store, (s) => s.products) store: Store;

  @Column() storeId: string;

  @OneToMany(() => Review, (r) => r.product) reviews: Review[];

  @OneToMany(() => OrderItem, (oi) => oi.product) orderItems: OrderItem[];

  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
}
```

```typescript
// categories/entities/category.entity.ts
@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ unique: true }) name: string;
  @Column({ unique: true }) slug: string;
  @OneToMany(() => Product, (p) => p.category) products: Product[];
}
```

```typescript
// orders/entities/order.entity.ts
import { OrderStatus } from "../../common/enums";

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn("uuid") id: string;

  @ManyToOne(() => User, (u) => u.orders) buyer: User;
  @Column() buyerId: string;

  @OneToMany(() => OrderItem, (oi) => oi.order, { cascade: true })
  items: OrderItem[];

  @Column({ type: "enum", enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column("decimal", { precision: 10, scale: 2 }) total: string;

  @Column({ nullable: true }) stripeSessionId: string;

  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
  @UpdateDateColumn({ type: "timestamptz" }) updatedAt: Date;
}

// orders/entities/order-item.entity.ts
@Entity("order_items")
export class OrderItem {
  @PrimaryGeneratedColumn("uuid") id: string;

  @ManyToOne(() => Order, (o) => o.items) order: Order;
  @Column() orderId: string;

  @ManyToOne(() => Product, (p) => p.orderItems) product: Product;
  @Column() productId: string;

  @Column() quantity: number;

  // price snapshot at time of purchase — never reference live product price
  @Column("decimal", { precision: 10, scale: 2 }) price: string;

  @Column() storeId: string; // for seller order filtering
}
```

```typescript
// cart/entities/cart-item.entity.ts
@Entity("cart_items")
@Unique(["userId", "productId"])
export class CartItem {
  @PrimaryGeneratedColumn("uuid") id: string;
  @ManyToOne(() => User, (u) => u.cartItems) user: User;
  @Column() userId: string;
  @ManyToOne(() => Product) product: Product;
  @Column() productId: string;
  @Column() quantity: number;
}
```

```typescript
// reviews/entities/review.entity.ts
@Entity("reviews")
@Unique(["userId", "productId"])
export class Review {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column("int") rating: number; // 1–5
  @Column({ nullable: true }) comment: string;
  @Column({ nullable: true }) reply: string; // seller response
  @ManyToOne(() => User, (u) => u.reviews) user: User;
  @Column() userId: string;
  @ManyToOne(() => Product, (p) => p.reviews) product: Product;
  @Column() productId: string;
  @CreateDateColumn({ type: "timestamptz" }) createdAt: Date;
}
```

---

## REST API Endpoints (NestJS Controllers)

Each line maps to a controller method. Guards shown in brackets.

```
# AuthController  (/auth)
POST   /auth/signup                          # register (buyer/seller)
POST   /auth/login                           # returns access + refresh
POST   /auth/refresh                         [RefreshGuard] rotate tokens
POST   /auth/logout                          [JwtAuthGuard]
GET    /auth/google                          # initiate Google OAuth
GET    /auth/google/callback                 # OAuth callback
POST   /auth/verify-email                    # confirm email token
POST   /auth/forgot-password
POST   /auth/reset-password

# ProductsController  (/products)
GET    /products                             # list w/ filters + pagination (QueryProductDto)
GET    /products/:id                         # single product
POST   /products                             [Jwt, Roles(SELLER), StoreOwner] create
PATCH  /products/:id                         [Jwt, Roles(SELLER), StoreOwner] update
DELETE /products/:id                         [Jwt, Roles(SELLER, ADMIN)] delete
POST   /products/:id/images                  [Jwt, Roles(SELLER)] upload (Cloudinary)

# StoresController  (/stores)
GET    /stores/:slug                         # public storefront
POST   /stores                               [Jwt, Roles(SELLER)] create store (onboarding)
PATCH  /stores/mine                          [Jwt, Roles(SELLER)] update own store

# SellerController  (/seller)  — all [Jwt, Roles(SELLER)]
GET    /seller/dashboard                     # aggregated stats
GET    /seller/orders                        # incoming orders for own store
PATCH  /seller/orders/:id/status             # update order status

# CartController  (/cart)  — all [JwtAuthGuard]
GET    /cart
POST   /cart                                 # add item
PATCH  /cart/:itemId                         # update qty
DELETE /cart/:itemId                         # remove item

# CheckoutController  (/checkout)
POST   /checkout/session                     [JwtAuthGuard] create Stripe session
POST   /checkout/webhook                     # Stripe webhook (raw body, signature verified)

# OrdersController  (/orders)  — [JwtAuthGuard]
GET    /orders                               # buyer's orders
GET    /orders/:id                           # order detail (owner only)

# ReviewsController  (/reviews)
POST   /reviews                              [Jwt, Roles(BUYER)] create review
PATCH  /reviews/:id/reply                    [Jwt, Roles(SELLER)] seller reply

# AdminController  (/admin)  — all [Jwt, Roles(ADMIN)]
GET    /admin/users
PATCH  /admin/users/:id                      # role / ban status
PATCH  /admin/stores/:id/approve             # approve seller
GET    /admin/orders
GET    /admin/analytics
PATCH  /admin/settings/commission            # set commission rate
```

Swagger UI auto-generated at `/api/docs` via `@nestjs/swagger` decorators on DTOs and controllers.

---

## Key NestJS Patterns to Implement

### 1. Global setup (`main.ts`)

```typescript
const app = await NestFactory.create(AppModule, { rawBody: true }); // rawBody for Stripe webhook
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.useGlobalFilters(new HttpExceptionFilter());
app.useGlobalInterceptors(new TransformInterceptor()); // wrap responses in { data, meta }
app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });
// Swagger
const config = new DocumentBuilder()
  .setTitle("Marketplace API")
  .addBearerAuth()
  .build();
SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config));
```

### 2. Roles decorator + guard

```typescript
// @Roles(Role.SELLER) on the handler; RolesGuard reads metadata via Reflector
export const Roles = (...roles: Role[]) => SetMetadata("roles", roles);
```

### 3. DTO validation example

```typescript
// products/dto/create-product.dto.ts
export class CreateProductDto {
  @IsString() @MinLength(3) title: string;
  @IsString() description: string;
  @IsNumber() @Min(0) price: number;
  @IsInt() @Min(0) stock: number;
  @IsUUID() categoryId: string;
}
```

### 4. Stripe webhook (raw body)

- Use the raw request body to verify the signature via `stripe.webhooks.constructEvent`.
- Bootstrap with `rawBody: true` and read `req.rawBody` in the webhook handler.

### 5. Atomic order creation

- Use a TypeORM **QueryRunner transaction** so order + order items + stock decrement happen atomically. Roll back on any failure.

---

## UI Screens / Pages (Next.js frontend)

```
/                          # Homepage: hero, featured products, categories
/products                  # Catalog with filters sidebar + grid
/products/[id]             # Product detail
/stores/[slug]             # Seller's public storefront
/cart                      # Cart page
/checkout/success          # Post-payment confirmation

/auth/login
/auth/signup
/auth/forgot-password

/buyer/orders              # Order history
/buyer/orders/[id]         # Order detail + tracking

/seller/onboarding         # Store setup wizard
/seller/dashboard          # Stats overview
/seller/products           # Product management table
/seller/products/new       # Create product form
/seller/products/[id]/edit # Edit product
/seller/orders             # Incoming orders

/admin/dashboard           # Platform analytics
/admin/users               # User management
/admin/products            # All products
/admin/orders              # All orders
```

Frontend talks to the API via an Axios instance with an interceptor that attaches the access token and silently refreshes on 401. Use TanStack Query for caching, mutations, and optimistic updates (cart).

---

## Implementation Phases

### Phase 1 — Backend Foundation (Days 1–3)

1. `nest new marketplace-api`; install TypeORM, pg, `@nestjs/config`, class-validator
2. Configure TypeORM `DataSource` + first migration; connect to local PostgreSQL
3. Create User, Store, Category entities; seed categories via a seed script
4. Build AuthModule: signup/login, bcrypt, JWT access + refresh strategies, RolesGuard
5. Set up Swagger and global pipes/filters/interceptors

### Phase 2 — Seller Domain (Days 4–6)

1. StoresModule: create/update store (seller onboarding), StoreOwnerGuard
2. ProductsModule: CRUD with DTO validation + query filtering/pagination
3. CloudinaryModule: image upload service; wire to product image endpoint
4. Stripe Connect Express account creation in onboarding
5. SellerController: dashboard stats + order status updates

### Phase 3 — Buyer & Checkout (Days 7–9)

1. CartModule: DB-backed cart for authenticated users
2. CheckoutModule: Stripe Checkout Session creation
3. Stripe webhook → OrdersModule order creation (QueryRunner transaction, stock decrement)
4. OrdersController: buyer order history + detail

### Phase 4 — Frontend Integration (Days 10–13)

1. Next.js app: Axios client + auth token refresh interceptor
2. Auth pages, product catalog, product detail, cart drawer
3. Seller dashboard + product management UI
4. Buyer order history + Stripe redirect/confirmation
5. TanStack Query throughout

### Phase 5 — Reviews, Admin & Polish (Days 14–16)

1. ReviewsModule + UI
2. AdminModule + admin panel UI
3. MailModule notifications (order confirmation, new order to seller)
4. Loading/error/empty states, mobile responsiveness
5. Deploy: NestJS API + PostgreSQL to Railway/Render; frontend to Vercel

---

## Key Implementation Notes for AI Agent

- **Migrations over `synchronize`**: set `synchronize: false`; generate migrations with `typeorm migration:generate`. Show this in the repo — clients judge production-readiness by it.
- **Decimal columns return strings** in TypeORM (`price: string`). Never do float math on money — use integer cents or a decimal library if doing arithmetic.
- **Stripe Connect**: use Express accounts for sellers. The platform creates the Checkout Session with `payment_intent_data.transfer_data` / `application_fee_amount` to split funds and take commission.
- **Webhook security**: verify `stripe-signature` with the raw request body. Bootstrap with `rawBody: true`.
- **Order atomicity**: wrap order creation, order items, and stock decrement in one `queryRunner.manager` transaction; roll back on any error.
- **Price snapshots**: copy product price into `OrderItem.price` at purchase time. Never join to live product price for historical orders.
- **Guards composition**: `JwtAuthGuard` → `RolesGuard` → `StoreOwnerGuard`. The last loads the resource and checks `store.ownerId === user.id`.
- **`select: false`** on `passwordHash` and `refreshTokenHash` so they never leak; explicitly `addSelect` when needed in the auth flow.
- **Refresh token rotation**: store a hash of the current refresh token on the user; rotate (and re-hash) on every refresh; reject reused tokens.
- **Pagination**: standardize a `PaginationQueryDto` (`page`, `limit`, `sort`) and a wrapped response `{ data, meta: { total, page, lastPage } }` via the TransformInterceptor.
- **Cloudinary uploads**: handle multipart with `FileInterceptor`; upload server-side in the CloudinaryService using a stream; keep the API secret server-side only.
- **CORS + cookies**: refresh token in an httpOnly cookie requires `credentials: true` on CORS and `withCredentials` on Axios.
- **Seed an admin** user via a CLI seed script so the admin panel is reachable immediately after deploy.
