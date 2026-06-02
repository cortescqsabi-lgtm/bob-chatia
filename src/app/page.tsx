'use client';

import { useState } from 'react';
import Link from 'next/link';

const proof = ['Atende 24/7', 'Qualifica leads', 'Quebra objecoes', 'Organiza no CRM'];

const problems = [
  'Demora para responder no WhatsApp',
  'Lead sem follow-up depois do primeiro contato',
  'Vendedor pulando qualificacao e perdendo contexto',
  'Gestor sem clareza do que esta sendo vendido no atendimento',
];

const modules = [
  {
    title: 'Agente vendedor de IA',
    text: 'Treinado com sua oferta, tom de voz, produtos, precos e objecoes para conduzir conversas com foco em venda.',
  },
  {
    title: 'CRM de conversas',
    text: 'Todos os atendimentos em um painel com historico, status, tags, midias, contatos e controle do funil.',
  },
  {
    title: 'Passagem para humano',
    text: 'Quando a conversa precisa de decisao humana, a equipe recebe o contexto pronto para fechar melhor.',
  },
];

const flows = [
  'Cliente chama no WhatsApp',
  'IA entende a necessidade',
  'IA apresenta a melhor oferta',
  'CRM registra tudo para o time',
];

function ArrowIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m20 6-11 11-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BrandMark() {
  return (
    <div className="grid h-8 w-8 grid-cols-3 gap-1 rounded-sm">
      {Array.from({ length: 9 }).map((_, index) => (
        <span key={index} className={`${index === 4 ? 'bg-white' : 'bg-lime-300'} rounded-[2px]`} />
      ))}
    </div>
  );
}

