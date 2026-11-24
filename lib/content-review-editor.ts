import type { MonacoDiffEditor } from '@monaco-editor/react'

export interface ReviewLineChange {
  originalStartLineNumber: number
  originalEndLineNumber: number
  modifiedStartLineNumber: number
  modifiedEndLineNumber: number
  charChanges?: {
    originalStartLineNumber: number; originalStartColumn: number
    originalEndLineNumber: number; originalEndColumn: number
    modifiedStartLineNumber: number; modifiedStartColumn: number
    modifiedEndLineNumber: number; modifiedEndColumn: number
  }[]
}

export type ReviewSide = 'original' | 'modified'
export interface ReviewScrollPosition { line: number; left: number }

export function reviewSourceOptions(wrap: boolean) {
  const wordWrap = wrap ? 'on' as const : 'off' as const
  return {
    readOnly: true, automaticLayout: true,
    wordWrap, wordWrapOverride1: wordWrap, wordWrapOverride2: wordWrap,
    minimap: { enabled: false }, fontSize: 14, lineHeight: 24,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    scrollBeyondLastLine: false,
    scrollbar: { horizontal: 'auto' as const, vertical: 'auto' as const },
  }
}

export function reviewDiffOptions(sideBySide: boolean, wrap: boolean) {
  const wordWrap = wrap ? 'on' as const : 'off' as const
  return {
    ...reviewSourceOptions(wrap),
    originalEditable: false,
    renderSideBySide: sideBySide,
    enableSplitViewResizing: false,
    splitViewDefaultRatio: 0.5,
    ignoreTrimWhitespace: false,
    // Diff wrapping has its own override; setting wordWrap alone can leave one pane unwrapped.
    diffWordWrap: wordWrap,
  }
}

/** Public diff ranges drive the same highlighting in the two independently scrollable editors. */
export function reviewSourceDecorations(changes: ReviewLineChange[] | null, side: ReviewSide) {
  const tone = side === 'original' ? 'removed' : 'added'
  const decorations: { range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number }; options: { isWholeLine?: boolean; className?: string; linesDecorationsClassName?: string; hoverMessage?: { value: string }; inlineClassName?: string } }[] = []
  for (const change of changes || []) {
    const start = change[`${side}StartLineNumber`]
    const end = change[`${side}EndLineNumber`]
    // A zero end line is Monaco's marker for an insertion/deletion with no text on this side.
    if (start < 1 || end < start) continue
    decorations.push({ range: { startLineNumber: start, startColumn: 1, endLineNumber: end, endColumn: 1 }, options: { isWholeLine: true, className: `review-source-${tone}`, linesDecorationsClassName: `review-source-${tone}-margin`, hoverMessage: { value: side === 'original' ? 'Texto eliminado' : 'Texto añadido' } } })
    for (const character of change.charChanges || []) {
      const first = character[`${side}StartLineNumber`], last = character[`${side}EndLineNumber`]
      const firstColumn = character[`${side}StartColumn`], lastColumn = character[`${side}EndColumn`]
      if (first < 1 || last < first || firstColumn < 1 || lastColumn < 1 || (first === last && firstColumn === lastColumn)) continue
      decorations.push({ range: { startLineNumber: first, startColumn: firstColumn, endLineNumber: last, endColumn: lastColumn }, options: { inlineClassName: `review-source-${tone}-text` } })
    }
  }
  return decorations
}

type ScrollEditor = {
  getVisibleRanges(): { startLineNumber: number }[]
  getScrollLeft(): number
  getModel(): { getLineCount(): number } | null
  revealLineNearTop(line: number): void
  setScrollLeft(left: number): void
}

export function captureReviewScroll(editor: ScrollEditor): ReviewScrollPosition {
  return { line: editor.getVisibleRanges()[0]?.startLineNumber || 1, left: editor.getScrollLeft() }
}

export function restoreReviewScroll(editor: ScrollEditor, position: ReviewScrollPosition) {
  editor.revealLineNearTop(Math.max(1, Math.min(position.line, editor.getModel()?.getLineCount() || 1)))
  editor.setScrollLeft(Math.max(0, position.left))
}

/** The two child editors must use identical wrapping, including after a resize or model change. */
export function configureReviewDiff(editor: MonacoDiffEditor, sideBySide: boolean, wrap: boolean) {
  const options = reviewDiffOptions(sideBySide, wrap)
  editor.updateOptions(options)
  const paneOptions = {
    readOnly: true,
    wordWrap: options.wordWrap,
    wordWrapOverride1: options.wordWrapOverride1,
    wordWrapOverride2: options.wordWrapOverride2,
    fontSize: options.fontSize,
    lineHeight: options.lineHeight,
    fontFamily: options.fontFamily,
    scrollbar: options.scrollbar,
  }
  editor.getOriginalEditor().updateOptions(paneOptions)
  editor.getModifiedEditor().updateOptions(paneOptions)
  editor.layout()
}
