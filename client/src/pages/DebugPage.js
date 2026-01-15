import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DebugPage = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [apiTest, setApiTest] = useState(null);

  useEffect(() => {
    // Get debug info
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    setDebugInfo({
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token?.substring(0, 50) + '...',
      storedUser: storedUser ? JSON.parse(storedUser) : null,
      contextUser: user,
      apiBaseURL: process.env.REACT_APP_API_URL,
    });

    // Test API call
    testAPI();
  }, [user]);

  const testAPI = async () => {
    try {
      const response = await api.get('/dashboard/owner');
      setApiTest({ success: true, data: response.data });
    } catch (error) {
      setApiTest({
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Information</h1>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* API Test */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Test Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(apiTest, null, 2)}
          </pre>
          <button
            onClick={testAPI}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test API Again
          </button>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-2">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mr-2"
            >
              Clear LocalStorage & Reload
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
