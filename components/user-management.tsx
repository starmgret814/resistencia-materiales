import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, collection, getDocs, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { Trash2, Shield, User as UserIcon, BookOpen, Plus, Loader2, Edit2, CheckCircle2, X } from 'lucide-react';
import { chapters } from '@/lib/course-data';

// Capítulos disponibles en el curso
const AVAILABLE_CHAPTERS = chapters.map(c => ({
  id: c.number,
  title: `${c.number}. ${c.title}`
}));

interface Collaborator {
  email: string;
  role: 'admin' | 'editor';
  assignedChapters: string[];
  createdAt?: string;
}

export default function UserManagement({ currentUserEmail }: { currentUserEmail?: string }) {
  const [users, setUsers] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  
  // Confirmar eliminación
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Form states
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'editor'>('editor');
  const [newChapters, setNewChapters] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
      let usersList: Collaborator[] = [];
      
      querySnapshot.forEach((doc) => {
        usersList.push({ email: doc.id, ...doc.data() } as Collaborator);
      });

      // Ordenar por fecha y hora: el más antiguo primero, el más reciente abajo
      usersList.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        return a.email.localeCompare(b.email);
      });

      setUsers(usersList);
    } catch (error) {
      console.error("Error obteniendo usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setNewEmail('');
    setNewRole('editor');
    setNewChapters([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: Collaborator) => {
    setIsEditing(true);
    setNewEmail(user.email);
    setNewRole(user.role);
    setNewChapters(user.assignedChapters || []);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) return;

    try {
      setSaving(true);
      const userRef = doc(db, 'users', newEmail.toLowerCase().trim());
      
      const newUserData: any = {
        role: newRole,
        assignedChapters: newRole === 'admin' ? [] : newChapters
      };

      if (!isEditing) {
        newUserData.createdAt = new Date().toISOString();
      }

      await setDoc(userRef, newUserData, { merge: true });
      
      setIsModalOpen(false);
      await fetchUsers();
      showToast(isEditing ? 'Colaborador actualizado' : 'Colaborador agregado exitosamente', 'success');
    } catch (error) {
      console.error("Error guardando usuario:", error);
      showToast("Hubo un error al guardar el usuario. Revisa los permisos de Firestore.", 'error');
    } finally {
      setSaving(false);
    }
  };

  const executeDeleteUser = async (email: string) => {
    try {
      await deleteDoc(doc(db, 'users', email));
      setUsers(users.filter(u => u.email !== email));
      showToast("Usuario eliminado correctamente.", 'success');
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      showToast("Error al eliminar. Revisa los permisos.", 'error');
    }
  };

  const toggleChapter = (chapterId: string) => {
    setNewChapters(prev => 
      prev.includes(chapterId) 
        ? prev.filter(id => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  return (
    <div className="flex flex-col h-screen relative">
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-xl shadow-[#4b1719]/10 border flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'success' ? 'bg-[#f4fbf7] border-[#d1e8da] text-[#1c663b]' : 'bg-[#fdf6f6] border-[#f1dada] text-[#8B0000]'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <p className="font-semibold text-sm">{toast.message}</p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 px-8 py-5 border-b border-[#E5D7D4] bg-white">
        <h2 className="text-2xl font-bold text-[#3E3030]">Gestión de Colaboradores</h2>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#8B0000] hover:bg-[#6a0000] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Agregar Usuario
        </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          
          <div className="bg-white rounded-xl border border-[#E5D7D4] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5D7D4] bg-[#fbf7f4]">
              <h3 className="font-semibold text-[#3E3030]">Usuarios Autorizados</h3>
              <p className="text-sm text-[#756565] mt-1">Lista de correos que pueden acceder a la plataforma y editar contenido.</p>
            </div>
            
            <div className="divide-y divide-[#E5D7D4]">
              {loading ? (
                <div className="flex items-center justify-center px-6 py-12 text-[#756565]">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="px-6 py-12 text-center text-[#756565]">
                  <p className="text-sm">No se encontraron usuarios en la base de datos.</p>
                </div>
              ) : (
                users.map((user) => {
                  const isMe = user.email.toLowerCase() === (currentUserEmail || '').toLowerCase();
                  return (
                    <div key={user.email} className="flex flex-col md:flex-row md:items-start justify-between px-6 py-5 hover:bg-[#FCF9F7] transition-colors gap-4">
                      {/* Info del usuario */}
                      <div className="flex items-center gap-4 shrink-0 md:w-[250px] lg:w-[300px]">
                        <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold ${user.role === 'admin' ? 'bg-[#f8eaea] text-[#8B0000]' : 'bg-[#E5D7D4] text-[#5A4A4A]'}`}>
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#3E3030] truncate flex items-center gap-2">
                            {user.email}
                            {isMe && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E5D7D4] text-[#5A4A4A]">TÚ</span>}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {user.role === 'admin' ? <Shield className="w-3 h-3 text-[#8B0000]" /> : <UserIcon className="w-3 h-3 text-[#756565]" />}
                            <p className="text-xs font-medium text-[#756565] uppercase tracking-wider">{user.role}</p>
                            {user.createdAt && (
                              <>
                                <span className="text-[#c9b5b5] text-xs">·</span>
                                <span className="text-[11px] text-[#8b6d6d]" title={`Registrado: ${new Date(user.createdAt).toLocaleString('es-PE')}`}>
                                  {new Date(user.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Badges de capítulos y acciones separadas para no romper el diseño */}
                      <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center justify-end gap-4 min-w-0">
                        {/* Contenedor de badges que SÍ hace wrap */}
                        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 flex-1 min-w-0">
                          {user.role === 'admin' ? (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#f8eaea] text-[#8B0000] border border-[#f2d8d8]">Acceso Total</span>
                          ) : (
                            user.assignedChapters?.map(ch => {
                              const chapterData = AVAILABLE_CHAPTERS.find(c => c.id === ch);
                              return (
                                <span key={ch} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-[#f4ecea] text-[#5A4A4A] border border-[#e8dada]">
                                  <BookOpen className="w-3 h-3 shrink-0" />
                                  <span className="truncate max-w-[200px]">{chapterData ? chapterData.title : ch}</span>
                                </span>
                              );
                            })
                          )}
                        </div>

                        {/* Botones de acción que NUNCA hacen wrap */}
                        <div className="flex items-center gap-1 shrink-0 bg-white sm:bg-transparent rounded-lg p-1 sm:p-0 border sm:border-none border-[#E5D7D4]">
                          <button 
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 text-[#5A4A4A] hover:text-[#3E3030] hover:bg-[#E5D7D4] rounded-md transition-colors"
                            title="Editar permisos"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          {/* Ocultamos el botón de borrar si es el propio usuario para evitar accidentes, pero dejamos un espacio invisible para alinear */}
                          {!isMe ? (
                            <button 
                              onClick={() => setUserToDelete(user.email)}
                              className="p-1.5 text-[#967070] hover:text-[#8B0000] hover:bg-[#f8eaea] rounded-md transition-colors"
                              title="Revocar acceso"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="w-[28px] h-[28px]" aria-hidden="true" />
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modal Agregar / Editar Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3e3030]/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E5D7D4] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E5D7D4] bg-[#FCF9F7] shrink-0">
              <h3 className="font-bold text-[#3E3030] text-lg">
                {isEditing ? 'Editar Colaborador' : 'Nuevo Colaborador'}
              </h3>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#3E3030] mb-1.5">Correo de Google (Gmail)</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={isEditing}
                  placeholder="usuario@gmail.com"
                  className="w-full px-3 py-2 bg-white border border-[#d8c2c2] rounded-lg text-sm focus:outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] disabled:bg-[#fbf7f4] disabled:text-[#756565] disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3E3030] mb-1.5">Rol en la plataforma</label>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${newRole === 'editor' ? 'border-[#8B0000] bg-[#f8eaea] text-[#8B0000]' : 'border-[#d8c2c2] text-[#756565] hover:bg-[#FCF9F7]'}`}>
                    <input type="radio" name="role" value="editor" checked={newRole === 'editor'} onChange={() => setNewRole('editor')} className="sr-only" />
                    <UserIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Editor</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${newRole === 'admin' ? 'border-[#8B0000] bg-[#f8eaea] text-[#8B0000]' : 'border-[#d8c2c2] text-[#756565] hover:bg-[#FCF9F7]'}`}>
                    <input type="radio" name="role" value="admin" checked={newRole === 'admin'} onChange={() => setNewRole('admin')} className="sr-only" />
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Admin</span>
                  </label>
                </div>
              </div>

              {newRole === 'editor' && (
                <div>
                  <label className="block text-sm font-semibold text-[#3E3030] mb-2">Capítulos Asignados</label>
                  <div className="space-y-2 border border-[#d8c2c2] rounded-lg p-3 bg-[#fbf7f4]">
                    {AVAILABLE_CHAPTERS.map(chapter => (
                      <label key={chapter.id} className="flex items-center gap-3 p-1 cursor-pointer group">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${newChapters.includes(chapter.id) ? 'bg-[#8B0000] border-[#8B0000]' : 'border-[#bca5a5] bg-white group-hover:border-[#8B0000]'}`}>
                          {newChapters.includes(chapter.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-sm text-[#5A4A4A] font-medium leading-tight">{chapter.title}</span>
                        <input type="checkbox" className="sr-only" checked={newChapters.includes(chapter.id)} onChange={() => toggleChapter(chapter.id)} />
                      </label>
                    ))}
                    {newChapters.length === 0 && <p className="text-xs text-[#967070] pt-1">Debes seleccionar al menos un capítulo para el editor.</p>}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5D7D4]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-[#756565] hover:bg-[#f4ecea] rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving || (newRole === 'editor' && newChapters.length === 0)} className="flex items-center gap-2 px-4 py-2 bg-[#8B0000] hover:bg-[#6a0000] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Registrar Acceso')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3e3030]/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#E5D7D4] overflow-hidden flex flex-col p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f8eaea] text-[#8B0000] flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#3E3030] mb-2">Revocar Acceso</h3>
            <p className="text-sm text-[#756565] mb-6">
              ¿Estás seguro de que quieres revocar el acceso a <strong>{userToDelete}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setUserToDelete(null)} className="flex-1 px-4 py-2 text-sm font-medium text-[#756565] bg-[#fbf7f4] hover:bg-[#E5D7D4] rounded-lg transition-colors">
                Cancelar
              </button>
              <button 
                onClick={() => {
                  executeDeleteUser(userToDelete);
                  setUserToDelete(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-bold text-white bg-[#8B0000] hover:bg-[#6a0000] rounded-lg transition-colors"
              >
                Revocar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
