import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { tokenStore } from "./token-store";
import type { ApiEnvelope } from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send the refresh-token cookie
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// --- Silent refresh on 401 -------------------------------------------------

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await axios.post<ApiEnvelope<{ accessToken: string }>>(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const token = res.data.data.accessToken;
    tokenStore.set(token);
    return token;
  } catch {
    tokenStore.clear();
    return null;
  }
}

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";

    const isAuthEndpoint =
      url.includes("/auth/refresh") || url.includes("/auth/login");

    if (status === 401 && original && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization =
          `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Unwraps the `{ data }` envelope returned by the API's TransformInterceptor. */
export async function unwrap<T>(p: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

/** Like unwrap but keeps pagination meta. */
export async function unwrapPaginated<T>(
  p: Promise<{ data: ApiEnvelope<T[]> }>,
): Promise<{ data: T[]; meta: ApiEnvelope<T[]>["meta"] }> {
  const res = await p;
  return { data: res.data.data, meta: res.data.meta };
}

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(", ");
    if (typeof msg === "string") return msg;
    return error.message;
  }
  return "Something went wrong";
}
