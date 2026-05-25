import { useState, useCallback } from 'react'
import type { ObjectSchema } from 'yup'

type Errors<T> = Partial<Record<keyof T, string>>

interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T
  validationSchema?: ObjectSchema<T>
  onSubmit: (values: T) => void | Promise<void>
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Errors<T>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const validate = useCallback(
    async (vals: T): Promise<Errors<T>> => {
      if (!validationSchema) return {}
      try {
        await validationSchema.validate(vals, { abortEarly: false })
        return {}
      } catch (err: unknown) {
        const yupError = err as { inner?: { path: string; message: string }[] }
        const errs: Errors<T> = {}
        yupError.inner?.forEach((e) => {
          if (e.path) errs[e.path as keyof T] = e.message
        })
        return errs
      }
    },
    [validationSchema],
  )

  const handleChange =
    (field: keyof T) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value
      setValues((prev) => ({ ...prev, [field]: val }))
      if (touched[field]) {
        validate({ ...values, [field]: val }).then((errs) =>
          setErrors((prev) => ({ ...prev, [field]: errs[field] })),
        )
      }
    }

  const handleBlur = (field: keyof T) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validate(values).then((errs) =>
      setErrors((prev) => ({ ...prev, [field]: errs[field] })),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const allTouched = Object.keys(values).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Partial<Record<keyof T, boolean>>,
    )
    setTouched(allTouched)
    const errs = await validate(values)
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      await onSubmit(values)
    }
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  return { values, errors, touched, handleChange, handleBlur, handleSubmit, reset, setValues }
}
