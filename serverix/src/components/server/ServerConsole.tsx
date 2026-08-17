'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Terminal } from 'lucide-react'

interface ConsoleLine {
  id:        number
  type:      'info' | 'warn' | 'error' | 'cmd' | 'system'
  text:      string
  timestamp: string
}

const MOCK_BOOT_LINES: Omit<ConsoleLine, 'id'>[] = [
  { type: 'system', text: '[SERVERIX] Console connected — MOCK mode (infrastructure not yet integrated)', timestamp: '' },
  { type: 'system', text: '[SERVERIX] Real console requires game server WebSocket bridge', timestamp: '' },
  { type: 'info',   text: '[Server] Starting Aunaria server...', timestamp: '' },
  { type: 'info',   text: '[Server] Loading plugins...', timestamp: '' },
  { type: 'info',   text: '[Server] Slimefun 2.0 loaded (1247 items)', timestamp: '' },
  { type: 'info',   text: '[Server] AunariaCore loaded', timestamp: '' },
  { type: 'info',   text: '[Server] Done (2.847s)! For help, type "help"', timestamp: '' },
]

export function ServerConsole({ serverId, canExecute }: { serverId: string; canExecute: boolean }) {
  const [lines, setLines] = useState<ConsoleLine[]>([])
  const [input, setInput]   = useState('')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const nextId    = useRef(0)

  // Boot sequence
  useEffect(() => {
    const now = new Date().toLocaleTimeString('cs-CZ')
    const booted = MOCK_BOOT_LINES.map(l => ({
      ...l,
      id: nextId.current++,
      timestamp: now,
    }))
    setLines(booted)
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  function addLine(type: ConsoleLine['type'], text: string) {
    const ts = new Date().toLocaleTimeString('cs-CZ')
    setLines(prev => [...prev, { id: nextId.current++, type, text, timestamp: ts }])
  }

  async function sendCommand(e: React.FormEvent) {
    e.preventDefault()
    const cmd = input.trim()
    if (!cmd || sending) return

    setHistory(h => [cmd, ...h.slice(0, 49)])
    setHistIdx(-1)
    setInput('')
    setSending(true)

    addLine('cmd', `> ${cmd}`)

    try {
      const res = await fetch(`/api/server/${serverId}/console`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      })
      const data = await res.json()
      if (!res.ok) {
        addLine('error', `[Error] ${data.error ?? 'Command failed'}`)
      } else {
        // Mock response
        addLine('info', data.response ?? `[Server] Command "${cmd}" queued (MOCK)`)
      }
    } catch {
      addLine('error', '[Error] Network error')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const newIdx = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(newIdx)
      if (history[newIdx]) setInput(history[newIdx])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const newIdx = Math.max(histIdx - 1, -1)
      setHistIdx(newIdx)
      setInput(newIdx === -1 ? '' : history[newIdx] ?? '')
    }
  }

  const lineColor: Record<ConsoleLine['type'], string> = {
    info:   'text-gray-300',
    warn:   'text-yellow-400',
    error:  'text-red',
    cmd:    'text-accent',
    system: 'text-teal',
  }

  return (
    <div className="flex flex-col">
      {/* Output */}
      <div className="h-80 overflow-y-auto bg-void/60 p-4 font-mono text-xs space-y-0.5">
        {lines.map(line => (
          <div key={line.id} className={`${lineColor[line.type]} leading-relaxed`}>
            <span className="text-gray-700 select-none mr-2">{line.timestamp}</span>
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {canExecute ? (
        <form onSubmit={sendCommand} className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06] bg-deep/50">
          <Terminal className="w-4 h-4 text-accent flex-shrink-0" />
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Zadejte příkaz... (↑↓ pro historii)"
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 focus:outline-none font-mono"
            disabled={sending}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-1.5 rounded text-accent hover:bg-accent/10 transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <div className="px-4 py-3 border-t border-white/[0.06] text-xs text-gray-600">
          Pouze zobrazení — nemáte oprávnění spouštět příkazy
        </div>
      )}
    </div>
  )
}
