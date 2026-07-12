import { cn } from '@utils/index'
import { CheckCircle2, Loader2, Circle } from 'lucide-react'

interface Step {
  id: string
  label: string
}

interface ProgressStepsProps {
  steps: Step[]
  currentStep: string
  className?: string
}

const DEFAULT_STEPS: Step[] = [
  { id: 'uploading', label: 'Uploading Document...' },
  { id: 'reading', label: 'Reading Document...' },
  { id: 'parsing', label: 'Parsing...' },
  { id: 'ocr', label: 'Running OCR...' },
  { id: 'understanding', label: 'Understanding Content...' },
  { id: 'generating', label: 'Generating AI Response...' },
  { id: 'finalizing', label: 'Finalizing...' },
  { id: 'done', label: 'Completed Successfully.' },
]

export const ProcessingSteps = ({
  steps = DEFAULT_STEPS,
  currentStep,
  className,
}: ProgressStepsProps) => {
  const currentIdx = steps.findIndex(s => s.id === currentStep)

  if (!currentStep) return null

  return (
    <div className={cn('space-y-2', className)}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIdx
        const isCurrent = idx === currentIdx
        const isPending = idx > currentIdx

        return (
          <div key={step.id} className="flex items-center gap-2.5">
            {isCompleted ? (
              <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
            ) : isCurrent ? (
              <Loader2 size={14} className="text-brand-400 animate-spin flex-shrink-0" />
            ) : (
              <Circle size={14} className="text-surface-600 flex-shrink-0" />
            )}
            <span className={cn(
              'text-xs transition-colors',
              isCompleted && 'text-green-400',
              isCurrent && 'text-brand-400 font-medium',
              isPending && 'text-surface-500',
            )}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
