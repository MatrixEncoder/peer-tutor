// A simple star rating display component
// Pass `rating` (0-5) and optionally `size` ("sm" or "lg")

interface StarRatingProps {
  rating: number;
  size?: "sm" | "lg";
}

export default function StarRating({ rating, size = "sm" }: StarRatingProps) {
  const starSize = size === "lg" ? "text-xl" : "text-sm";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${starSize} ${
            star <= Math.round(rating) ? "text-amber-400" : "text-slate-700"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}
