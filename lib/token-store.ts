// In-memory access token, mirrored to localStorage so it survives reloads.
// The refresh token lives in an httpOnly cookie managed by the API.

const STORAGE_KEY = "mv_access_token";

let accessToken: string | null = null;

export const tokenStore = {
  get(): string | null {
    if (accessToken) return accessToken;
    if (typeof window !== "undefined") {
      accessToken = window.localStorage.getItem(STORAGE_KEY);
    }
    return accessToken;
  },
  set(token: string | null) {
    accessToken = token;
    if (typeof window === "undefined") return;
    if (token) {
      window.localStorage.setItem(STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  },
  clear() {
    this.set(null);
  },
};
