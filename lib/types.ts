// Shared API types mirroring the NestJS backend contracts.

export type Role = "ADMIN" | "SELLER" | "BUYER";
export type ProductStatus = "ACTIVE" | "DRAFT" | "OUT_OF_STOCK";
export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface ApiEnvelope<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  emailVerified: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  stripeAccountId?: string | null;
  isApproved: boolean;
  ownerId: string;
  owner?: { id: string; name: string; email: string } | null;
  createdAt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  stock: number;
  status: ProductStatus;
  images: string[];
  categoryId: string;
  category?: Category;
  storeId: string;
  store?: Store;
  avgRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number;
  subtotal: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: string;
  storeId: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyer?: AuthUser;
  items: OrderItem[];
  status: OrderStatus;
  total: string;
  stripeSessionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  reply?: string | null;
  userId: string;
  user?: { id: string; name: string };
  productId: string;
  createdAt: string;
}

export interface SellerDashboard {
  totalOrders: number;
  totalRevenue: number;
  totalProductsSold: number;
  revenueChart: { date: string; revenue: number }[];
  topProducts: {
    productId: string;
    title: string;
    quantity: number;
    revenue: number;
  }[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isBanned: boolean;
  emailVerifiedAt: string | null;
  store?: Store | null;
  createdAt: string;
}

export interface PlatformAnalytics {
  gmv: number;
  commissionEarned: number;
  commissionPercent: number;
  totalOrders: number;
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  revenueChart: { date: string; revenue: number }[];
  topStores: { storeId: string; name: string; revenue: number }[];
}
