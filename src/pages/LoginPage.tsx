import React, { useState } from 'react';
import { Film, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      login(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg text-brand-text p-4 overflow-hidden relative">
      <a 
        href="https://rondatvweb.manus.space" 
        className="absolute top-6 left-6 z-50 text-brand-text-muted hover:text-brand-accent transition-colors flex items-center justify-center h-12 w-12 rounded-full bg-brand-panel/50 backdrop-blur-md border border-brand-border hover:bg-brand-bg shadow-lg"
        title="Volver a Ronda TV"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </a>

      {/* Optional abstract animated background glow */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-brand-panel/90 backdrop-blur-xl border border-brand-border rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.img 
            src="https://res.cloudinary.com/dsmmaylh0/image/upload/v1788889356/Logo_Ronda_TV_xcbnjg.jpg" 
            alt="Ronda TV" 
            className="h-28 w-auto mb-4 mix-blend-lighten cursor-pointer" 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              y: [0, -8, 0]
            }}
            transition={{ 
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 0.5, ease: "easeOut" },
              opacity: { duration: 0.5 }
            }}
            whileHover={{ scale: 1.05, rotate: [-1, 1, -1, 0] }}
            whileTap={{ scale: 0.95 }}
          />
          <motion.p 
            className="text-brand-text-muted mt-2 text-sm text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Inicia sesión para solicitar series y películas.
          </motion.p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-brand-bg/50 border border-brand-border rounded-xl px-4 py-3 text-white placeholder:text-brand-text-muted/50 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
              placeholder="Tu usuario"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-brand-bg/50 border border-brand-border rounded-xl px-4 py-3 text-white placeholder:text-brand-text-muted/50 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm font-medium bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-accent hover:bg-brand-accent/90 text-brand-bg font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Entrar'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
