import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { chapters as defaultChapters, type Chapter, type Section } from '@/lib/course-data';

export async function getLiveChapters(): Promise<Chapter[]> {
  try {
    const snap = await getDoc(doc(db, 'course', 'chapters'));
    if (snap.exists() && Array.isArray(snap.data().list)) {
      return snap.data().list as Chapter[];
    }
  } catch (err) {
    console.warn('No se pudo cargar el temario desde Firestore, usando respaldo estático:', err);
  }
  return defaultChapters;
}

export interface ApprovedSubtopicContent {
  title: string;
  chapterId: string;
  slug: string;
  contentMarkdown: string;
  updatedAt?: string;
  authorEmail?: string;
}

export async function getApprovedSubtopic(chapterNumber: string, slug: string): Promise<ApprovedSubtopicContent | null> {
  try {
    const cleanSlug = slug.includes('/') ? slug.split('/').pop()! : slug;
    const docId = `${chapterNumber}_${cleanSlug}`;
    
    // 1. Consultar en drafts (donde reside el contenido aprobado / publicado con permisos ya otorgados)
    const snap = await getDoc(doc(db, 'drafts', docId));
    if (snap.exists()) {
      const data = snap.data();
      const publishedText = data.publishedContent || (data.status === 'approved' ? data.contentMarkdown : null);
      if (publishedText) {
        return {
          title: data.publishedTitle || data.title,
          chapterId: data.chapterId,
          slug: data.slug,
          contentMarkdown: publishedText,
          updatedAt: data.publishedAt || data.updatedAt,
          authorEmail: data.publishedBy || data.authorEmail,
        };
      }
    }
  } catch (err) {
    console.warn(`No se pudo cargar contenido publicado de Firestore para ${chapterNumber}_${slug}:`, err);
  }
  return null;
}
