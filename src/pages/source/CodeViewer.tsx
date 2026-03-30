import { useState } from 'react'
import { Button } from '@blinkdotnew/ui'
import { Copy, ChevronDown, ChevronUp } from 'lucide-react'

interface CodeViewerProps {
  code: string
  filename: string
}

export function CodeViewer({ code, filename }: CodeViewerProps) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const lines = code.split('\n')
  const PREVIEW_LINES = 30
  const displayLines = expanded ? lines : lines.slice(0, PREVIEW_LINES)

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-lg border border-[#30363d] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
        <span className="text-xs font-mono text-[#8b949e]">{filename}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2 text-xs text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#30363d] gap-1"
        >
          <Copy className="h-3 w-3" />
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>

      {/* Code block */}
      <div className="relative">
        <pre
          className="overflow-x-auto p-4 text-xs leading-relaxed font-mono"
          style={{ background: '#0d1117', color: '#86efac' }}
        >
          <table className="w-full border-collapse">
            <tbody>
              {displayLines.map((line, i) => (
                <tr key={i} className="hover:bg-[#ffffff08] transition-colors">
                  <td
                    className="select-none pr-4 text-right align-top w-10 shrink-0"
                    style={{ color: '#484f58', userSelect: 'none' }}
                  >
                    {i + 1}
                  </td>
                  <td className="align-top whitespace-pre-wrap break-words" style={{ color: '#86efac' }}>
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Fade overlay when collapsed */}
          {!expanded && lines.length > PREVIEW_LINES && (
            <div
              className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, transparent, #0d1117)' }}
            />
          )}
        </pre>
      </div>

      {/* Expand toggle */}
      {lines.length > PREVIEW_LINES && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs border-t border-[#30363d] transition-colors"
          style={{ background: '#161b22', color: '#8b949e' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e6edf3' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8b949e' }}
        >
          {expanded ? (
            <><ChevronUp className="h-3 w-3" /> Collapse file</>
          ) : (
            <><ChevronDown className="h-3 w-3" /> Show full file ({lines.length} lines)</>
          )}
        </button>
      )}
    </div>
  )
}
