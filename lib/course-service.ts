import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { chapters as defaultChapters, type Chapter, type Section } from '@/lib/course-data';
import { countCourseProblems } from '@/lib/course-headings';

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

export async function getApprovedSubtopic(chapterNumber: string, slug: string, strict = false): Promise<ApprovedSubtopicContent | null> {
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
    if (strict) throw err;
    console.warn(`No se pudo cargar contenido publicado de Firestore para ${chapterNumber}_${slug}:`, err);
  }
  return null;
}

/** Count only published problems in earlier sections of this chapter. */
export async function getChapterProblemOffset(chapter: Chapter, slug: string): Promise<number> {
  const index = chapter.sections.findIndex(section => section.slug === slug || section.id === slug || section.slug?.split('/').pop() === slug);
  if (index < 0) throw new Error('Sección no encontrada');
  const counts = await Promise.all(chapter.sections.slice(0, index).map(async section => {
    const content = await getApprovedSubtopic(chapter.number, section.slug || section.id, true);
    return content ? countCourseProblems(content.contentMarkdown) : 0;
  }));
  return counts.reduce((total, count) => total + count, 0);
}
