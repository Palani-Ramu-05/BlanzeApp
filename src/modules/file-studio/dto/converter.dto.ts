export type ConversionType =
  | 'png-to-jpg'
  | 'png-to-webp'
  | 'jpg-to-png'
  | 'jpg-to-webp'
  | 'webp-to-png'
  | 'webp-to-jpg'
  | 'csv-to-json'
  | 'json-to-csv'
  | 'txt-to-json'

export interface ConverterPair {
  id: ConversionType
  from: string
  to: string
  fromFormat: string
  toFormat: string
  group: 'image' | 'data'
}

export const CONVERTER_PAIRS: ConverterPair[] = [
  { id: 'png-to-jpg', from: 'PNG', to: 'JPG', fromFormat: 'image/png', toFormat: 'image/jpeg', group: 'image' },
  { id: 'png-to-webp', from: 'PNG', to: 'WEBP', fromFormat: 'image/png', toFormat: 'image/webp', group: 'image' },
  { id: 'jpg-to-png', from: 'JPG', to: 'PNG', fromFormat: 'image/jpeg', toFormat: 'image/png', group: 'image' },
  { id: 'jpg-to-webp', from: 'JPG', to: 'WEBP', fromFormat: 'image/jpeg', toFormat: 'image/webp', group: 'image' },
  { id: 'webp-to-png', from: 'WEBP', to: 'PNG', fromFormat: 'image/webp', toFormat: 'image/png', group: 'image' },
  { id: 'webp-to-jpg', from: 'WEBP', to: 'JPG', fromFormat: 'image/webp', toFormat: 'image/jpeg', group: 'image' },
  { id: 'csv-to-json', from: 'CSV', to: 'JSON', fromFormat: 'text/csv', toFormat: 'application/json', group: 'data' },
  { id: 'json-to-csv', from: 'JSON', to: 'CSV', fromFormat: 'application/json', toFormat: 'text/csv', group: 'data' },
  { id: 'txt-to-json', from: 'TXT', to: 'JSON', fromFormat: 'text/plain', toFormat: 'application/json', group: 'data' },
]

export interface ConverterOptions {
  conversionType: ConversionType
  quality?: number
  delimiter?: string
  encoding?: string
}

export interface ConverterPreview {
  original: string
  converted: string
  formatChanged: { from: string; to: string }
}
