/** Reuse the course's existing unsigned Cloudinary image-upload configuration. */
export async function uploadCourseImage(file: File): Promise<string> {
  if (!file.size) throw new Error('El archivo está vacío. Selecciona otra imagen.')
  if (!file.type.startsWith('image/') && !/\.(png|jpe?g|gif|webp|avif|svg|bmp|tiff?|heic|heif)$/i.test(file.name)) {
    throw new Error('Selecciona un archivo de imagen.')
  }
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', 'resistencia-materiales-imagenes')
  let response: Response
  try {
    response = await fetch('https://api.cloudinary.com/v1_1/dtjpmhekb/image/upload', { method: 'POST', body: form })
  } catch {
    throw new Error('No se pudo conectar para subir la imagen. Comprueba tu conexión y vuelve a intentarlo.')
  }
  const data = await response.json().catch(() => null)
  if (!response.ok || typeof data?.secure_url !== 'string') {
    throw new Error(data?.error?.message || 'No se pudo subir la imagen. Vuelve a intentarlo.')
  }
  let url: URL
  try { url = new URL(data.secure_url) } catch { throw new Error('El servicio no devolvió un enlace de imagen válido.') }
  if (url.protocol !== 'https:') throw new Error('El servicio no devolvió un enlace de imagen seguro.')
  return data.secure_url
}
