import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { ToolWrapper, Slider, CopyButton, ResetButton, CheckboxRow } from '../ToolShared'

const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit eget nunc rhoncus ultrices purus praesent felis ac risus tortor turpis sagittis neque mi vestibulum blandit venenatis phasellus aenean nisi nibh faucibus porta tincidunt eleifend malesuada morbi diam erat hendrerit condimentum libero pellentesque donec tempus augue orci cursus viverra'.split(' ')

function generateWords(count: number, startWithLorem: boolean): string {
  const words = startWithLorem ? [...WORDS.slice(0, Math.min(count, 2)), ...WORDS.slice(2, count)] : WORDS.slice(0, count)
  return words.slice(0, count).join(' ')
}

function generateSentence(wordCount: number): string {
  const words = Array.from({ length: wordCount }, (_, i) => WORDS[i % WORDS.length])
  const sentence = words.join(' ')
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.'
}

function generateParagraph(sentences: number, wordsPerSentence: number): string {
  return Array.from({ length: sentences }, () => generateSentence(wordsPerSentence)).join(' ')
}

export const LoremIpsumTool = () => {
  const [type, setType] = useState<'words' | 'sentences' | 'paragraphs'>('sentences')
  const [amount, setAmount] = useState(3)
  const [variation, setVariation] = useState<'fixed' | 'random'>('fixed')
  const [startWithLorem, setStartWithLorem] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [sentencesPerParagraph, setSentencesPerParagraph] = useState(5)
  const [wordsPerSentence, setWordsPerSentence] = useState(8)
  const [seed, setSeed] = useState(0)

  const output = useMemo(() => {
    void seed // reactivity
    const wps = variation === 'random' ? Math.floor(wordsPerSentence * 0.7 + Math.random() * wordsPerSentence * 0.6) : wordsPerSentence
    const spp = variation === 'random' ? Math.floor(sentencesPerParagraph * 0.7 + Math.random() * sentencesPerParagraph * 0.6) : sentencesPerParagraph

    if (type === 'words') {
      const text = generateWords(amount, startWithLorem)
      return startWithLorem ? 'Lorem ipsum ' + text.slice(startWithLorem ? 11 : 0) : text
    }
    if (type === 'sentences') {
      const parts = Array.from({ length: amount }, (_, i) => {
        const s = generateSentence(wps)
        return i === 0 && startWithLorem ? 'Lorem ipsum ' + s.charAt(0).toLowerCase() + s.slice(1) : s
      })
      return parts.join(' ')
    }
    const parts = Array.from({ length: amount }, (_, i) => {
      const para = generateParagraph(spp, wps)
      return i === 0 && startWithLorem ? 'Lorem ipsum ' + para.charAt(0).toLowerCase() + para.slice(1) : para
    })
    return parts.join('\n\n')
  }, [type, amount, variation, startWithLorem, sentencesPerParagraph, wordsPerSentence, seed])

  const regenerate = useCallback(() => setSeed(s => s + 1), [])

  return (
    <ToolWrapper className="max-w-2xl">
      {/* Amount + type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Slider label="Amount" value={amount} min={1} max={type === 'words' ? 500 : type === 'sentences' ? 20 : 10} onChange={setAmount} />
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Number of</label>
          <select value={type} onChange={e => setType(e.target.value as typeof type)}
            className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-surface-700/60 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/50">
            <option value="words">Words</option>
            <option value="sentences">Sentences</option>
            <option value="paragraphs">Paragraphs</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Variation</label>
        <select value={variation} onChange={e => setVariation(e.target.value as typeof variation)}
          className="w-56 px-3 py-2 rounded-xl bg-surface-800 border border-surface-700/60 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/50">
          <option value="fixed">Fixed</option>
          <option value="random">Random</option>
        </select>
      </div>

      {/* Advanced settings */}
      <div>
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-white transition-colors"
        >
          <span className="text-brand-400">{showAdvanced ? '∧' : '∨'}</span>
          Advanced Settings
        </button>
        {showAdvanced && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-4">
            {type === 'paragraphs' && (
              <Slider label="Sentences per Paragraph" value={sentencesPerParagraph} min={2} max={15} onChange={setSentencesPerParagraph} />
            )}
            {type !== 'words' && (
              <Slider label="Words per Sentence" value={wordsPerSentence} min={3} max={25} onChange={setWordsPerSentence} />
            )}
          </motion.div>
        )}
      </div>

      {/* Output */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-surface-600">↓</span>
          <div className="flex items-center gap-1">
            <CopyButton value={output} />
            <ResetButton onClick={regenerate} />
          </div>
        </div>
        <div className="p-4 bg-surface-900 border border-surface-700/40 rounded-xl text-sm text-surface-200 leading-relaxed min-h-[120px] whitespace-pre-wrap">
          {output}
        </div>
      </div>

      <CheckboxRow label="Starts With 'Lorem Ipsum'" checked={startWithLorem} onChange={setStartWithLorem} />
    </ToolWrapper>
  )
}
