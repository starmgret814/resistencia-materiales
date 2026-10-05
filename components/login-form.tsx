import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          const response = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          });
          if (response.ok) {
            window.location.href = '/workspace-mc361/content/chapters';
          }
        } catch {}
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.role === 'admin') {
          window.location.href = '/workspace-mc361/content/chapters';
        } else {
          window.location.href = '/workspace-mc361/content/chapters';
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Acceso denegado. Tu correo no está en la lista de editores.');
        await auth.signOut();
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FCF9F7] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl shadow-[#4b1719]/5 border border-[#E5D7D4]">
        <div>
          <h2 className="mt-2 text-center font-serif text-3xl font-bold tracking-tight text-[#3E3030]">
            Acceso a la Plataforma
          </h2>
          <p className="mt-3 text-center text-sm text-[#756565]">
            Inicia sesión para gestionar capítulos, subir imágenes y editar contenido en vivo.
          </p>
        </div>
        
        {error && (
          <div className="rounded-lg bg-[#f8eaea] p-4 text-sm text-[#8B0000] border border-[#d5baba]">
            {error}
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#d5baba] bg-white px-4 py-3.5 text-sm font-semibold text-[#3E3030] transition hover:bg-[#FCF9F7] hover:border-[#8B0000] focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#8B0000] border-t-transparent" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {loading ? 'Conectando...' : 'Continuar con Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
