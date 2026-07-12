import type { ToolDef, Category } from '../dto/types/devtools.types'

export const CATEGORIES: Category[] = [
  {
    id: 'encoding',
    label: 'Encoding',
    description: 'Base64, URL encoding, and parsing utilities',
    accentClass: 'text-sky-400',
    gradientFrom: 'from-sky-500',
    gradientTo: 'to-cyan-600',
  },
  {
    id: 'json-data',
    label: 'JSON & Data',
    description: 'UUID generation, format conversion, JSON editing',
    accentClass: 'text-emerald-400',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-green-600',
  },
  {
    id: 'design',
    label: 'Design Tools',
    description: 'Color utilities, gradients, and palettes',
    accentClass: 'text-pink-400',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-fuchsia-600',
  },
  {
    id: 'text-tools',
    label: 'Text Tools',
    description: 'Diff checking, markdown tables, lorem ipsum',
    accentClass: 'text-amber-400',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-yellow-600',
  },
  {
    id: 'utilities',
    label: 'Developer Utilities',
    description: 'QR codes, HTTP status, typing test, spinner',
    accentClass: 'text-violet-400',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-600',
  },
  {
    id: 'security',
    label: 'Security',
    description: 'JWT inspection, token & password generation',
    accentClass: 'text-rose-400',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-red-600',
  },
]

export const ALL_TOOLS: ToolDef[] = [
  // Encoding (3)
  {
    id: 'base64',
    name: 'Base64 Encoder / Decoder',
    description: 'Encode text or files to Base64 and decode Base64 back to readable content.',
    category: 'encoding',
    keywords: ['base64', 'encode', 'decode', 'binary', 'text'],
    badge: 'popular',
  },
  {
    id: 'url-encoder',
    name: 'URL Encoder',
    description: 'Safely encode and decode special characters in URLs and query strings.',
    category: 'encoding',
    keywords: ['url', 'encode', 'decode', 'percent', 'query'],
  },
  {
    id: 'url-parser',
    name: 'URL Parser',
    description: 'Break down any URL into protocol, hostname, path, query params, and hash.',
    category: 'encoding',
    keywords: ['url', 'parse', 'query', 'params', 'hostname', 'protocol'],
  },

  // JSON & Data (3)
  {
    id: 'uuid',
    name: 'UUID Generator',
    description: 'Generate universally unique identifiers (UUIDs) in v1 or v4 format.',
    category: 'json-data',
    keywords: ['uuid', 'guid', 'unique', 'id', 'generate', 'random'],
    badge: 'popular',
  },
  {
    id: 'json-editor',
    name: 'JSON Editor',
    description: 'Edit, format, minify, and validate JSON with syntax highlighting.',
    category: 'json-data',
    keywords: ['json', 'editor', 'format', 'minify', 'validate', 'monaco'],
    badge: 'advanced',
  },
  {
    id: 'data-format',
    name: 'Data Format Converter',
    description: 'Convert between JSON, YAML, XML, and CSV formats bidirectionally.',
    category: 'json-data',
    keywords: ['json', 'yaml', 'xml', 'csv', 'convert', 'format'],
  },

  // Design Tools (4)
  {
    id: 'color-converter',
    name: 'Color Converter',
    description: 'Convert colors between HEX, RGB, HSL, HWB, CMYK, and more formats.',
    category: 'design',
    keywords: ['color', 'hex', 'rgb', 'hsl', 'cmyk', 'convert'],
    badge: 'popular',
  },
  {
    id: 'color-palette',
    name: 'Color Palette Generator',
    description: 'Generate harmonious color palettes — tints, shades, analogous, triadic, and more.',
    category: 'design',
    keywords: ['color', 'palette', 'tints', 'shades', 'analogous', 'complementary'],
  },
  {
    id: 'gradient-maker',
    name: 'Gradient Maker',
    description: 'Create beautiful CSS gradients with multiple color stops and export code.',
    category: 'design',
    keywords: ['gradient', 'css', 'linear', 'radial', 'background', 'color'],
  },
  {
    id: 'color-mixer',
    name: 'Color Mixer',
    description: 'Mix multiple colors together to create a blended result.',
    category: 'design',
    keywords: ['color', 'mix', 'blend', 'combine'],
  },

  // Text Tools (3)
  {
    id: 'diff-checker',
    name: 'Difference Checker',
    description: 'Compare two texts side-by-side with highlighted additions and removals.',
    category: 'text-tools',
    keywords: ['diff', 'compare', 'difference', 'text', 'changes'],
    badge: 'popular',
  },
  {
    id: 'markdown-table',
    name: 'Markdown Table Builder',
    description: 'Build markdown tables visually with add/remove rows and columns.',
    category: 'text-tools',
    keywords: ['markdown', 'table', 'builder', 'md', 'grid'],
  },
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum Generator',
    description: 'Generate placeholder text in paragraphs, sentences, or words.',
    category: 'text-tools',
    keywords: ['lorem', 'ipsum', 'placeholder', 'text', 'generate', 'dummy'],
  },

  // Developer Utilities (4)
  {
    id: 'qrcode',
    name: 'QR Code Generator',
    description: 'Generate QR codes with custom colors, size, and error correction.',
    category: 'utilities',
    keywords: ['qr', 'qrcode', 'barcode', 'scan', 'generate', 'link'],
    badge: 'popular',
  },
  {
    id: 'http-status',
    name: 'HTTP Status Code Explorer',
    description: 'Browse and search all HTTP status codes with descriptions and examples.',
    category: 'utilities',
    keywords: ['http', 'status', 'code', '404', '200', 'rest', 'api'],
  },
  {
    id: 'typing-test',
    name: 'Typing Speed Test',
    description: 'Test and improve your typing speed. WPM tracking, accuracy, difficulty levels, and coding mode.',
    category: 'utilities',
    keywords: ['typing', 'wpm', 'speed', 'keyboard', 'test', 'accuracy'],
    badge: 'new',
  },
  {
    id: 'spinner-wheel',
    name: 'Spinner Wheel',
    description: 'Animated spinning wheel for random picks. Weighted probability, presets, team picker, history.',
    category: 'utilities',
    keywords: ['spinner', 'wheel', 'random', 'pick', 'lottery', 'decision'],
    badge: 'new',
  },

  // Security (3)
  {
    id: 'jwt',
    name: 'JWT Inspector',
    description: 'Decode and inspect JSON Web Tokens — header, payload, and signature.',
    category: 'security',
    keywords: ['jwt', 'json web token', 'decode', 'inspect', 'auth', 'bearer'],
    badge: 'advanced',
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    description: 'Generate strong passwords with entropy calculation and strength meter.',
    category: 'security',
    keywords: ['password', 'generate', 'secure', 'strength', 'entropy'],
    badge: 'popular',
  },
  {
    id: 'token-generator',
    name: 'Token Generator',
    description: 'Generate cryptographically secure tokens with configurable character sets.',
    category: 'security',
    keywords: ['token', 'random', 'secret', 'api key', 'generate', 'secure'],
  },
]
