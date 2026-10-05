import type { APIRoute } from 'astro';
import defaultChapters from '@/lib/chapters.json';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const session = locals.session;

    if (!session || session.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo los administradores pueden restablecer la base de datos.' }), { status: 403 });
    }

    const { initializeApp: initClientApp, getApps: getClientApps, getApp: getClientApp } = await import('firebase/app');
    const { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } = await import('firebase/firestore');

    const firebaseConfig = {
      apiKey: "AIzaSyBuHiDaNFsryCyFDjqUtdymTYH93oqltg0",
      authDomain: "resistencia-materiales.firebaseapp.com",
      projectId: "resistencia-materiales",
      storageBucket: "resistencia-materiales.firebasestorage.app",
      messagingSenderId: "721587919055",
      appId: "1:721587919055:web:c6bf064ea1a84ab8bc3fba",
    };

    const app = getClientApps().length > 0 ? getClientApp() : initClientApp(firebaseConfig);
    const db = getFirestore(app);

    // 1. Clear drafts collection
    const draftsSnap = await getDocs(collection(db, 'drafts'));
    for (const d of draftsSnap.docs) {
      await deleteDoc(d.ref);
    }

    // 2. Clear requests collection if any
    try {
      const reqSnap = await getDocs(collection(db, 'requests'));
      for (const r of reqSnap.docs) {
        await deleteDoc(r.ref);
      }
    } catch {}

    // 3. Reset course/chapters to default chapters.json
    await setDoc(doc(db, 'course', 'chapters'), {
      list: defaultChapters,
      updatedAt: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true, message: 'Base de datos restablecida a 0 exitosamente.' }), { status: 200 });
  } catch (error: any) {
    console.error('Error al restablecer base de datos:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error al restablecer la base de datos.' }), { status: 500 });
  }
};
