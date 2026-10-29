import { useAuth } from '../context/AuthContext';

// Temporary Home placeholder – replaced in Stage 4 with the item search UI
export default function Home() {
  const { user } = useAuth();

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <h1 className="text-3xl font-semibold text-gray-900">
          {user ? `Welcome, ${user.name}` : 'Find free items near you'}
        </h1>
        <p className="mt-2 text-gray-600 text-sm">
          Item listings are coming in Stage 4.
        </p>
      </div>
    </main>
  );
}
