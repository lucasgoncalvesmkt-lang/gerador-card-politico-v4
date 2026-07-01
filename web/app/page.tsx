
'use client';

import { useState } from 'react';
import { models } from './models';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState<string>(models[0].slug);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  async function gerar() {
    if (!file) {
      alert('Envie a foto do apoiador.');
      return;
    }

    setLoading(true);
    setResult('');

    const form = new FormData();
    form.append('photo', file);
    form.append('model', model);

    const res = await fetch('/api/generate', { method: 'POST', body: form });

    if (!res.ok) {
      const text = await res.text();
      alert(text || 'Erro ao gerar card.');
      setLoading(false);
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setResult(url);
    setLoading(false);
  }

  return (
    <main>
      <div className="card">
        <h1>FAÇA SEU CARD DE APOIO! ⭐</h1>
        <p>Escolha sua liderança, envie uma foto e gere automaticamente seu card personalizado.</p>

        <label>Escolha seu Deputado Federal</label>
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          {models.map((item) => (
            <option key={item.slug} value={item.slug}>{item.name}</option>
          ))}
        </select>

        <label>Envie sua foto</label>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />

        <button onClick={gerar} disabled={loading}>
          {loading ? 'Gerando...' : 'BAIXAR MEU CARD'}
        </button>
      </div>

      {result && (
        <div className="card">
          <h2>Card pronto</h2>
          <img className="preview" src={result} alt="Card gerado" />
          <a className="download" href={result} download="card-de-apoio.png">Baixar card</a>
        </div>
      )}
    </main>
  );
}
