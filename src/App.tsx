/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Film, LogOut } from 'lucide-react';
import SearchPage from './pages/SearchPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './AuthContext';

function Layout() {
  const { user, logout } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text">
      <header className="border-b border-brand-border bg-brand-panel/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a 
              href="https://rondatvweb.manus.space" 
              className="text-brand-text-muted hover:text-brand-accent transition-colors flex items-center justify-center h-10 w-10 rounded-full hover:bg-brand-bg/80"
              title="Volver a Ronda TV"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </a>
            <Link to="/" className="flex items-center gap-2 group">
              <img 
                src="https://res.cloudinary.com/dsmmaylh0/image/upload/v1788889356/Logo_Ronda_TV_xcbnjg.jpg" 
                alt="Ronda TV" 
                className="h-10 w-auto group-hover:scale-105 transition-transform mix-blend-lighten" 
              />
            </Link>
          </div>
          <nav className="flex items-center gap-6 text-sm font-bold">
            <Link to="/" className="hover:text-brand-accent transition-colors">Solicitar</Link>
            {user.is_admin === 1 && (
              <Link to="/admin" className="hover:text-brand-accent transition-colors">Admin</Link>
            )}
            <div className="h-4 w-px bg-brand-border mx-2"></div>
            <span className="text-brand-text-muted hidden sm:inline-block">Hola, {user.username}</span>
            <button onClick={logout} className="text-brand-text-muted hover:text-red-400 transition-colors flex items-center gap-1">
              <LogOut size={16} /> <span className="hidden sm:inline-block">Salir</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 lg:p-8">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/admin" element={user.is_admin === 1 ? <AdminPage /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthProvider>
  );
}


