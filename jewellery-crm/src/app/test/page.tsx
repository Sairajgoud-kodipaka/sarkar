export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          🎉 Deployment Successful!
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          Your Jewellery CRM is now running on Vercel
        </p>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Environment Check
          </h2>
          <div className="space-y-2 text-left">
            <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}</p>
            <p><strong>Supabase Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set ✓' : 'Not set ✗'}</p>
            <p><strong>Node Env:</strong> {process.env.NODE_ENV}</p>
          </div>
        </div>
        <a 
          href="/login" 
          className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}
