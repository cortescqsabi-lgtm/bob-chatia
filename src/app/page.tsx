'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MultiChat AI
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">Login</Link>
              <Link
                href="/auth/signup"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Teste Grátis
              </Link>
            </div>
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm mb-6">
            🚀 SaaS Multi-Tenant com Super Agente IA
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Conecte WhatsApp, Instagram e Facebook em{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              um único CRM Inteligente
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Automatize atendimentos com Super Agente IA treinável. Cada empresa treina seu próprio assistente com instruções, produtos e preços personalizados.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/auth/signup"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg"
            >
              Começar Teste Grátis de 7 Dias
            </Link>
            <Link
              href="/dashboard"
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 transition"
            >
              Ver Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Tudo que você precisa em um só lugar</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: '🤖 Super Agente IA',
                desc: 'Treinável com seus dados. Cada empresa tem seu próprio assistente com instruções, produtos e regras de negócio.'
              },
              {
                title: '📱 Multi-Canal',
                desc: 'WhatsApp, Instagram e Facebook em um único painel. Evolution API + Meta Graph API integrados.'
              },
              {
                title: '📊 CRM Completo',
                desc: 'Gestão de clientes, histórico de conversas, tickets, automações e dashboard analítico.'
              },
              {
                title: '🔧 RAG Inteligente',
                desc: 'Busca contextual nos seus arquivos .MD. A IA responde com base nos seus produtos e instruções.'
              },
              {
                title: '🔒 Multi-Tenant Seguro',
                desc: 'Isolamento completo entre empresas. RLS policies no Supabase. Dados criptografados.'
              },
              {
                title: '🚀 Deploy na Vercel',
                desc: 'Infraestrutura serverless. Evolution API na Hostinger. Escala automática.'
              }
            ].map((feature, index) => (
              <div key={index} className="p-6 rounded-xl border hover:shadow-lg transition">
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">Planos para todos os tamanhos</h2>
          <p className="text-xl text-gray-600 text-center mb-12">Teste grátis por 7 dias, sem compromisso.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: 'R$ 97',
                features: ['1.000 mensagens/mês', '3 canais', 'IA treinável básica', 'Dashboard básico', 'Suporte comunitário']
              },
              {
                name: 'Professional',
                price: 'R$ 297',
                popular: true,
                features: ['5.000 mensagens/mês', 'Canais ilimitados', 'IA avançada + RAG', 'Dashboard analítico', 'API access', 'Suporte prioritário']
              },
              {
                name: 'Enterprise',
                price: 'Customizado',
                features: ['Mensagens ilimitadas', 'Canais ilimitados', 'IA Enterprise', 'SLA garantido', 'Suporte dedicado', 'Onboarding personalizado']
              }
            ].map((plan, index) => (
              <div key={index} className={`bg-white rounded-xl p-8 border-2 ${plan.popular ? 'border-blue-500 shadow-xl scale-105' : 'border-gray-200'}`}>
                {plan.popular && <div className="bg-blue-600 text-white text-sm px-4 py-1 rounded-full inline-block mb-4">Mais Popular</div>}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-4xl font-bold mb-6">{plan.price}<span className="text-lg text-gray-500">/mês</span></p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-green-500">✅</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className={`block text-center py-3 rounded-lg font-semibold ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'border-2 border-gray-300 hover:border-gray-400'}`}
                >
                  Começar Teste Grátis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">Pronto para transformar seu atendimento?</h2>
          <p className="text-xl text-blue-100 mb-10">Teste grátis por 7 dias. Sem cartão de crédito.</p>
          <Link
            href="/auth/signup"
            className="bg-white text-blue-600 px-10 py-4 rounded-lg text-xl font-semibold hover:bg-blue-50 transition shadow-lg"
          >
            🚀 Começar Agora
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-white font-bold mb-4">MultiChat AI</h4>
            <p className="text-sm">CRM Unificado com Super Agente IA para WhatsApp, Instagram e Facebook.</p>
          </div>
          <div>
            <h5 className="text-white font-semibold mb-3">Produto</h5>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li><Link href="/pricing">Preços</Link></li>
              <li><Link href="/docs">Documentação</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-semibold mb-3">Suporte</h5>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:support@multichat.ai">support@multichat.ai</a></li>
              <li><Link href="/docs">FAQ</Link></li>
              <li><Link href="/docs">API Docs</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-semibold mb-3">Legal</h5>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy">Privacidade</Link></li>
              <li><Link href="/terms">Termos</Link></li>
              <li><Link href="/security">Segurança</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          &copy; 2024 MultiChat AI. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
