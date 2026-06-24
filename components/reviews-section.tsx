"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Star } from "lucide-react";
import { toast } from "sonner";
import { StarRating } from "@/components/star-rating";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, apiErrorMessage } from "@/lib/api";
import { fetchProductReviews } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { formatDate, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ReviewsSection({
  productId,
  avgRating,
  reviewCount,
  storeOwnerId,
}: {
  productId: string;
  avgRating: number;
  reviewCount: number;
  storeOwnerId?: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: reviews } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => fetchProductReviews(productId),
    retry: false,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    void queryClient.invalidateQueries({ queryKey: ["product", productId] });
  };

  const alreadyReviewed = reviews?.some((r) => r.userId === user?.id);
  const isStoreOwner =
    user?.role === "SELLER" && !!storeOwnerId && user.id === storeOwnerId;

  return (
    <section>
      <div className="mb-6 flex items-center gap-4">
        <h2 className="text-lg font-semibold">Reviews</h2>
        {reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={avgRating} showValue count={reviewCount} />
          </div>
        )}
      </div>

      {user?.role === "BUYER" && !alreadyReviewed && (
        <ReviewForm productId={productId} onDone={invalidate} />
      )}

      {!reviews || reviews.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
          <MessageSquare className="size-8 opacity-40" />
          No reviews yet. Reviews can be left after an order is delivered.
        </div>
      ) : (
        <ul className="space-y-6">
          {reviews.map((review) => (
            <li key={review.id} className="flex gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="text-xs">
                  {initials(review.user?.name ?? "User")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {review.user?.name ?? "Anonymous"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <StarRating value={review.rating} size={12} className="my-1" />
                {review.comment && (
                  <p className="text-sm leading-relaxed">{review.comment}</p>
                )}
                {review.reply ? (
                  <div className="bg-muted/50 mt-2 rounded-md border-l-2 p-2 text-sm">
                    <span className="font-medium">Seller response:</span>{" "}
                    {review.reply}
                  </div>
                ) : (
                  isStoreOwner && (
                    <ReplyForm reviewId={review.id} onDone={invalidate} />
                  )
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewForm({
  productId,
  onDone,
}: {
  productId: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/reviews", { productId, rating, comment: comment || undefined }),
    onSuccess: () => {
      toast.success("Thanks for your review!");
      setRating(0);
      setComment("");
      onDone();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="bg-muted/30 mb-8 rounded-lg border p-4">
      <p className="mb-2 text-sm font-medium">Write a review</p>
      <div className="mb-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(i)}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "size-6 transition-colors",
                i <= (hover || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-muted text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)…"
        className="mb-3"
        maxLength={2000}
      />
      <Button
        size="sm"
        disabled={rating < 1 || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        Submit review
      </Button>
      <p className="text-muted-foreground mt-2 text-xs">
        You can review a product once it has been delivered to you.
      </p>
    </div>
  );
}

function ReplyForm({
  reviewId,
  onDone,
}: {
  reviewId: string;
  onDone: () => void;
}) {
  const [reply, setReply] = useState("");
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => api.patch(`/reviews/${reviewId}/reply`, { reply }),
    onSuccess: () => {
      toast.success("Reply posted");
      setReply("");
      setOpen(false);
      onDone();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground mt-1 h-7 px-2"
        onClick={() => setOpen(true)}
      >
        Reply
      </Button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <Textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Write a public reply…"
        maxLength={2000}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={!reply.trim() || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Post reply
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
