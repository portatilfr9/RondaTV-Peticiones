import React, { useState } from 'react';
import { Search, Loader2, CheckCircle2, Film, Tv, Plus } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requested, setRequested] = useState<Record<number, boolean>>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al buscar en TMDB.');
        setResults(data);
      } else {
        throw new Error('Error de conexión con el servidor (Respuesta no válida)');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (item: any) => {
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdb_id: item.id,
          media_type: item.media_type,
          title: item.title || item.name,
          poster_path: item.poster_path,
          overview: item.overview,
          release_date: item.release_date || item.first_air_date
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al solicitar');

      setRequested(prev => ({ ...prev, [item.id]: true }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-4xl md:text-5xl font-black text-white">
          SOLICITA TU CONTENIDO
        </h2>
        <p className="text-brand-text-muted text-lg">
          Busca cualquier película o serie en nuestra base de datos mundial y nosotros nos encargaremos de añadirla a la plataforma.
        </p>
      </div>

      <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-text-muted group-focus-within:text-brand-accent transition-colors">
          <Search size={24} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej. Stranger Things, Inception..."
          className="w-full bg-brand-panel border-2 border-brand-border rounded-2xl py-4 pl-14 pr-32 text-lg text-white placeholder:text-brand-text-muted/50 focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/20 transition-all outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute inset-y-2 right-2 bg-brand-accent hover:bg-brand-accent/90 text-brand-bg font-bold px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : 'Buscar'}
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center max-w-2xl mx-auto">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 pt-4">
          {results.map((item) => (
            <div key={item.id} className="bg-brand-panel border border-brand-border rounded-xl overflow-hidden group hover:border-brand-accent/50 transition-colors flex flex-col h-full">
              <div className="relative aspect-[2/3] bg-brand-bg/50">
                {item.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                    alt={item.title || item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-text-muted">
                    <Film size={48} className="opacity-20" />
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-brand-bg/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 border border-brand-border">
                  {item.media_type === 'movie' ? <Film size={12} /> : <Tv size={12} />}
                  <span>{item.media_type === 'movie' ? 'Película' : 'Serie'}</span>
                </div>
                {item.global_requested && !item.is_available && (
                  <div className="absolute bottom-2 left-2 right-2 bg-orange-500/90 backdrop-blur text-white text-xs font-bold px-2 py-1.5 rounded-md flex items-center justify-center gap-1 shadow-lg border border-orange-400">
                    <CheckCircle2 size={12} />
                    <span>Solicitada: {new Date(item.global_requested_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-white line-clamp-2 leading-snug flex-1">
                  {item.title || item.name}
                </h3>
                <span className="text-brand-text-muted text-sm mt-1 block">
                  {(item.release_date || item.first_air_date)?.substring(0, 4)}
                </span>
                
                <button
                  onClick={() => handleRequest(item)}
                  disabled={requested[item.id] || item.is_available || item.global_requested}
                  className={`mt-4 w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    item.is_available
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default'
                      : (requested[item.id] || item.global_requested)
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 cursor-default' 
                        : 'bg-brand-bg hover:bg-brand-accent hover:text-brand-bg border border-brand-border hover:border-brand-accent'
                  }`}
                >
                  {item.is_available ? (
                    <>
                      <CheckCircle2 size={16} />
                      Ya Disponible
                    </>
                  ) : (requested[item.id] || item.global_requested) ? (
                    <>
                      <CheckCircle2 size={16} />
                      Ya Solicitado
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Solicitar
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
