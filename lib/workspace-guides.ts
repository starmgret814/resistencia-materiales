export const COLLABORATOR_GUIDE = '/guia-colaboradores'
export const ADMIN_GUIDE = '/workspace-mc361/management/guide'

export function workspaceGuide(role?: string) {
  return role === 'admin'
    ? { href: ADMIN_GUIDE, label: 'Guía de administración' }
    : { href: COLLABORATOR_GUIDE, label: 'Guía de colaboradores' }
}
