interface HalfStarRatingProps {
  rating: number;
  hoverRating: number;
  onStarClick: (star: number, event: React.MouseEvent<HTMLButtonElement>) => void;
  onStarHover: (star: number, event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave: () => void;
  isLoading?: boolean;
}

export function HalfStarRating({
  rating,
  hoverRating,
  onStarClick,
  onStarHover,
  onMouseLeave,
  isLoading,
}: HalfStarRatingProps) {
  const renderStar = (star: number) => {
    const currentRating = hoverRating || rating;
    const isFullStar = currentRating >= star;
    const isHalfStar = currentRating >= star - 0.5 && currentRating < star;

    return (
      <button
        key={star}
        type="button"
        onClick={(e) => onStarClick(star, e)}
        onMouseMove={(e) => onStarHover(star, e)}
        onMouseLeave={onMouseLeave}
        disabled={isLoading}
        className="transition-transform hover:scale-110 cursor-pointer p-0"
        data-testid={`rating-star-${star}`}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-300"
        >
          {/* Empty star background */}
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>

        {/* Filled part (half or full) */}
        {(isFullStar || isHalfStar) && (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            className={`absolute top-0 left-0 ${
              isFullStar ? "text-yellow-400" : "text-yellow-400"
            }`}
            style={{
              clipPath: isFullStar
                ? "inset(0)"
                : "polygon(0 0, 50% 0, 50% 100%, 0 100%)",
            }}
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill="currentColor"
            />
          </svg>
        )}
      </button>
    );
  };

  return (
    <div className="flex gap-2 relative" data-testid="rating-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <div key={star} className="relative">
          {renderStar(star)}
        </div>
      ))}
    </div>
  );
}
