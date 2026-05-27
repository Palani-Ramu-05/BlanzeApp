import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { ToolWrapper, CopyButton, ToolButton } from '../ToolShared'
import toast from 'react-hot-toast'

type Align = 'left' | 'center' | 'right'

interface Col { id: string; header: string; align: Align }
interface Row { id: string; cells: Record<string, string> }

const uid = () => Math.random().toString(36).slice(2, 8)

const ALIGN_ICONS: Record<Align, React.ReactNode> = {
  left: <AlignLeft size={11} />,
  center: <AlignCenter size={11} />,
  right: <AlignRight size={11} />,
}
const ALIGN_MD: Record<Align, string> = { left: ':---', center: ':---:', right: '---:' }
const ALIGN_NEXT: Record<Align, Align> = { left: 'center', center: 'right', right: 'left' }

const DEFAULT_COLS: Col[] = [{ id: uid(), header: 'Header 1', align: 'left' }, { id: uid(), header: 'Header 2', align: 'left' }]
const DEFAULT_ROWS: Row[] = [
  { id: uid(), cells: {} },
  { id: uid(), cells: {} },
]

export const MarkdownTableTool = () => {
  const [cols, setCols] = useState<Col[]>(DEFAULT_COLS)
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS)

  const addCol = () => {
    const newCol: Col = { id: uid(), header: `Header ${cols.length + 1}`, align: 'left' }
    setCols(c => [...c, newCol])
  }
  const removeCol = (id: string) => cols.length > 1 && setCols(c => c.filter(col => col.id !== id))
  const updateCol = (id: string, field: 'header' | 'align', val: string) =>
    setCols(c => c.map(col => col.id === id ? { ...col, [field]: val } : col))

  const addRow = () => setRows(r => [...r, { id: uid(), cells: {} }])
  const removeRow = (id: string) => rows.length > 1 && setRows(r => r.filter(row => row.id !== id))
  const updateCell = (rowId: string, colId: string, val: string) =>
    setRows(r => r.map(row => row.id === rowId ? { ...row, cells: { ...row.cells, [colId]: val } } : row))

  const markdown = useMemo(() => {
    const sep = `| ${cols.map(c => ALIGN_MD[c.align]).join(' | ')} |`
    const header = `| ${cols.map(c => c.header || ' ').join(' | ')} |`
    const rowLines = rows.map(row => `| ${cols.map(c => row.cells[c.id] || ' ').join(' | ')} |`)
    return [header, sep, ...rowLines].join('\n')
  }, [cols, rows])

  return (
    <ToolWrapper>
      {/* Table editor */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {cols.map(col => (
                <th key={col.id} className="border border-surface-700/60 bg-surface-800/60 p-0 min-w-[120px]">
                  <div className="flex items-center">
                    <button
                      onClick={() => updateCol(col.id, 'align', ALIGN_NEXT[col.align])}
                      className="p-2 text-surface-400 hover:text-brand-400 transition-colors flex-shrink-0"
                      title={`Align: ${col.align}`}
                    >
                      {ALIGN_ICONS[col.align]}
                    </button>
                    <input
                      value={col.header}
                      onChange={e => updateCol(col.id, 'header', e.target.value)}
                      className="flex-1 min-w-0 px-2 py-2 text-xs font-bold text-white bg-transparent focus:outline-none text-center"
                    />
                    <button onClick={() => removeCol(col.id)} className="p-2 text-surface-600 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </th>
              ))}
              <td className="border border-surface-700/60 bg-surface-800/60 p-1 w-8">
                <button onClick={addCol} className="w-full h-7 flex items-center justify-center text-surface-500 hover:text-brand-400 transition-colors">
                  <Plus size={13} />
                </button>
              </td>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="group">
                {cols.map(col => (
                  <td key={col.id} className="border border-surface-700/60 p-0">
                    <input
                      value={row.cells[col.id] || ''}
                      onChange={e => updateCell(row.id, col.id, e.target.value)}
                      className="w-full px-3 py-2 text-sm text-surface-200 bg-transparent focus:outline-none focus:bg-brand-500/5"
                    />
                  </td>
                ))}
                <td className="border border-surface-700/60 p-1 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => removeRow(row.id)} className="w-full h-7 flex items-center justify-center text-surface-500 hover:text-red-400 transition-colors">
                    <Trash2 size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row controls */}
      <div className="flex items-center gap-2">
        <ToolButton variant="ghost" size="sm" icon={<Plus size={12} />} onClick={addRow}>Add row</ToolButton>
        <ToolButton variant="ghost" size="sm" icon={<Trash2 size={12} />} onClick={() => rows.length > 1 && removeRow(rows[rows.length - 1].id)}>Remove last</ToolButton>
      </div>

      {/* Markdown output */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Markdown Output</label>
          <CopyButton value={markdown} />
        </div>
        <pre className="p-4 bg-surface-900 border border-surface-700/40 rounded-xl font-mono text-xs text-surface-200 overflow-x-auto whitespace-pre">
          {markdown}
        </pre>
      </div>
    </ToolWrapper>
  )
}
