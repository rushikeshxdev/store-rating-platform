import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storeService } from '../services/storeService';
import { ratingService } from '../services/ratingService';
import RatingInput from '../components/RatingInput';

const UserStoresPage = () => {
  const { user, logout } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedStoreId, setExpandedStoreId] = useState(null);

  // Search states
  const [search, setSearch] = useState({
    name: '',
    address: '',
  });

  // Sorting states
  const [sorting, setSorting] = useState({
    field: 'name',
    direction: 'asc',
  });

  useEffect(() => {
    fetchStores();
  }, [search, sorting]);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await storeService.getAllStores(search, sorting);
      setStores(data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearch((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSort = (field) => {
    setSorting((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleLogout = async () => {
    await logout();
  };

  const toggleRatingForm = (storeId) => {
    setExpandedStoreId(expandedStoreId === storeId ? null : storeId);
  };

  const handleRatingSubmit = async (storeId, userRatingId, ratingValue) => {
    try {
      if (userRatingId) {
        // Update existing rating
        await ratingService.updateRating(userRatingId, { value: ratingValue });
      } else {
        // Create new rating
        await ratingService.createRating({ storeId, value: ratingValue });
      }
      
      // Refresh stores to get updated ratings
      await fetchStores();
    } catch (error) {
      throw error;
    }
  };

  const getSortIcon = (field) => {
    if (sorting.field !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sorting.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const formatRating = (rating) => {
    if (rating === null || rating === undefined) {
      return 'No ratings yet';
    }
    return `${rating.toFixed(1)} / 5`;
  };

  const renderStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating || 0);
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= roundedRating ? 'text-yellow-400' : 'text-gray-300'}>
          ★
        </span>
      );
    }
    
    return <span className="text-2xl">{stars}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/stores" className="text-xl font-bold text-gray-800 hover:text-gray-600">
                Store Rating Platform
              </Link>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded">
                User
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
              <Link
                to="/password-update"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Change Password
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Browse Stores</h2>
          <p className="text-gray-600 mt-2">Discover stores and share your ratings</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Search and Sort Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Search & Sort</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="searchName" className="block text-sm font-medium text-gray-700 mb-1">
                Search by Name
              </label>
              <input
                type="text"
                id="searchName"
                name="name"
                value={search.name}
                onChange={handleSearchChange}
                placeholder="Enter store name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="searchAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Search by Address
              </label>
              <input
                type="text"
                id="searchAddress"
                name="address"
                value={search.address}
                onChange={handleSearchChange}
                placeholder="Enter address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Stores Display */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-600">Loading stores...</div>
          </div>
        ) : stores.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-600">No stores found</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sorting Controls */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 px-3 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="text-sm">Name</span>
                  {getSortIcon('name')}
                </button>
                <button
                  onClick={() => handleSort('address')}
                  className="flex items-center space-x-1 px-3 py-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="text-sm">Address</span>
                  {getSortIcon('address')}
                </button>
              </div>
            </div>

            {/* Store Cards */}
            {stores.map((store) => (
              <div key={store.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{store.name}</h3>
                      <p className="text-gray-600 mb-1">
                        <span className="font-medium">Address:</span> {store.address}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Email:</span> {store.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Overall Rating</div>
                      <div className="flex items-center justify-end space-x-2">
                        {renderStars(store.averageRating)}
                        <span className="text-lg font-semibold text-gray-900">
                          {formatRating(store.averageRating)}
                        </span>
                      </div>
                      {store.totalRatings !== undefined && (
                        <div className="text-xs text-gray-500 mt-1">
                          {store.totalRatings} {store.totalRatings === 1 ? 'rating' : 'ratings'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User's Rating Status */}
                  <div className="border-t pt-4">
                    {store.userRating ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">Your Rating:</span>
                          <span className="text-yellow-500 text-xl">
                            {'★'.repeat(store.userRating.value)}
                            {'☆'.repeat(5 - store.userRating.value)}
                          </span>
                          <span className="text-sm text-gray-600">
                            {store.userRating.value} / 5
                          </span>
                        </div>
                        <button
                          onClick={() => toggleRatingForm(store.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          {expandedStoreId === store.id ? 'Cancel' : 'Modify Rating'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">You haven't rated this store yet</span>
                        <button
                          onClick={() => toggleRatingForm(store.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        >
                          {expandedStoreId === store.id ? 'Cancel' : 'Rate This Store'}
                        </button>
                      </div>
                    )}

                    {/* Rating Form */}
                    {expandedStoreId === store.id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-md">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          {store.userRating ? 'Update Your Rating' : 'Submit Your Rating'}
                        </h4>
                        <RatingInput
                          currentRating={store.userRating?.value}
                          onSubmit={(ratingValue) => 
                            handleRatingSubmit(store.id, store.userRating?.id, ratingValue)
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserStoresPage;
