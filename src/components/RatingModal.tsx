import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useActivity } from '../hooks/useActivity';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaTitle: string;
  mediaId: string;
  mediaType: string;
}

export function RatingModal({ isOpen, onClose, mediaTitle, mediaId, mediaType }: RatingModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [review, setReview] = useState<string>('');
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const { trackActivity } = useActivity();
  const { user } = useAuth();
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to rate content');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Track rating activity
      await trackActivity({
        type: 'rate',
        title: mediaTitle,
        media_id: mediaId,
        media_type: mediaType,
        metadata: {
          rating: rating.toString()
        }
      });
      
      // If there's a review, also track that as a separate activity
      if (review.trim()) {
        await trackActivity({
          type: 'review',
          title: mediaTitle,
          media_id: mediaId,
          media_type: mediaType,
          metadata: {
            content: review.trim(),
            rating: rating.toString()
          }
        });
      }
      
      toast.success('Thanks for your rating!');
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-4">Rate this title</h2>
        <h3 className="text-lg text-gray-200 mb-6">{mediaTitle}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star rating */}
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(null)}
                className="focus:outline-none"
              >
                <Star 
                  className={`w-8 h-8 ${
                    (hoveredStar !== null ? star <= hoveredStar : star <= rating)
                      ? 'fill-yellow-500 text-yellow-500' 
                      : 'text-gray-500'
                  } transition-colors`} 
                />
              </button>
            ))}
          </div>
          <p className="text-center text-white font-medium">
            {rating}/10 - {
              rating <= 3 ? "Poor" :
              rating <= 5 ? "Average" :
              rating <= 7 ? "Good" :
              rating <= 9 ? "Great" :
              "Masterpiece"
            }
          </p>
          
          {/* Optional review */}
          <div>
            <label htmlFor="review" className="block text-sm font-medium text-gray-300 mb-2">
              Write a review (optional)
            </label>
            <textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
              placeholder="Share your thoughts about this title..."
            />
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-end gap-4">
            <button 
              type="button"
              className="px-4 py-2 bg-zinc-800 text-white rounded-lg"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
