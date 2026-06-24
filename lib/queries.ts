import { api, unwrap, unwrapPaginated } from "./api";
import type {
  AdminUser,
  Category,
  Order,
  Paginated,
  PlatformAnalytics,
  Product,
  Review,
  SellerDashboard,
  Store,
} from "./types";

export interface ProductQuery {
  q?: string;
  categoryId?: string;
  category?: string;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "best_rated";
  page?: number;
  limit?: number;
}

export async function fetchProducts(
  query: ProductQuery = {},
): Promise<Paginated<Product>> {
  const params: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== "" && v !== null) {
      params[k] = typeof v === "boolean" ? String(v) : v;
    }
  }
  const { data, meta } = await unwrapPaginated<Product>(
    api.get("/products", { params }),
  );
  return {
    data,
    meta: meta ?? { total: data.length, page: 1, limit: data.length, lastPage: 1 },
  };
}

export function fetchProduct(id: string): Promise<Product> {
  return unwrap<Product>(api.get(`/products/${id}`));
}

export function fetchRelated(id: string): Promise<Product[]> {
  return unwrap<Product[]>(api.get(`/products/${id}/related`));
}

export function fetchCategories(): Promise<Category[]> {
  return unwrap<Category[]>(api.get("/categories"));
}

export function fetchStore(slug: string): Promise<Store> {
  return unwrap<Store>(api.get(`/stores/${slug}`));
}

export function fetchProductReviews(productId: string): Promise<Review[]> {
  return unwrap<Review[]>(api.get(`/products/${productId}/reviews`));
}

export function fetchMyOrders(page = 1): Promise<Paginated<Order>> {
  return unwrapPaginated<Order>(api.get("/orders", { params: { page } })).then(
    ({ data, meta }) => ({
      data,
      meta: meta ?? { total: data.length, page, limit: 20, lastPage: 1 },
    }),
  );
}

export function fetchOrder(id: string): Promise<Order> {
  return unwrap<Order>(api.get(`/orders/${id}`));
}

export function fetchMyStore(): Promise<Store> {
  return unwrap<Store>(api.get("/stores/mine"));
}

export function fetchSellerDashboard(
  range: "7d" | "30d" | "90d",
): Promise<SellerDashboard> {
  return unwrap<SellerDashboard>(
    api.get("/seller/dashboard", { params: { range } }),
  );
}

export function fetchSellerProducts(page = 1): Promise<Paginated<Product>> {
  return unwrapPaginated<Product>(
    api.get("/seller/products", { params: { page, limit: 50 } }),
  ).then(({ data, meta }) => ({
    data,
    meta: meta ?? { total: data.length, page, limit: 50, lastPage: 1 },
  }));
}

export function fetchSellerOrders(page = 1): Promise<Paginated<Order>> {
  return unwrapPaginated<Order>(
    api.get("/seller/orders", { params: { page } }),
  ).then(({ data, meta }) => ({
    data,
    meta: meta ?? { total: data.length, page, limit: 20, lastPage: 1 },
  }));
}

// --- Admin ---

function withDefaultMeta<T>(page: number, limit: number) {
  return ({ data, meta }: { data: T[]; meta?: Paginated<T>["meta"] }) => ({
    data,
    meta: meta ?? { total: data.length, page, limit, lastPage: 1 },
  });
}

export function fetchAdminAnalytics(): Promise<PlatformAnalytics> {
  return unwrap<PlatformAnalytics>(api.get("/admin/analytics"));
}

export function fetchAdminUsers(params: {
  page?: number;
  q?: string;
  role?: string;
} = {}): Promise<Paginated<AdminUser>> {
  const page = params.page ?? 1;
  return unwrapPaginated<AdminUser>(
    api.get("/admin/users", { params: { limit: 20, ...params, page } }),
  ).then(withDefaultMeta<AdminUser>(page, 20));
}

export function fetchAdminStores(page = 1): Promise<Paginated<Store>> {
  return unwrapPaginated<Store>(
    api.get("/admin/stores", { params: { page, limit: 20 } }),
  ).then(withDefaultMeta<Store>(page, 20));
}

export function fetchAdminProducts(params: {
  page?: number;
  q?: string;
} = {}): Promise<Paginated<Product>> {
  const page = params.page ?? 1;
  return unwrapPaginated<Product>(
    api.get("/admin/products", { params: { limit: 20, ...params, page } }),
  ).then(withDefaultMeta<Product>(page, 20));
}

export function fetchAdminOrders(page = 1): Promise<Paginated<Order>> {
  return unwrapPaginated<Order>(
    api.get("/admin/orders", { params: { page, limit: 20 } }),
  ).then(withDefaultMeta<Order>(page, 20));
}

export function fetchCommission(): Promise<{ percent: number }> {
  return unwrap<{ percent: number }>(api.get("/admin/settings/commission"));
}
