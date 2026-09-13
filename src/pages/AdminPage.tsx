import React, { useEffect, useState } from 'react';
import { Loader2, Film, Tv, Clock, CheckCircle2, XCircle, AlertCircle, Users, ListVideo, Plus, Trash2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'users'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    Promise.all([fetchRequests(), fetchUsers()]).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchRequests();
    } catch (error) {
      alert('Error updating status');
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    
    setCreatingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword, is_admin: newIsAdmin })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setNewUsername('');
      setNewPassword('');
      setNewIsAdmin(false);
      fetchUsers();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCreatingUser(false);
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (error) {
      console.error(error);
    }
    setUserToDelete(null);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const filteredRequests = requests.filter(req => statusFilter === 'all' || req.status === statusFilter);
    
    doc.text('Listado de Solicitudes - Ronda TV', 14, 15);
    
    const tableData = filteredRequests.map(req => [
      req.title,
      req.media_type === 'movie' ? 'Película' : 'Serie',
      req.status,
      new Date(req.created_at).toLocaleDateString()
    ]);
    
    autoTable(doc, {
      startY: 25,
      head: [['Título', 'Tipo', 'Estado', 'Fecha']],
      body: tableData,
    });
    
    doc.save('solicitudes_ronda_tv.pdf');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold uppercase tracking-wider w-fit"><CheckCircle2 size={14} /> Completado</span>;
      case 'rejected':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider w-fit"><XCircle size={14} /> Rechazado</span>;
      case 'approved':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider w-fit"><AlertCircle size={14} /> En proceso</span>;
      default:
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold uppercase tracking-wider w-fit"><Clock size={14} /> Pendiente</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={32} className="animate-spin text-brand-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white">PANEL DE ADMINISTRACIÓN</h2>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
                activeTab === 'requests' 
                  ? 'bg-brand-accent text-brand-bg' 
                  : 'bg-brand-panel border border-brand-border text-brand-text hover:border-brand-accent'
              }`}
            >
              <ListVideo size={18} /> Solicitudes
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
                activeTab === 'users' 
                  ? 'bg-brand-accent text-brand-bg' 
                  : 'bg-brand-panel border border-brand-border text-brand-text hover:border-brand-accent'
              }`}
            >
              <Users size={18} /> Usuarios
            </button>
          </div>
        </div>
        {activeTab === 'requests' && (
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-brand-panel border border-brand-border text-white px-4 py-2 rounded-lg outline-none focus:border-brand-accent"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="approved">En proceso</option>
              <option value="completed">Completados</option>
              <option value="rejected">Rechazados</option>
            </select>
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 bg-brand-panel border border-brand-border hover:border-brand-accent text-brand-text hover:text-brand-accent transition-colors px-4 py-2 rounded-lg font-bold"
            >
              <Download size={18} /> Exportar PDF
            </button>
          </div>
        )}
      </div>

      {activeTab === 'requests' && (
        <div className="bg-brand-panel border border-brand-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-bg/50">
                  <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Contenido</th>
                  <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {requests.filter(req => statusFilter === 'all' || req.status === statusFilter).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-brand-text-muted">
                      No hay solicitudes.
                    </td>
                  </tr>
                ) : (
                  requests.filter(req => statusFilter === 'all' || req.status === statusFilter).map((req) => (
                    <tr key={req.id} className="hover:bg-brand-bg/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {req.poster_path ? (
                            <img 
                              src={`https://image.tmdb.org/t/p/w92${req.poster_path}`} 
                              alt={req.title} 
                              className="w-12 h-18 object-cover rounded-md bg-brand-bg"
                            />
                          ) : (
                            <div className="w-12 h-18 rounded-md bg-brand-bg border border-brand-border flex items-center justify-center text-brand-text-muted">
                              <Film size={20} />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white text-lg flex items-center gap-2">
                              {req.media_type === 'movie' ? <Film size={14} className="text-brand-text-muted" /> : <Tv size={14} className="text-brand-text-muted" />}
                              {req.title}
                            </div>
                            <div className="text-brand-text-muted text-sm mt-0.5">
                              {req.release_date?.substring(0, 4) || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-brand-text-muted text-sm">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={req.status}
                            onChange={(e) => updateStatus(req.id, e.target.value)}
                            className="bg-brand-bg border border-brand-border text-white text-sm rounded-lg focus:ring-brand-accent focus:border-brand-accent block p-2 outline-none"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="approved">Procesando</option>
                            <option value="completed">Completado</option>
                            <option value="rejected">Rechazado</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          <div className="bg-brand-panel border border-brand-border rounded-2xl p-6 h-fit">
            <h3 className="font-bold text-white text-lg mb-4">Crear Usuario</h3>
            <form onSubmit={createUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Usuario</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-white outline-none focus:border-brand-accent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brand-text-muted uppercase mb-1">Contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-white outline-none focus:border-brand-accent"
                  required
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newIsAdmin}
                  onChange={(e) => setNewIsAdmin(e.target.checked)}
                  className="rounded border-brand-border bg-brand-bg text-brand-accent focus:ring-brand-accent/20"
                />
                <span className="text-sm font-bold text-white">Es Administrador</span>
              </label>
              <button
                type="submit"
                disabled={creatingUser}
                className="w-full bg-brand-accent text-brand-bg font-bold py-2 rounded-lg hover:bg-brand-accent/90 transition-colors flex justify-center items-center gap-2"
              >
                {creatingUser ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Crear
              </button>
            </form>
          </div>

          <div className="bg-brand-panel border border-brand-border rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-bg/50">
                  <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-4 text-xs font-bold text-brand-text-muted uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-brand-bg/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{u.username}</td>
                    <td className="px-6 py-4">
                      {u.is_admin === 1 ? (
                        <span className="bg-brand-accent/20 text-brand-accent text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider">Admin</span>
                      ) : (
                        <span className="bg-brand-text-muted/20 text-brand-text-muted text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider">Usuario</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setUserToDelete(u.id)}
                        className="text-red-400 hover:text-red-300 transition-colors p-2 bg-red-400/10 hover:bg-red-400/20 rounded-lg inline-flex"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {userToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-panel border border-brand-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">¿Eliminar usuario?</h3>
            <p className="text-brand-text-muted mb-6">Esta acción no se puede deshacer. ¿Estás seguro de que deseas continuar?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-lg font-bold text-white bg-brand-bg border border-brand-border hover:bg-brand-bg/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteUser(userToDelete)}
                className="px-4 py-2 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
