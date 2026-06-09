function splitHighlight(text, query) {
  const q = query.toLowerCase()
  const len = query.length
  const lower = text.toLowerCase()
  const parts = []
  let pos = 0
  let key = 0
  let idx

  while ((idx = lower.indexOf(q, pos)) !== -1) {
    if (idx > pos) parts.push(text.slice(pos, idx))
    parts.push(<mark key={key++}>{text.slice(idx, idx + len)}</mark>)
    pos = idx + len
  }
  if (pos < text.length) parts.push(text.slice(pos))
  return parts
}

// For plain text strings — returns original string if no match
export function highlightText(text, query) {
  if (!query || !text) return text
  if (!text.toLowerCase().includes(query.toLowerCase())) return text
  return splitHighlight(text, query)
}

// Returns a replace callback for html-react-parser
export function buildHighlighter(query) {
  if (!query) return undefined
  const q = query.toLowerCase()

  return node => {
    if (node.type !== "text" || !node.data) return
    if (!node.data.toLowerCase().includes(q)) return
    return <>{splitHighlight(node.data, query)}</>
  }
}
