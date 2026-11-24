type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'success'

// Existing workspace palette, shared by the chapter controls. No global theme change.
const buttonColors: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-[#8B0000] text-white hover:bg-[#6a0000]',
  secondary: 'border-[#d5baba] bg-white text-[#6a2022] hover:bg-[#f8eaea]',
  quiet: 'border-transparent bg-transparent text-[#8B0000] hover:bg-[#f1dddd]',
  success: 'border-transparent bg-[#1c663b] text-white hover:bg-[#15502e]',
}

export function workspaceButtonClass(variant: ButtonVariant = 'secondary', iconOnly = false) {
  return [
    'inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border py-2 text-sm font-semibold leading-5 transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B0000] disabled:cursor-not-allowed disabled:opacity-40',
    iconOnly ? 'w-11 px-0' : 'px-3',
    buttonColors[variant],
  ].join(' ')
}

export function workspaceInputClass(invalid = false) {
  return [
    'block min-h-11 w-full rounded-md border bg-white px-3 py-2 text-base leading-6 text-[#3b2022] outline-none transition-colors motion-reduce:transition-none focus:border-[#8B0000] focus:ring-2 focus:ring-[#8B0000]/15 disabled:cursor-not-allowed disabled:bg-[#f8f5f4] disabled:opacity-60',
    invalid ? 'border-[#8B0000] placeholder:text-[#8B0000]' : 'border-[#dcc3c3] placeholder:text-[#8b6d6d]',
  ].join(' ')
}
