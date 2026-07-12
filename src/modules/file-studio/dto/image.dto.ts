export enum ImageOperation {
  Compress = 'compress',
  Resize = 'resize',
  Crop = 'crop',
  Rotate = 'rotate',
  Flip = 'flip',
  Convert = 'convert',
  Watermark = 'watermark',
}

export type WatermarkMode = 'add-text' | 'add-image' | 'remove'

export interface ImageCompressOptions {
  quality: number
  format?: 'png' | 'jpeg' | 'webp' | 'avif'
}

export interface ImageResizeOptions {
  width: number
  height: number
  maintainAspectRatio: boolean
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

export interface ImageCropOptions {
  x: number
  y: number
  width: number
  height: number
}

export interface ImageRotateOptions {
  angle: number
  backgroundColor?: string
}

export interface ImageFlipOptions {
  direction: 'horizontal' | 'vertical'
}

export interface ImageConvertOptions {
  targetFormat: 'png' | 'jpeg' | 'webp' | 'avif'
  quality?: number
}

export interface ImageWatermarkOptions {
  mode: WatermarkMode

  text?: string
  fontFamily?: string
  fontSize?: number
  fontColor?: string
  opacity: number
  angle?: number
  spacing?: number
  repeat?: 'single' | 'multiple'
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  image?: File | null
  scale: number

  x?: number
  y?: number
  width?: number
  height?: number
}

export type ImageOperationOptions =
  | { operation: ImageOperation.Compress; options: ImageCompressOptions }
  | { operation: ImageOperation.Resize; options: ImageResizeOptions }
  | { operation: ImageOperation.Crop; options: ImageCropOptions }
  | { operation: ImageOperation.Rotate; options: ImageRotateOptions }
  | { operation: ImageOperation.Flip; options: ImageFlipOptions }
  | { operation: ImageOperation.Convert; options: ImageConvertOptions }
  | { operation: ImageOperation.Watermark; options: ImageWatermarkOptions }

export interface ImageToolConfig {
  supportedOperations: ImageOperation[]
  supportedFormats: string[]
  maxResolution: { width: number; height: number }
}