function ChatPreview() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/70 shadow-2xl shadow-lime-950/40">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(10,185,129,0.16),rgba(190,242,100,0.08)_42%,rgba(8,47,73,0.2))]" />
      <div className="relative border-b border-white/10 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-sm font-black text-white">VendaZap 360</p>
              <p className="text-xs text-emerald-200">Vendedor de IA ativo</p>
            </div>
          </div>
          <span className="rounded-full border border-lime-300/40 bg-lime-300 px-4 py-2 text-xs font-black text-black">
            Online
          </span>
        </div>
      </div>

      <div className="relative grid gap-0 lg:grid-cols-[220px_1fr]">
        <aside className="hidden border-r border-white/10 bg-black/30 p-4 lg:block">
          {['Lead novo', 'Preco enviado', 'Objeção', 'Pronto para fechar'].map((item, index) => (
            <div key={item} className={`mb-3 rounded-2xl border p-4 ${index === 0 ? 'border-lime-300/40 bg-lime-300/10' : 'border-white/10 bg-white/5'}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">{item}</p>
                <span className={`h-2 w-2 rounded-full ${index < 2 ? 'bg-lime-300' : 'bg-cyan-300'}`} />
              </div>
              <p className="mt-1 text-xs text-slate-400">WhatsApp • IA conduzindo</p>
            </div>
          ))}
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Hoje</p>
            <p className="mt-3 text-4xl font-black text-white">38</p>
            <p className="text-xs text-slate-400">leads qualificados</p>
          </div>
        </aside>

        <section className="min-h-[470px] p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-white">Cliente interessado no plano mensal</p>
              <p className="mt-1 text-xs text-slate-400">Dor detectada: demora no atendimento</p>
            </div>
            <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">Intencao alta</span>
          </div>

          <div className="space-y-4">
            <div className="max-w-[82%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/10 px-4 py-3 text-sm leading-6 text-slate-100">
              Oi, queria saber se isso funciona para uma clinica.
            </div>
            <div className="ml-auto max-w-[86%] rounded-2xl rounded-tr-sm bg-lime-300 px-4 py-3 text-sm font-semibold leading-6 text-black">
              Funciona sim. Hoje voces perdem pacientes porque demoram para responder ou porque faltam retornos?
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/10 px-4 py-3 text-sm leading-6 text-slate-100">
              Principalmente fora do horario. Muita gente chama a noite.
            </div>
            <div className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-lime-300 px-4 py-3 text-sm font-semibold leading-6 text-black">
              Entendi. O VendaZap 360 atende 24h, explica sua oferta, pega os dados e entrega o lead pronto para sua equipe fechar.
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {['Urgencia alta', 'Objeção: horario', 'Proximo: proposta'].map((tag) => (
              <div key={tag} className="rounded-2xl border border-lime-300/20 bg-lime-300/10 px-3 py-3 text-center text-xs font-black text-lime-100">
                {tag}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#020807] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(120deg,#020807_0%,#031c17_34%,#063f2f_62%,#020807_100%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(190,242,100,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(190,242,100,0.05)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark />
            <span className="text-xl font-black tracking-tight">VendaZap 360</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-semibold text-slate-300 md:flex">
            <a href="#produto" className="hover:text-white">Produto</a>
            <a href="#ia" className="hover:text-white">IA vendedora</a>
            <a href="#processo" className="hover:text-white">Processo</a>
            <Link href="/auth/login" className="hover:text-white">Login</Link>
            <Link href="/auth/signup" className="rounded-full bg-lime-300 px-5 py-2.5 font-black text-black hover:bg-white">
              Quero vender mais
            </Link>
          </div>

          <button className="rounded-full border border-white/10 p-2 text-white md:hidden" onClick={() => setMobileMenuOpen((open) => !open)} aria-label="Abrir menu">
            <MenuIcon />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-black/90 px-4 py-5 md:hidden">
            <div className="flex flex-col gap-4 text-sm font-semibold text-slate-200">
              <a href="#produto" onClick={() => setMobileMenuOpen(false)}>Produto</a>
              <a href="#ia" onClick={() => setMobileMenuOpen(false)}>IA vendedora</a>
              <a href="#processo" onClick={() => setMobileMenuOpen(false)}>Processo</a>
              <Link href="/auth/login">Login</Link>
              <Link href="/auth/signup" className="rounded-full bg-lime-300 px-5 py-3 text-center font-black text-black">Quero vender mais</Link>
            </div>
          </div>
        )}
      </nav>

      <section className="relative z-10 pt-32">
        <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mx-auto mb-6 inline-flex rounded-full border border-lime-300/30 bg-black/40 px-4 py-2 text-sm font-bold text-lime-100 shadow-[0_0_32px_rgba(190,242,100,0.22)]">
              CRM para WhatsApp com agente de IA vendedor
            </p>
            <h1 className="text-5xl font-black leading-[0.9] tracking-tight text-white sm:text-7xl lg:text-8xl">
              Venda no WhatsApp mesmo quando sua equipe para.
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
              O VendaZap 360 junta CRM, historico de atendimento e um vendedor de IA treinado para responder, qualificar, quebrar objecoes e preparar o lead para compra.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-lime-300 px-8 py-4 text-base font-black text-black shadow-[0_0_45px_rgba(190,242,100,0.28)] hover:bg-white">
                Colocar IA para vender <ArrowIcon className="h-5 w-5" />
              </Link>
              <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-4 text-base font-black text-white hover:bg-white/10">
                Ver painel
              </Link>
            </div>
          </div>

          <div className="mt-16">
            <ChatPreview />
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-black/35 py-6">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {proof.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-100">
              <CheckIcon className="h-5 w-5 flex-none text-lime-300" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="produto" className="relative z-10 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-lime-300">O problema real</p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              Atendimento comum nao foi feito para vender em escala.
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Quando tudo depende de humano, o lead espera, a resposta muda de pessoa para pessoa e a venda perde ritmo. O VendaZap 360 cria processo sem tirar o controle da equipe.
            </p>
          </div>
          <div className="grid gap-4">
            {problems.map((item) => (
              <div key={item} className="rounded-[26px] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/10">
                <div className="flex items-start gap-4">
                  <span className="mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-lime-300 text-sm font-black text-black">!</span>
                  <p className="text-lg font-bold leading-7 text-white">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ia" className="relative z-10 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[34px] border border-lime-300/20 bg-lime-300 text-black">
            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="p-8 sm:p-12">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-950">Diferencial competitivo</p>
                <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
                  Nao e bot. E vendedor treinado na sua oferta.
                </h2>
                <p className="mt-6 text-lg font-semibold leading-8 text-emerald-950/80">
                  Ele sabe o que perguntar, como responder, quando insistir, quando chamar humano e como manter a conversa andando para a compra.
                </p>
              </div>
              <div className="border-t border-black/10 bg-black p-6 sm:p-8 lg:border-l lg:border-t-0">
                <div className="grid gap-4">
                  {modules.map((module) => (
                    <article key={module.title} className="rounded-[24px] border border-white/10 bg-white/[0.06] p-6">
                      <h3 className="text-xl font-black text-white">{module.title}</h3>
                      <p className="mt-3 leading-7 text-slate-300">{module.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="processo" className="relative z-10 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-lime-300">Fluxo de venda</p>
            <h2 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              Do primeiro oi ate o lead pronto no CRM.
            </h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-4">
            {flows.map((flow, index) => (
              <div key={flow} className="relative rounded-[28px] border border-white/10 bg-white/[0.06] p-6">
                <span className="text-5xl font-black text-lime-300">{String(index + 1).padStart(2, '0')}</span>
                <p className="mt-8 text-xl font-black leading-7">{flow}</p>
                {index < flows.length - 1 && <ArrowIcon className="absolute -right-5 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 rounded-full bg-lime-300 p-1.5 text-black md:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[34px] border border-white/10 bg-white/[0.06] p-8 text-center sm:p-14">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-lime-300">Comece agora</p>
            <h2 className="mx-auto mt-4 max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              Pare de deixar dinheiro parado dentro das conversas.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Transforme WhatsApp em processo comercial: resposta rapida, qualificacao, historico e uma IA preparada para vender a sua oferta.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-lime-300 px-8 py-4 text-base font-black text-black hover:bg-white">
                Quero vender com IA <ArrowIcon className="h-5 w-5" />
              </Link>
              <Link href="/auth/login" className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-base font-black text-white hover:bg-white/10">
                Entrar na conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 bg-black/40 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 text-sm text-slate-400 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="font-black text-white">VendaZap 360</p>
              <p>CRM com vendedor de IA para empresas que vendem por conversa.</p>
            </div>
          </div>
          <div className="flex gap-5 font-semibold">
            <Link href="/auth/login" className="hover:text-white">Login</Link>
            <Link href="/auth/signup" className="hover:text-white">Comecar</Link>
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
