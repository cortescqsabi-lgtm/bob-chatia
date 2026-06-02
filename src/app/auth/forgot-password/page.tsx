'use client';

import { useState } from 'react';
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (res.ok) {
      setSent(true);
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
          <p className="text-gray-600 mt-2">Recuperar sua senha</p>
        </div>

        {sent ? (
          <div className="text-center">
            <p className="text-green-600 mb-4">✅ Email enviado! Verifique sua caixa de entrada.</p>
            <Link href="/auth/login" className="text-blue-600 hover:underline">Voltar para login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email cadastrado</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="seu@email.com"
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
              Enviar Email de Recuperação
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          <Link href="/auth/login" className="text-blue-600 hover:underline">Voltar para login</Link>
        </div>
      </div>
    </div>
  );
}
