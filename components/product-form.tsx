"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCategories } from "@/lib/queries";
import { api, unwrap, apiErrorMessage } from "@/lib/api";
import type { Product, ProductStatus } from "@/lib/types";
import { toast } from "sonner";

const STATUSES: { value: ProductStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
];

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
  });

  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [stock, setStock] = useState(String(product?.stock ?? ""));
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [status, setStatus] = useState<ProductStatus>(
    product?.status ?? "DRAFT",
  );
  const images = product?.images ?? [];
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  async function uploadImages(productId: string) {
    if (files.length === 0) return;
    const form = new FormData();
    files.forEach((f) => form.append("images", f));
    await api.post(`/products/${productId}/images`, form);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Please choose a category");
      return;
    }
    setSaving(true);
    const payload = {
      title,
      description,
      price: Number(price),
      stock: Number(stock),
      categoryId,
      status,
    };
    try {
      if (product) {
        await api.patch(`/products/${product.id}`, payload);
        await uploadImages(product.id);
      } else {
        const created = await unwrap<Product>(api.post("/products", payload));
        await uploadImages(created.id);
      }
      await queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      toast.success(product ? "Product updated" : "Product created");
      router.push("/seller/products");
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setSaving(false);
    }
  }

  const previews = [...images, ...files.map((f) => URL.createObjectURL(f))];

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          required
          minLength={3}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Price (USD)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            required
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => v && setStatus(v as ProductStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label>Images (up to 5)</Label>
        <div className="flex flex-wrap gap-3">
          {previews.map((src, i) => (
            <div
              key={i}
              className="bg-muted relative size-20 overflow-hidden rounded-md border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-cover" />
              {i >= images.length && (
                <button
                  type="button"
                  onClick={() =>
                    setFiles((prev) =>
                      prev.filter((_, idx) => idx !== i - images.length),
                    )
                  }
                  className="bg-background/80 absolute top-0.5 right-0.5 rounded-full p-0.5"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          ))}
          {previews.length < 5 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-muted-foreground hover:bg-muted/50 grid size-20 place-items-center rounded-md border border-dashed"
            >
              <div className="flex flex-col items-center gap-1 text-xs">
                <Upload className="size-4" />
                Upload
              </div>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              setFiles((prev) => [...prev, ...picked].slice(0, 5 - images.length));
            }}
          />
        </div>
        {previews.length === 0 && (
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <ImageIcon className="size-3" /> No images yet
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {product ? "Save changes" : "Create product"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/seller/products")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
