'use client';

import { useState } from 'react';

type Section = {
  icon: string;
  title: string;
  color: string;
  bg: string;
  items: { q: string; a: string }[];
};

const sections: Section[] = [
  {
    icon: '🚀',
    title: 'Primeiros Passos',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-100',
    items: [
      {
        q: 'Como faço login na plataforma?',
        a: 'Acesse /auth/login, insira seu e-mail e senha cadastrados. Caso seja seu primeiro acesso, utilize o link "Criar conta" para registrar sua empresa.',
      },
      {
        q: 'Como criar outros usuários (vendedores)?',
        a: 'Vá em Configurações > Usuários > clique em "+ Novo usuário". Defina nome, e-mail, senha e perfil (Admin ou Vendedor). Vendedores têm acesso apenas à tela de Conversas.',
      },
      {
        q: 'Esqueci minha senha. O que faço?',
        a: 'Na tela de login, clique em "Esqueceu a senha?". Insira seu e-mail e você receberá um link de redefinição de senha.',
      },
    ],
  },
  {
    icon: '🤖',
    title: 'Agente de IA',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-100',
    items: [
      {
        q: 'O que é o Prompt Comercial?',
        a: 'É a instrução principal do agente: define a personalidade, o tom de voz, a missão e como ele deve conduzir cada conversa de vendas. Configure em Config AI > Prompt Comercial.',
      },
      {
        q: 'Para que servem os Prompts Positivo e Negativo?',
        a: 'O Prompt Positivo lista o que o agente deve fazer e destacar (ex: mencionar parcelamento, focar em benefícios). O Prompt Negativo lista o que ele não deve fazer (ex: inventar informações, falar de concorrentes).',
      },
      {
        q: 'Como faço para o agente conhecer meus produtos?',
        a: 'Na aba Config AI > Catálogo de Produtos, faça upload da sua planilha Excel (.xlsx) ou CSV com a lista de produtos, preços e características. O sistema indexa automaticamente.',
      },
      {
        q: 'Como atualizo os preços dos produtos?',
        a: 'Na lista de arquivos indexados, clique no ícone 🗑️ do arquivo antigo para excluí-lo, depois faça o upload da planilha atualizada.',
      },
      {
        q: 'O que é o RAG (Base de Conhecimento)?',
        a: 'RAG é a tecnologia que permite ao agente consultar seus arquivos antes de responder. Quando ativado, ele busca os trechos mais relevantes da sua base de produtos para dar respostas precisas.',
      },
      {
        q: 'Como pausar as respostas automáticas?',
        a: 'Em Config AI, clique no toggle "Respostas automáticas ativas" no canto superior direito. Isso pausa o agente no WhatsApp sem perder as configurações.',
      },
    ],
  },
  {
    icon: '💬',
    title: 'Conversas e WhatsApp',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-100',
    items: [
      {
        q: 'Como conectar meu WhatsApp?',
        a: 'Vá em Configurações > Integração WhatsApp e siga as instruções para vincular sua instância via Evolution API ou Meta API.',
      },
      {
        q: 'Como assumir uma conversa manualmente?',
        a: 'Na tela de Conversas, selecione o contato e comece a digitar. O agente detecta a presença humana e pausa as respostas automáticas para aquele contato.',
      },
      {
        q: 'O que são as tags de contato?',
        a: 'Tags são etiquetas para organizar seus contatos (ex: "Lead Quente", "Cliente VIP", "Aguardando"). Você pode criar e editar tags em Configurações.',
      },
      {
        q: 'Como usar respostas rápidas?',
        a: 'Em Configurações > Respostas Rápidas, cadastre textos prontos. Na tela de conversa, clique no ícone de respostas rápidas para inserir automaticamente.',
      },
    ],
  },
  {
    icon: '📊',
    title: 'Analytics e Relatórios',
    color: 'text-orange-700',
    bg: 'bg-orange-50 border-orange-100',
    items: [
      {
        q: 'O que mostra a aba Analytics?',
        a: 'Exibe métricas como total de conversas, mensagens enviadas, taxa de resposta do agente, horários de pico e desempenho por período.',
      },
      {
        q: 'Os dados são em tempo real?',
        a: 'Sim, o painel é atualizado com os dados mais recentes do banco de dados toda vez que você acessa ou recarrega a página.',
      },
    ],
  },
  {
    icon: '⚙️',
    title: 'Configurações',
    color: 'text-gray-700',
    bg: 'bg-gray-50 border-gray-200',
    items: [
      {
        q: 'Qual a diferença entre Admin e Vendedor?',
        a: 'Admin tem acesso total ao sistema (Conversas, Analytics, Config AI, Configurações). Vendedor acessa apenas a tela de Conversas.',
      },
      {
        q: 'Posso ter múltiplos usuários admin?',
        a: 'Sim. Ao criar um novo usuário em Configurações, selecione o perfil "Admin" para conceder acesso completo.',
      },
      {
        q: 'Como alterar minha senha?',
        a: 'Em Configurações > Usuários, localize seu usuário, clique em editar e preencha o campo "Nova Senha".',
      },
    ],
  },
  {
    icon: '🆘',
    title: 'Problemas Comuns',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-100',
    items: [
      {
        q: 'Fiz login mas não vejo o menu de Configurações.',
        a: 'Seu usuário pode estar com perfil "Vendedor". Peça ao administrador para alterar seu perfil para "Admin" em Configurações > Usuários. Depois, faça logout e entre novamente.',
      },
      {
        q: 'O agente não está respondendo no WhatsApp.',
        a: 'Verifique: (1) se as Respostas Automáticas estão ativadas em Config AI; (2) se a instância WhatsApp está conectada em Configurações; (3) se a chave da OpenAI está correta.',
      },
      {
        q: 'O upload da planilha falhou.',
        a: 'Certifique-se de que o arquivo está no formato .xlsx, .xls ou .csv, e que tem menos de 10MB. Planilhas muito grandes podem ser divididas em partes.',
      },
      {
        q: 'O agente deu uma informação errada sobre um produto.',
        a: 'Atualize o catálogo: exclua o arquivo antigo na seção de arquivos indexados e faça upload da versão corrigida. A IA passa a usar os dados novos imediatamente.',
      },
    ],
  },
];

