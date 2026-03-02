"use client";

import { useState, useEffect } from "react";
import { Star, ThumbsUp, CheckCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useToast } from "./Toast";
import LoadingSpinner from "./LoadingSpinner";

interface Review {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  images?: string[];
  verified: boolean;
  helpful: number;
  createdAt: string;
  user: {
    name?: string | null;
    email: string;
  };
}

interface ProductReviewsProps {
  productId: string;
  productSlug: string;
  averageRating: number;
  reviewCount: number;
}

export default function ProductReviews({
  productId,
  productSlug,
  averageRating,
  reviewCount,
}: ProductReviewsProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    title: "",
    comment: "",
    images: [] as string[],
  });
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  useEffect(() => {
    if (searchParams.get("review") && session) {
      setShowForm(true);
    }
  }, [searchParams, session]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`);
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      showToast("Please sign in to leave a review", "error");
      return;
    }

    try {
      let imageUrls: string[] = [];

      if (files.length > 0) {
        const uploadForm = new FormData();
        files.forEach((file) => uploadForm.append("files", file));

        const uploadRes = await fetch("/api/uploads/review-images", {
          method: "POST",
          body: uploadForm,
        });

        if (!uploadRes.ok) {
          throw new Error("Image upload failed");
        }

        const uploadData = await uploadRes.json();
        imageUrls = uploadData.urls || [];
      }

      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          images: imageUrls,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      showToast("Review submitted successfully!", "success");
      setShowForm(false);
      setFormData({ rating: 5, title: "", comment: "", images: [] });
      setFiles([]);
      fetchReviews();
    } catch (error) {
      showToast("Failed to submit review", "error");
    }
  };

  const handleHelpful = async (reviewId: string) => {
    try {
      await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
      });
      fetchReviews();
    } catch (error) {
      console.error("Error marking helpful:", error);
    }
  };

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Customer Reviews</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-semibold ml-2">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-gray-600">({reviewCount} reviews)</span>
          </div>
        </div>
        {session && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="font-semibold mb-4">Write a Review</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= formData.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Summary of your experience"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Review</label>
              <textarea
                value={formData.comment}
                onChange={(e) =>
                  setFormData({ ...formData, comment: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Share your experience with this product"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Photos (optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Upload up to 4 images to show your product in real life.
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []).slice(0, 4);
                  setFiles(selected);
                }}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              {files.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="relative h-16 w-full rounded overflow-hidden bg-gray-100">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Submit Review
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({ rating: 5, title: "", comment: "", images: [] });
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">
          <LoadingSpinner size="md" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-600">
          No reviews yet. Be the first to review this product!
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">
                      {review.user.name || "Anonymous"}
                    </span>
                    {review.verified && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              {review.title && (
                <h4 className="font-semibold mb-2">{review.title}</h4>
              )}
              {review.comment && (
                <p className="text-gray-700 mb-3">{review.comment}</p>
              )}
              {review.images && review.images.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {review.images.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative h-20 w-full rounded overflow-hidden bg-gray-100"
                    >
                      <img
                        src={url}
                        alt={`Review photo ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => handleHelpful(review.id)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <ThumbsUp className="h-4 w-4" />
                <span>Helpful ({review.helpful})</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

