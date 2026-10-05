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
    const draftId = `${chapterNumber}_${cleanSlug}`;
    const snap = await getDoc(doc(db, 'drafts', draftId));
    if (snap.exists()) {
      const data = snap.data();
      if (data.status === 'approved' && data.contentMarkdown) {
        return {
          title: data.title,
          chapterId: data.chapterId,
          slug: data.slug,
          contentMarkdown: data.contentMarkdown,
          updatedAt: data.updatedAt,
          authorEmail: data.authorEmail,
        };
      }
    }
  } catch (err) {
    console.warn(`No se pudo cargar contenido aprobado de Firestore para ${chapterNumber}_${slug}:`, err);
  }
  return null;
}
