import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
  rating: number; // 0.5 to 5.0
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showNumber = true,
  interactive = false,
  onChange,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const handleClick = (starIndex: number, isHalf: boolean) => {
    if (!interactive || !onChange) return;
    
    const newRating = starIndex + (isHalf ? 0.5 : 1);
    onChange(newRating);
  };

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const fillPercentage = Math.min(Math.max((rating - index) * 100, 0), 100);
    
    const isFullStar = fillPercentage === 100;
    const isHalfStar = fillPercentage >= 40 && fillPercentage < 100;
    const isEmpty = fillPercentage < 40;

    return (
      <div
        key={index}
        className={`relative inline-block ${interactive ? "cursor-pointer" : ""}`}
        onClick={() => !interactive ? null : handleClick(index, false)}
      >
        {isFullStar && (
          <Star
            className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
          />
        )}
        {isHalfStar && (
          <div className="relative">
            <Star className={`${sizeClasses[size]} text-gray-300`} />
            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: "50%" }}>
              <Star className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
            </div>
          </div>
        )}
        {isEmpty && (
          <Star className={`${sizeClasses[size]} text-gray-300`} />
        )}
        
        {interactive && (
          <div
            className="absolute top-0 left-0 w-1/2 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleClick(index, true);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: maxRating }, (_, i) => renderStar(i))}
      </div>
      {showNumber && (
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// Interactive version for review submission
interface InteractiveStarRatingProps {
  value: number; // 1-10 (internal scale)
  onChange: (value: number) => void;
  label?: string;
  required?: boolean;
}

export function InteractiveStarRating({
  value,
  onChange,
  label,
  required = false,
}: InteractiveStarRatingProps) {
  const displayRating = value / 2; // Convert 1-10 to 0.5-5.0
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const handleStarClick = (starIndex: number, isHalf: boolean) => {
    const displayValue = starIndex + (isHalf ? 0.5 : 1);
    const internalValue = Math.round(displayValue * 2); // Convert back to 1-10
    onChange(internalValue);
  };

  const handleStarHover = (starIndex: number, isHalf: boolean) => {
    const displayValue = starIndex + (isHalf ? 0.5 : 1);
    setHoverRating(displayValue);
  };

  const currentRating = hoverRating !== null ? hoverRating : displayRating;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div 
        className="flex items-center gap-1"
        onMouseLeave={() => setHoverRating(null)}
      >
        {Array.from({ length: 5 }, (_, starIndex) => (
          <div
            key={starIndex}
            className="relative inline-block cursor-pointer"
          >
            {/* Full star click area */}
            <div
              className="relative"
              onMouseEnter={() => handleStarHover(starIndex, false)}
              onClick={() => handleStarClick(starIndex, false)}
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  currentRating >= starIndex + 1
                    ? "fill-yellow-400 text-yellow-400"
                    : currentRating >= starIndex + 0.5
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 hover:text-yellow-200"
                }`}
              />
              {currentRating >= starIndex + 0.5 && currentRating < starIndex + 1 && (
                <div className="absolute top-0 left-0 overflow-hidden" style={{ width: "50%" }}>
                  <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                </div>
              )}
            </div>
            
            {/* Half star click area */}
            <div
              className="absolute top-0 left-0 w-1/2 h-full cursor-pointer z-10"
              onMouseEnter={() => handleStarHover(starIndex, true)}
              onClick={(e) => {
                e.stopPropagation();
                handleStarClick(starIndex, true);
              }}
            />
          </div>
        ))}
        <span className="text-sm text-gray-600 ml-2">
          {currentRating.toFixed(1)} / 5.0
        </span>
      </div>
    </div>
  );
}

import React from "react";

