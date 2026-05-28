'use client';

import { useState } from 'react';

export default function AIConfigPage() {
  const [config, setConfig] = useState({
    provider: 'openai',
    model: 'gpt-4-turbo',
    temperature: 0.7,
    maxTokens: 4096,
    ragEnabled: true,
    ragTopK: 3,
    ragThreshold: 0.75
  });

  const [files, setFiles] = useState([
    { name: 'instrucoes.md', size: '2.3 KB', status: 'indexado', date: '2024-03-10' },
    { name: 'produtos.md', size: '15.1 KB', status: 'indexado', date: '2024-03-10' },
    { name: 'precos.md', size: '8.7 KB', status: 'indexado', date: '2024-03-10' },
    { name: 'automacoes.md', size: '12.4 KB', status: 'pendente', date: '-' },
  ]);

  const handleSave = () => {
    alert('Configuração salva com sucesso!');
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">🤖 Configuração do Super Agente IA</h1>

      {/* LLM Configuration */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-semibold mb-4">Configuração do LLM</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provedor</label>
            <select
              value={config.provider}
              onChange={(e) => setConfig({ ...config, provider: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="openai">OpenAI (GPT-4 / GPT-3.5)</option>
              <option value="anthropic">Anthropic (Claude 3)</option>
              <option value="groq">Groq (Llama 3, Mixtral)</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
            <select
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="gpt-4-turbo">GPT-4 Turbo (Recomendado)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Rápido)</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="llama3-70b">Llama 3 70B (Groq)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperatura: {config.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Preciso (0)</span>
              <span>Criativo (2)</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
            <input
              type="number"
              value={config.maxTokens}
              onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2"
              min={256}
              max={8192}
            />
          </div>
        </div>
      </div>

      {/* RAG Configuration */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-semibold mb-4">🧠 Configuração RAG (Busca Contextual)</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.ragEnabled}
              onChange={(e) => setConfig({ ...config, ragEnabled: e.target.checked })}
              className="rounded"
            />
            <span>Ativar busca contextual nos arquivos .MD</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Top K (chunks)</label>
              <input
                type="number"
                value={config.ragTopK}
                onChange={(e) => setConfig({ ...config, ragTopK: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2"
                min={1}
                max={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Threshold</label>
              <input
                type="number"
                value={config.ragThreshold}
                onChange={(e) => setConfig({ ...config, ragThreshold: parseFloat(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2"
                min={0}
                max={1}
                step={0.05}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Base Upload */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-semibold mb-4">📄 Base de Conhecimento (.MD Files)</h2>
        <div className="border-2 border-dashed rounded-lg p-8 text-center mb-4">
          <p className="text-gray-500 mb-2">Arraste seus arquivos .MD aqui ou clique para selecionar</p>
          <p className="text-xs text-gray-400">instrucoes.md • produtos.md • precos.md • automacoes.md</p>
          <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700">
            Selecionar Arquivos
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Arquivo</th>
              <th className="text-left py-2">Tamanho</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="py-2">{file.name}</td>
                <td className="py-2 text-gray-500">{file.size}</td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    file.status === 'indexado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {file.status}
                  </span>
                </td>
                <td className="py-2 text-gray-500">{file.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
      >
        💾 Salvar Configuração
      </button>
    </div>
  );
}
