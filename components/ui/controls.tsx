import { forwardRef, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  busy?: boolean
} & ({ iconOnly: true; 'aria-label': string } | { iconOnly?: false })

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'secondary', iconOnly = false, busy = false, type = 'button', disabled, className, children, ...props }, ref) {
  return <button {...props} ref={ref} type={type} disabled={disabled || busy} aria-busy={busy || undefined} className={cn('ui-button', `ui-button--${variant}`, iconOnly && 'ui-button--icon', className)}>
    {busy && <LoaderCircle className="ui-spinner" aria-hidden="true" />}{children}
  </button>
})

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'; children: ReactNode }) {
  return <span className={`ui-badge ui-badge--${tone}`}>{children}</span>
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField({ label, hint, error, id: providedId, className, ...props }, ref) {
  const generatedId = useId()
  const id = providedId || generatedId
  const description = [props['aria-describedby'], hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  return <div className="ui-field">
    <label htmlFor={id}>{label}</label>
    <input {...props} ref={ref} id={id} className={cn('ui-input', className)} aria-invalid={error ? true : props['aria-invalid']} aria-describedby={description} />
    {hint && <p id={`${id}-hint`} className="ui-field-note">{hint}</p>}
    {error && <p id={`${id}-error`} role="alert" className="ui-field-error">{error}</p>}
  </div>
})
