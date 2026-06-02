'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function BrandMark() {
  return (
    <div className="grid h-8 w-8 grid-cols-3 gap-1 rounded-md bg-black/90 p-1 flex-shrink-0">
      {Array.from({ length: 9 }).map((_, index) => (
        <span key={index} className={`${index === 4 ? 'bg-white' : 'bg-lime-300'} rounded-[2px]`} />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        const user = {
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || data.user.email,
          email: data.user.email,
          role: data.user._resolvedRole || data.user.user_metadata?.role || 'admin',
          tenant_id: data.user.tenant_id
        };
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('userRole', user.role);
      }
      router.push('/dashboard');
    } else {
      const data = await res.json();
      setError(data.error?.message || 'Erro ao fazer login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-3">
            <BrandMark />
            <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              VendaZap 360
            </span>
          </Link>
          <p className="text-gray-600 mt-2">Entre na sua conta</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
            Esqueceu a senha?
          </Link>
          <span className="mx-2">|</span>
          <Link href="/auth/signup" className="text-blue-600 hover:underline">
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