function AccordionItem({ item }: { item: { q: string; a: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-gray-800">{item.q}</span>
        <span className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
          </svg>
        </span>
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-gray-600">{item.a}</p>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? sections.map((s) => ({
        ...s,
        items: s.items.filter(
          (i) =>
            i.q.toLowerCase().includes(search.toLowerCase()) ||
            i.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((s) => s.items.length > 0)
    : sections;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0084c7]">Central de Ajuda</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Como podemos ajudar?</h1>
        <p className="mt-2 text-sm text-gray-500">
          Encontre respostas para as dúvidas mais comuns sobre o VendaZap 360.
        </p>

        {/* Search */}
        <div className="relative mt-5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar em todas as dúvidas..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#0084c7] focus:ring-2 focus:ring-[#0084c7]/10"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Sections */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-400">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium">Nenhum resultado para &ldquo;{search}&rdquo;</p>
          <p className="text-sm mt-1">Tente buscar com outras palavras.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((section) => (
            <section key={section.title} className={`rounded-xl border p-6 ${section.bg}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{section.icon}</span>
                <h2 className={`text-base font-bold ${section.color}`}>{section.title}</h2>
              </div>
              <div className="rounded-lg bg-white border border-white/80 px-4 divide-y divide-gray-100">
                {section.items.map((item) => (
                  <AccordionItem key={item.q} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Footer contact */}
      <div className="mt-8 rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center">
        <p className="text-sm font-semibold text-gray-700">Não encontrou o que precisava?</p>
        <p className="mt-1 text-sm text-gray-500">
          Entre em contato com o suporte pelo WhatsApp ou e-mail disponível no seu contrato.
        </p>
      </div>
    </div>
  );
}
