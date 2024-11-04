import React, { useState } from 'react';
import { Download, Loader2, Send } from 'lucide-react';
import OpenAI from 'openai';

interface Response {
  id: string;
  systemPrompt: string;
  userPrompt: string;
  response: string;
  timestamp: string;
}

function App() {
  const [apiKey, setApiKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [firstPrompt, setFirstPrompt] = useState('');
  const [subsequentPrompt, setSubsequentPrompt] = useState('');
  const [executionCount, setExecutionCount] = useState(1);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateResponse = async () => {
    if (!apiKey) {
      setError('APIキーを入力してください');
      return;
    }
    if (!systemPrompt || !firstPrompt || (executionCount > 1 && !subsequentPrompt)) {
      setError('プロンプトを入力してください');
      return;
    }

    setIsLoading(true);
    setError('');
    setResponses([]); // 実行時に前回の結果をクリア

    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });

    try {
      const newResponses: Response[] = [];
      let lastResponse = '';

      for (let i = 0; i < executionCount; i++) {
        const currentPrompt = i === 0 
          ? firstPrompt 
          : `${subsequentPrompt}\n\n前回の応答:\n${lastResponse}`;

        const completion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: currentPrompt }
          ],
          model: "gpt-3.5-turbo",
        });

        lastResponse = completion.choices[0]?.message?.content || '';
        
        newResponses.push({
          id: `${Date.now()}-${i}`,
          systemPrompt,
          userPrompt: currentPrompt,
          response: lastResponse,
          timestamp: new Date().toISOString()
        });
      }

      setResponses(newResponses);
    } catch (err) {
      setError('APIリクエストに失敗しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResponses = () => {
    const content = responses.map(r => r.response).join('\n-----\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">OpenAI API Chain</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">APIキー</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="sk-..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">システムプロンプト</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                rows={3}
                placeholder="AIの役割を設定してください"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">1回目のユーザープロンプト</label>
              <textarea
                value={firstPrompt}
                onChange={(e) => setFirstPrompt(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                rows={3}
                placeholder="最初の質問や指示を入力してください"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">2回目以降のユーザープロンプト</label>
              <textarea
                value={subsequentPrompt}
                onChange={(e) => setSubsequentPrompt(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                rows={3}
                placeholder="2回目以降の質問や指示を入力してください"
                disabled={executionCount === 1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">実行回数</label>
              <input
                type="number"
                min="1"
                value={executionCount}
                onChange={(e) => setExecutionCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={generateResponse}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> 処理中...</>
                ) : (
                  <><Send className="-ml-1 mr-2 h-4 w-4" /> 実行</>
                )}
              </button>

              {responses.length > 0 && (
                <button
                  onClick={downloadResponses}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Download className="-ml-1 mr-2 h-4 w-4" />
                  ダウンロード
                </button>
              )}
            </div>
          </div>
        </div>

        {responses.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">応答結果</h2>
            <div className="space-y-6">
              {responses.map((response, index) => (
                <div key={response.id} className="border-l-4 border-indigo-500 pl-4 py-2">
                  <div className="text-sm text-gray-500 mb-2">実行 {index + 1}</div>
                  <div className="whitespace-pre-wrap text-sm">{response.response}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;