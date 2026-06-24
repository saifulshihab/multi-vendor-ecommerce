"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ProductForm } from "@/components/product-form";
import { fetchProduct } from "@/lib/queries";

export default function EditProductPage() {
  const id = useParams().id as string;
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit product</h1>
      {isLoading ? (
        <Loader2 className="size-6 animate-spin" />
      ) : product ? (
        <ProductForm product={product} />
      ) : (
        <p className="text-muted-foreground">Product not found.</p>
      )}
    </div>
  );
}
