interface Props {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

/** Native keyboard behavior and label association, with a consistent workspace appearance. */
export default function WorkspaceSwitch({ label, checked, onCheckedChange, disabled = false }: Props) {
  return <label className="workspace-switch" data-disabled={disabled || undefined}>
    <input className="workspace-switch-input" type="checkbox" role="switch" aria-label={label} checked={checked} disabled={disabled} onChange={event => onCheckedChange(event.target.checked)} />
    <span className="workspace-switch-track" aria-hidden="true"><span className="workspace-switch-thumb" /></span>
    <span className="workspace-switch-label">{label}</span>
  </label>
}
