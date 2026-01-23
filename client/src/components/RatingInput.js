import { useState } from 'react';

const RatingInput = ({ currentRating, onSubmit, disabled = false }) => {
  const [rating, setRating] = useState(currentRating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setMessage({ type: 'error', text: 'Please select a rating between 1 and 5' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await onSubmit(rating);
      setMessage({ type: 'success', text: currentRating ? 'Rating updated successfully!' : 'Rating submitted successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      let errorMessage = 'Failed to submit rating';
      
      if (error.response?.status === 403) {
        errorMessage = 'Permission denied. Only normal users can submit ratings. Please logout and login with a normal user account.';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    const displayRating = hoveredRating || rating;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
          disabled={disabled || isSubmitting}
          className={`text-3xl focus:outline-none transition-colors ${
            disabled || isSubmitting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'
          }`}
          aria-label={`Rate ${i} stars`}
        >
          {i <= displayRating ? (
            <span className="text-yellow-400">★</span>
          ) : (
            <span className="text-gray-300">★</span>
          )}
        </button>
      );
    }

    return stars;
  };

  return (
    <div className="space-y-3">
      {/* Star Rating Display */}
      <div className="flex items-center space-x-1">
        {renderStars()}
        {rating > 0 && (
          <span className="ml-2 text-sm text-gray-600">
            {rating} / 5
          </span>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={disabled || isSubmitting || rating === 0}
        className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
          disabled || isSubmitting || rating === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
        }`}
      >
        {isSubmitting ? 'Submitting...' : currentRating ? 'Update Rating' : 'Submit Rating'}
      </button>

      {/* Success/Error Messages */}
      {message.text && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
};

export default RatingInput;
