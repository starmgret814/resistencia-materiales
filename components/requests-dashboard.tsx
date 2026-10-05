import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { chapters, type Chapter } from '@/lib/course-data';
import { findSubtopicTitle } from '@/lib/course-titles';
import { Loader2, FileText, ChevronRight, MessageSquare, CheckCircle2 } from 'lucide-react';

interface DraftRequest {
  id: string;
  chapterId: string;
  slug: string;
  title: string;
  authorEmail: string;
  updatedAt: string;
  status: string;
}

export default function RequestsDashboard() {
  const [requests, setRequests] = useState<DraftRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'drafts'), where("status", "==", "pending_approval"));
      const [snap, structure] = await Promise.all([
        getDocs(q),
        getDoc(doc(db, 'course', 'chapters')).catch(() => null),
      ]);
      const currentChapters: Chapter[] = structure?.exists() && Array.isArray(structure.data().list)
        ? structure.data().list
        : chapters;
      const reqs: DraftRequest[] = [];
      snap.forEach(d => {
        const data = d.data() as Omit<DraftRequest, 'id'>;
        reqs.push({ id: d.id, ...data, title: findSubtopicTitle(currentChapters, data.chapterId, data.slug) || data.title || data.slug });
      });
      // Sort by newest first
      reqs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setRequests(reqs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatName = (email: string) => {
    if (!email) return 'Desconocido';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 3) {
      const nombre = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      const apellido = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      return `${nombre} ${apellido}`;
    }
    return email.split('@')[0];
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.round((new Date().getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return "hace un momento";
    if (minutes < 60) return `hace ${minutes} min`;
    if (hours < 24) return `hace ${hours} horas`;
    if (days === 1) return `hace 1 día`;
    if (days < 30) return `hace ${days} días`;
    return date.toLocaleDateString('es-PE');
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B0000]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 text-[#3b2022]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#4b1719]">Solicitudes de Revisión</h1>
          <p className="text-sm text-[#8b6d6d] mt-1">Revisa y aprueba el contenido editado por los colaboradores.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5D7D4] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5D7D4] bg-[#fbf7f4] flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#8b6d6d]" />
          <h3 className="font-semibold text-[#3E3030]">Pendientes de Aprobación</h3>
          <span className="ml-2 bg-[#f8eaea] text-[#8B0000] px-2 py-0.5 rounded-full text-xs font-bold">
            {requests.length}
          </span>
        </div>
        
        <div className="divide-y divide-[#E5D7D4]">
          {requests.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <CheckCircle2 className="w-12 h-12 text-[#d1e8da] mx-auto mb-3" />
              <p className="text-[#5A4A4A] font-semibold">¡Todo al día!</p>
              <p className="text-sm text-[#756565] mt-1">No hay ninguna solicitud pendiente de revisión.</p>
            </div>
          ) : (
            requests.map(req => (
              <a 
                key={req.id}
                href={`/workspace-mc361/content/chapters/${req.chapterId}/edit?slug=${req.slug}&from=requests`}
                data-astro-reload
                className="flex items-center justify-between px-6 py-5 hover:bg-[#FCF9F7] transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#f5ecec] flex items-center justify-center text-[#7d6060] shrink-0 group-hover:bg-[#8B0000] group-hover:text-white transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#3E3030] group-hover:text-[#8B0000] transition-colors">
                      Capítulo {req.chapterId} · {req.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-[#756565]">
                        Editado por <strong className="text-[#5A4A4A]">{formatName(req.authorEmail)}</strong>
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[#d8c2c2]" />
                      <span className="text-xs text-[#967070]">
                        {timeAgo(req.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-[#fff8ed] text-[#b47a2b] text-xs font-bold rounded-md border border-[#fce9cc]">
                    Por Revisar
                  </span>
                  <ChevronRight className="w-5 h-5 text-[#dcc3c3] group-hover:text-[#8B0000] transition-colors" />
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
