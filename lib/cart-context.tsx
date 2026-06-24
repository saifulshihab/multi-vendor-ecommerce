"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "./api";
import { useAuth } from "./auth-context";
import type { CartSummary, Product } from "./types";

const GUEST_KEY = "mv_guest_cart";

export interface CartLine {
  productId: string;
  quantity: number;
  product: Pick<
    Product,
    "id" | "title" | "price" | "images" | "stock" | "storeId" | "status"
  >;
}

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  subtotal: string;
  isLoading: boolean;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  updateItem: (line: CartLine, quantity: number) => Promise<void>;
  removeItem: (line: CartLine) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readGuestCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(GUEST_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeGuestCart(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_KEY, JSON.stringify(lines));
}

function toLine(item: CartSummary["items"][number]): CartLine {
  return {
    productId: item.productId,
    quantity: item.quantity,
    product: item.product,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const queryClient = useQueryClient();
  const isAuthed = status === "authenticated" && !!user;

  const [guestLines, setGuestLines] = useState<CartLine[]>([]);
  useEffect(() => {
    // localStorage is client-only; read after mount to avoid hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuestLines(readGuestCart());
  }, []);

  const persistGuest = useCallback((lines: CartLine[]) => {
    setGuestLines(lines);
    writeGuestCart(lines);
  }, []);

  // Server cart for authenticated users.
  const { data: serverCart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => unwrap<CartSummary>(api.get("/cart")),
    enabled: isAuthed,
  });

  // Merge the guest cart into the DB once on login, then clear local.
  const mergedRef = useRef(false);
  useEffect(() => {
    if (!isAuthed) {
      mergedRef.current = false;
      return;
    }
    if (mergedRef.current) return;
    mergedRef.current = true;
    const local = readGuestCart();
    if (local.length === 0) return;
    (async () => {
      for (const line of local) {
        try {
          await api.post("/cart", {
            productId: line.productId,
            quantity: line.quantity,
          });
        } catch {
          /* skip unavailable items */
        }
      }
      persistGuest([]);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
    })();
  }, [isAuthed, persistGuest, queryClient]);

  const lines: CartLine[] = useMemo(() => {
    if (isAuthed) return (serverCart?.items ?? []).map(toLine);
    return guestLines;
  }, [isAuthed, serverCart, guestLines]);

  const subtotal = useMemo(() => {
    const cents = lines.reduce(
      (sum, l) => sum + Math.round(Number(l.product.price) * 100) * l.quantity,
      0,
    );
    return (cents / 100).toFixed(2);
  }, [lines]);

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  );

  const addItem = useCallback(
    async (product: Product, quantity = 1) => {
      if (isAuthed) {
        await api.post("/cart", { productId: product.id, quantity });
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
        return;
      }
      const existing = guestLines.find((l) => l.productId === product.id);
      const next = existing
        ? guestLines.map((l) =>
            l.productId === product.id
              ? { ...l, quantity: Math.min(l.quantity + quantity, product.stock) }
              : l,
          )
        : [
            ...guestLines,
            {
              productId: product.id,
              quantity,
              product: {
                id: product.id,
                title: product.title,
                price: product.price,
                images: product.images,
                stock: product.stock,
                storeId: product.storeId,
                status: product.status,
              },
            },
          ];
      persistGuest(next);
    },
    [isAuthed, guestLines, persistGuest, queryClient],
  );

  const updateItem = useCallback(
    async (line: CartLine, quantity: number) => {
      if (isAuthed) {
        const serverItem = serverCart?.items.find(
          (i) => i.productId === line.productId,
        );
        if (serverItem) {
          await api.patch(`/cart/${serverItem.id}`, { quantity });
          await queryClient.invalidateQueries({ queryKey: ["cart"] });
        }
        return;
      }
      persistGuest(
        guestLines.map((l) =>
          l.productId === line.productId ? { ...l, quantity } : l,
        ),
      );
    },
    [isAuthed, serverCart, guestLines, persistGuest, queryClient],
  );

  const removeItem = useCallback(
    async (line: CartLine) => {
      if (isAuthed) {
        const serverItem = serverCart?.items.find(
          (i) => i.productId === line.productId,
        );
        if (serverItem) {
          await api.delete(`/cart/${serverItem.id}`);
          await queryClient.invalidateQueries({ queryKey: ["cart"] });
        }
        return;
      }
      persistGuest(guestLines.filter((l) => l.productId !== line.productId));
    },
    [isAuthed, serverCart, guestLines, persistGuest, queryClient],
  );

  const clear = useCallback(async () => {
    if (!isAuthed) persistGuest([]);
    await queryClient.invalidateQueries({ queryKey: ["cart"] });
  }, [isAuthed, persistGuest, queryClient]);

  return (
    <CartContext.Provider
      value={{
        lines,
        itemCount,
        subtotal,
        isLoading: isAuthed ? isLoading : false,
        addItem,
        updateItem,
        removeItem,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
