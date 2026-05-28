'use client';

export default function AnalyticsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📊 Analytics</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-4">Métricas de Performance</h3>
          <div className="space-y-4">
            {[
              { label: 'Tempo Médio de Resposta', value: '2.3s', trend: '+12%' },
              { label: 'Taxa de Resolução', value: '78%', trend: '+5%' },
              { label: 'Mensagens Processadas', value: '1.234', trend: '+23%' },
              { label: 'Custo Médio por Resposta', value: 'R$ 0,03', trend: '-8%' },
            ].map((metric, idx) => (
              <div key={idx} className="flex justify-between items-center pb-2 border-b last:border-0">
                <span className="text-gray-600">{metric.label}</span>
                <div className="text-right">
                  <p className="font-semibold">{metric.value}</p>
                  <span className={`text-xs ${metric.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Usage */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-4">🤖 Uso da IA</h3>
          <div className="space-y-4">
            {[
              { provider: 'OpenAI (GPT-4)', tokens: '45.2K', cost: 'R$ 12,34' },
              { provider: 'Groq (Llama-3)', tokens: '12.8K', cost: 'R$ 0,02' },
              { provider: 'Anthropic (Claude)', tokens: '8.1K', cost: 'R$ 3,45' },
            ].map((usage, idx) => (
              <div key={idx} className="flex justify-between items-center pb-2 border-b last:border-0">
                <span className="text-gray-600">{usage.provider}</span>
                <div className="text-right text-sm">
                  <p className="font-medium">{usage.tokens}</p>
                  <span className="text-gray-500">{usage.cost}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Channels Distribution */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-4">📱 Distribuição por Canal</h3>
          <div className="space-y-3">
            {[
              { channel: 'WhatsApp', count: '890', pct: 71 },
              { channel: 'Instagram', count: '245', pct: 20 },
              { channel: 'Facebook', count: '99', pct: 9 },
            ].map((ch, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{ch.channel}</span>
                  <span className="text-gray-500">{ch.count} mensagens</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-purple-500' : 'bg-blue-500'}`}
                    style={{ width: `${ch.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-4">😊 Análise de Sentimento</h3>
          <div className="space-y-3">
            {[
              { sentiment: 'Positivo', pct: 65, color: 'bg-green-500' },
              { sentiment: 'Neutro', pct: 25, color: 'bg-yellow-500' },
              { sentiment: 'Negativo', pct: 10, color: 'bg-red-500' },
            ].map((s, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{s.sentiment}</span>
                  <span className="text-gray-500">{s.pct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
