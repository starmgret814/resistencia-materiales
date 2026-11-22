import type { OnMount } from '@monaco-editor/react'
export type MarkdownEditorInstance = Parameters<OnMount>[0]

/** Programmatic edits must use the same undo stack as typing. */
export function replaceEditorText(editor: MarkdownEditorInstance, text: string, source = 'external-document', preserveView = true) {
  const model = editor.getModel()
  if (!model || model.getValue() === text) return false
  const view = preserveView ? editor.saveViewState() : null
  editor.pushUndoStop()
  editor.executeEdits(source, [{ range: model.getFullModelRange(), text, forceMoveMarkers: true }])
  editor.pushUndoStop()
  if (view) editor.restoreViewState(view)
  return true
}

export function insertEditorText(editor: MarkdownEditorInstance, text: string, source = 'toolbar') {
  const selection = editor.getSelection()
  if (!selection) return false
  editor.pushUndoStop()
  editor.executeEdits(source, [{ range: selection, text, forceMoveMarkers: true }])
  editor.pushUndoStop()
  editor.focus()
  return true
}
