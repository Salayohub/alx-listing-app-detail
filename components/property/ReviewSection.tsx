import React from "react";
import { Star } from "lucide-react"; // optional: for better star icons
import { ReviewProps } from "@/interfaces";



const ReviewSection: React.FC<ReviewProps> = ({ reviews }) => {

  if (!reviews || reviews.length === 0) {
    return <p className="text-gray-600">No reviews yet. Be the first to leave one!</p>;
  }

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-semibold mb-4 text-gray-900">Reviews</h3>

     (
        <div className="space-y-6">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-start gap-4"
            >
              {/* Reviewer Info */}
              <div className="flex-shrink-0">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
              </div>

              {/* Review Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-800">{review.name}</p>

                  {/* Rating Display */}
                  <div className="flex items-center">
                    {[...Array(5)].map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        size={16}
                        className={
                          starIndex < review.rating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                </div>

                <p className="text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
                <span className="text-xs text-gray-400 mt-1 block">
                  {review.date ? review.date : "Recently posted"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )
    </div>
  );
};

export default ReviewSection;
