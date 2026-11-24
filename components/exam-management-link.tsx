import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { FilePenLine } from 'lucide-react'
import { auth, db } from '@/lib/firebase'

/** The workspace and Firestore enforce authorization independently of this shortcut. */
export default function ExamManagementLink() {
  const [admin, setAdmin] = useState(false)
  useEffect(() => {
    let version = 0
    const unsubscribe = onAuthStateChanged(auth, user => {
      const request = ++version
      setAdmin(false)
      if (!user?.email || !user.emailVerified) return
      void getDoc(doc(db, 'users', user.email)).then(snapshot => {
        if (request === version) setAdmin(snapshot.data()?.role === 'admin')
      }).catch(() => {})
    })
    return () => { version++; unsubscribe() }
  }, [])
  if (!admin) return null
  return <a href="/workspace-mc361/management/exams" data-astro-reload className="study-control mt-5"><FilePenLine className="size-4" aria-hidden="true" />Editor de exámenes</a>
}
