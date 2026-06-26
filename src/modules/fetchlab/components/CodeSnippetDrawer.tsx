import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check } from 'lucide-react'
import { useAppSelector } from '@core/hooks/useStore'
import { cn } from '@utils/index'
import type { FetchRequest } from '../dto/types/fetchlab.types'

// ── Build helpers ─────────────────────────────────────────────
function buildUrl(req: FetchRequest): string {
  const base = req.url.startsWith('http') ? req.url : `https://${req.url}`
  const params = req.params.filter((p) => p.enabled && p.key)
  if (!params.length) return base
  return `${base}?${params.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')}`
}

function buildHeaders(req: FetchRequest): Record<string, string> {
  const h: Record<string, string> = {}
  req.headers.filter((r) => r.enabled && r.key).forEach((r) => { h[r.key] = r.value })
  if (req.authType === 'bearer' && req.authData.bearerToken) h['Authorization'] = `Bearer ${req.authData.bearerToken}`
  if (req.authType === 'basic') h['Authorization'] = `Basic ${btoa(`${req.authData.basicUsername || ''}:${req.authData.basicPassword || ''}`)}`
  if (req.authType === 'jwt' && req.authData.jwtToken) h['Authorization'] = `Bearer ${req.authData.jwtToken}`
  if (req.authType === 'apikey' && req.authData.apiKeyIn !== 'query' && req.authData.apiKeyKey) h[req.authData.apiKeyKey] = req.authData.apiKeyValue || ''
  return h
}

function buildBody(req: FetchRequest): string {
  if (['GET', 'HEAD'].includes(req.method)) return ''
  if (req.bodyType === 'json') return req.jsonBody || ''
  if (req.bodyType === 'xml') return req.xmlBody || ''
  if (req.bodyType === 'text') return req.textBody || ''
  if (req.bodyType === 'graphql') return JSON.stringify({ query: req.gqlQuery, variables: req.gqlVars ? (() => { try { return JSON.parse(req.gqlVars) } catch { return {} } })() : {} }, null, 2)
  return ''
}

// ── Language / Library definitions ───────────────────────────
type Lang = 'curl' | 'http' | 'javascript' | 'nodejs' | 'python' | 'go' | 'java' | 'kotlin' | 'php' | 'swift' | 'c'

interface LangDef {
  id: Lang
  label: string
  libs: { id: string; label: string }[]
}

const LANGS: LangDef[] = [
  { id: 'curl',       label: 'cURL',       libs: [{ id: 'default', label: 'cURL' }] },
  { id: 'http',       label: 'HTTP',       libs: [{ id: 'default', label: 'HTTP/1.1' }] },
  { id: 'javascript', label: 'JavaScript', libs: [{ id: 'fetch', label: 'Fetch' }, { id: 'xhr', label: 'XMLHttpRequest' }, { id: 'axios', label: 'Axios' }] },
  { id: 'nodejs',     label: 'Node.js',    libs: [{ id: 'http', label: 'HTTP' }, { id: 'axios', label: 'Axios' }, { id: 'fetch', label: 'node-fetch' }, { id: 'request', label: 'Request' }, { id: 'unirest', label: 'Unirest' }] },
  { id: 'python',     label: 'Python',     libs: [{ id: 'requests', label: 'requests' }, { id: 'http', label: 'http.client' }, { id: 'aiohttp', label: 'aiohttp' }] },
  { id: 'go',         label: 'Go',         libs: [{ id: 'default', label: 'net/http' }] },
  { id: 'java',       label: 'Java',       libs: [{ id: 'httpclient', label: 'HttpClient' }, { id: 'okhttp', label: 'OkHttp' }, { id: 'urlconnection', label: 'URLConnection' }] },
  { id: 'kotlin',     label: 'Kotlin',     libs: [{ id: 'okhttp', label: 'OkHttp' }, { id: 'ktor', label: 'Ktor' }] },
  { id: 'php',        label: 'PHP',        libs: [{ id: 'curl', label: 'cURL' }, { id: 'guzzle', label: 'Guzzle' }] },
  { id: 'swift',      label: 'Swift',      libs: [{ id: 'urlsession', label: 'URLSession' }, { id: 'alamofire', label: 'Alamofire' }] },
  { id: 'c',          label: 'C',          libs: [{ id: 'libcurl', label: 'libcurl' }] },
]

// ── Code generators ───────────────────────────────────────────
function gen(req: FetchRequest, lang: Lang, lib: string): string {
  const url = buildUrl(req)
  const headers = buildHeaders(req)
  const body = buildBody(req)
  const method = req.method
  const hasBody = !!body && !['GET', 'HEAD'].includes(method)
  const hLines = Object.entries(headers)
  const ctJson = hasBody && req.bodyType === 'json' ? 'application/json' : ''
  const allHeaders = ctJson ? { ...headers, 'Content-Type': ctJson } : headers
  const allHLines = Object.entries(allHeaders)

  const hStr = (indent: string, q = '"') =>
    allHLines.map(([k, v]) => `${indent}${q}${k}${q}: ${q}${v}${q}`).join(',\n')

  const hArr = (indent: string, fn: (k: string, v: string) => string) =>
    allHLines.map(([k, v]) => indent + fn(k, v)).join('\n')

  switch (lang) {
    case 'curl': {
      const parts = [`curl --request ${method} \\\n  --url '${url}'`]
      allHLines.forEach(([k, v]) => parts.push(`  --header '${k}: ${v}'`))
      if (hasBody) parts.push(`  --data '${body.replace(/'/g, "\\'")}'`)
      return parts.join(' \\\n')
    }

    case 'http':
      return [
        `${method} ${url} HTTP/1.1`,
        `Host: ${new URL(url.startsWith('http') ? url : `https://${url}`).host}`,
        ...allHLines.map(([k, v]) => `${k}: ${v}`),
        hasBody ? `\n${body}` : '',
      ].filter(Boolean).join('\n')

    case 'javascript':
      if (lib === 'xhr') {
        return `const xhr = new XMLHttpRequest();\nxhr.withCredentials = true;\n\nxhr.addEventListener('readystatechange', function () {\n  if (this.readyState === this.DONE) {\n    console.log(this.responseText);\n  }\n});\n\nxhr.open('${method}', '${url}');\n${allHLines.map(([k, v]) => `xhr.setRequestHeader('${k}', '${v}');`).join('\n')}\n\nxhr.send(${hasBody ? `'${body.replace(/'/g, "\\'")}'` : 'null'});`
      }
      if (lib === 'axios') {
        return `import axios from 'axios';\n\nconst options = {\n  method: '${method}',\n  url: '${url}',${allHLines.length ? `\n  headers: {\n${hStr('    ')}\n  },` : ''}${hasBody ? `\n  data: ${body},` : ''}\n};\n\nconst { data } = await axios.request(options);\nconsole.log(data);`
      }
      // fetch (default)
      return `const response = await fetch('${url}', {\n  method: '${method}',\n${allHLines.length ? `  headers: {\n${hStr('    ')}\n  },\n` : ''}${hasBody ? `  body: ${req.bodyType === 'json' ? `JSON.stringify(${body})` : `'${body}'`},\n` : ''}});\nconst data = await response.json();\nconsole.log(data);`

    case 'nodejs':
      if (lib === 'axios') {
        return `import axios from 'axios';\n\nconst options = {\n  method: '${method}',\n  url: '${url}',${allHLines.length ? `\n  headers: {\n${hStr('    ')}\n  },` : ''}${hasBody ? `\n  data: ${body},` : ''}\n};\n\ntry {\n  const { data } = await axios.request(options);\n  console.log(data);\n} catch (error) {\n  console.error(error);\n}`
      }
      if (lib === 'fetch') {
        return `import fetch from 'node-fetch';\n\nconst response = await fetch('${url}', {\n  method: '${method}',\n${allHLines.length ? `  headers: {\n${hStr('    ')}\n  },\n` : ''}${hasBody ? `  body: ${req.bodyType === 'json' ? `JSON.stringify(${body})` : `'${body}'`},\n` : ''}});\nconst data = await response.json();\nconsole.log(data);`
      }
      if (lib === 'request') {
        return `import request from 'request';\n\nconst options = {\n  method: '${method}',\n  url: '${url}',${allHLines.length ? `\n  headers: {\n${hStr('    ')}\n  },` : ''}${hasBody ? `\n  body: ${body},` : ''}\n};\n\nrequest(options, (error, response) => {\n  if (error) throw new Error(error);\n  console.log(response.body);\n});`
      }
      if (lib === 'unirest') {
        return `import unirest from 'unirest';\n\nconst req = unirest('${method}', '${url}')${allHLines.length ? `\n  .headers({\n${hStr('    ')}\n  })` : ''}${hasBody ? `\n  .send(${body})` : ''};\n\nreq.end((res) => {\n  if (res.error) throw new Error(res.error);\n  console.log(res.body);\n});`
      }
      // http (built-in)
      return `import https from 'https';\n\nconst options = {\n  method: '${method}',\n  hostname: '${new URL(url.startsWith('http') ? url : `https://${url}`).hostname}',\n  path: '${new URL(url.startsWith('http') ? url : `https://${url}`).pathname + new URL(url.startsWith('http') ? url : `https://${url}`).search}',\n  headers: {\n${hStr('    ')}\n  },\n};\n\nconst req = https.request(options, (res) => {\n  const chunks = [];\n  res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));\n  res.on('end', () => console.log(Buffer.concat(chunks).toString('utf8')));\n});\n${hasBody ? `\nreq.write('${body.replace(/'/g, "\\'")}');` : ''}\nreq.end();`

    case 'python':
      if (lib === 'http') {
        const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
        return `import http.client\nimport json\n\nconn = http.client.HTTPSConnection("${parsed.hostname}")\n${allHLines.length ? `headers = {\n${hStr('    ')}\n}\n` : 'headers = {}\n'}conn.request("${method}", "${parsed.pathname}${parsed.search}"${hasBody ? `, '${body.replace(/'/g, "\\'")}'` : ''}, headers)\n\nres = conn.getresponse()\ndata = res.read()\nprint(data.decode("utf-8"))`
      }
      if (lib === 'aiohttp') {
        return `import aiohttp\nimport asyncio\nimport json\n\nasync def main():\n    async with aiohttp.ClientSession() as session:${allHLines.length ? `\n        headers = {\n${allHLines.map(([k,v]) => `            '${k}': '${v}'`).join(',\n')}\n        }` : '\n        headers = {}'}\n        async with session.${method.toLowerCase()}(\n            '${url}',\n            headers=headers${hasBody ? `,\n            ${req.bodyType === 'json' ? `json=${body}` : `data='${body}'`}` : ''}\n        ) as response:\n            data = await response.json()\n            print(data)\n\nasyncio.run(main())`
      }
      // requests (default)
      return `import requests\n\nurl = '${url}'\n${allHLines.length ? `headers = {\n${allHLines.map(([k,v]) => `    '${k}': '${v}'`).join(',\n')}\n}\n` : ''}response = requests.${method.toLowerCase()}(url${allHLines.length ? ', headers=headers' : ''}${hasBody ? `, ${req.bodyType === 'json' ? `json=${body}` : `data='${body}'`}` : ''})\n\nprint(response.json())`

    case 'go':
      return `package main\n\nimport (\n\t"fmt"\n\t"io"\n\t"net/http"\n${hasBody ? '\t"strings"\n' : ''})\n\nfunc main() {\n\t${hasBody ? `payload := strings.NewReader(\`${body}\`)\n\n\t` : ''}req, _ := http.NewRequest("${method}", "${url}", ${hasBody ? 'payload' : 'nil'})\n${hArr('\t', (k, v) => `req.Header.Add("${k}", "${v}")\n`)}\n\tres, _ := http.DefaultClient.Do(req)\n\tdefer res.Body.Close()\n\tbody, _ := io.ReadAll(res.Body)\n\n\tfmt.Println(string(body))\n}`

    case 'java':
      if (lib === 'okhttp') {
        return `import okhttp3.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        OkHttpClient client = new OkHttpClient();\n        ${hasBody ? `MediaType mediaType = MediaType.parse("${req.bodyType === 'json' ? 'application/json' : 'text/plain'}");\n        RequestBody body = RequestBody.create(${JSON.stringify(body)}, mediaType);\n        ` : ''}Request request = new Request.Builder()\n            .url("${url}")\n${hArr('            ', (k, v) => `.addHeader("${k}", "${v}")\n`)}            .${method.toLowerCase() === 'get' ? 'get()' : hasBody ? `method("${method}", body)` : `method("${method}", null)`}\n            .build();\n\n        Response response = client.newCall(request).execute();\n        System.out.println(response.body().string());\n    }\n}`
      }
      if (lib === 'urlconnection') {
        return `import java.net.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        URL url = new URL("${url}");\n        HttpURLConnection con = (HttpURLConnection) url.openConnection();\n        con.setRequestMethod("${method}");\n${hArr('        ', (k, v) => `con.setRequestProperty("${k}", "${v}");\n`)}${hasBody ? `        con.setDoOutput(true);\n        try (OutputStream os = con.getOutputStream()) {\n            os.write(${JSON.stringify(body)}.getBytes("utf-8"));\n        }\n` : ''}        BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream()));\n        String inputLine;\n        StringBuilder content = new StringBuilder();\n        while ((inputLine = in.readLine()) != null) content.append(inputLine);\n        in.close();\n        System.out.println(content);\n    }\n}`
      }
      // HttpClient (Java 11+)
      return `import java.net.http.*;\nimport java.net.URI;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        HttpClient client = HttpClient.newHttpClient();\n        HttpRequest request = HttpRequest.newBuilder()\n            .uri(URI.create("${url}"))\n${hArr('            ', (k, v) => `.header("${k}", "${v}")\n`)}            .method("${method}", ${hasBody ? `HttpRequest.BodyPublishers.ofString(${JSON.stringify(body)})` : 'HttpRequest.BodyPublishers.noBody()'})\n            .build();\n\n        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());\n        System.out.println(response.body());\n    }\n}`

    case 'kotlin':
      if (lib === 'ktor') {
        return `import io.ktor.client.*\nimport io.ktor.client.request.*\nimport io.ktor.client.statement.*\n\nsuspend fun main() {\n    val client = HttpClient()\n    val response: HttpResponse = client.${method.toLowerCase()}("${url}") {\n${allHLines.map(([k,v]) => `        headers["${k}"] = "${v}"`).join('\n')}${hasBody ? `\n        setBody(${JSON.stringify(body)})` : ''}\n    }\n    println(response.bodyAsText())\n    client.close()\n}`
      }
      // OkHttp (default)
      return `import okhttp3.*\n\nfun main() {\n    val client = OkHttpClient()\n    ${hasBody ? `val body = RequestBody.create(MediaType.parse("${req.bodyType === 'json' ? 'application/json' : 'text/plain'}"), ${JSON.stringify(body)})\n    ` : ''}val request = Request.Builder()\n        .url("${url}")\n${hArr('        ', (k, v) => `.addHeader("${k}", "${v}")\n`)}        .${method.toLowerCase() === 'get' ? 'get()' : hasBody ? `method("${method}", body)` : `method("${method}", null)`}\n        .build()\n\n    val response = client.newCall(request).execute()\n    println(response.body()?.string())\n}`

    case 'php':
      if (lib === 'guzzle') {
        return `<?php\nrequire 'vendor/autoload.php';\n\nuse GuzzleHttp\\Client;\n\n$client = new Client();\n$response = $client->request('${method}', '${url}', [\n${allHLines.length ? `    'headers' => [\n${allHLines.map(([k,v]) => `        '${k}' => '${v}'`).join(',\n')}\n    ],\n` : ''}${hasBody ? `    'body' => '${body.replace(/'/g, "\\'")}',\n` : ''}]);\n\necho $response->getBody();\n?>`
      }
      return `<?php\n$curl = curl_init();\n\ncurl_setopt_array($curl, [\n    CURLOPT_URL => '${url}',\n    CURLOPT_RETURNTRANSFER => true,\n    CURLOPT_CUSTOMREQUEST => '${method}',${allHLines.length ? `\n    CURLOPT_HTTPHEADER => [\n${allHLines.map(([k,v]) => `        '${k}: ${v}'`).join(',\n')}\n    ],` : ''}${hasBody ? `\n    CURLOPT_POSTFIELDS => '${body.replace(/'/g, "\\'")}',` : ''}\n]);\n\n$response = curl_exec($curl);\ncurl_close($curl);\necho $response;\n?>`

    case 'swift':
      if (lib === 'alamofire') {
        return `import Alamofire\n\nAF.request("${url}", method: .${method.toLowerCase() as string}${allHLines.length ? `,\n    headers: [\n${allHLines.map(([k,v]) => `        "${k}": "${v}"`).join(',\n')}\n    ]` : ''}${hasBody ? `,\n    parameters: try! JSONSerialization.jsonObject(with: Data(${JSON.stringify(body)}.utf8)) as! [String: Any]` : ''})\n.responseDecodable(of: [String: Any].self) { response in\n    switch response.result {\n    case .success(let value):\n        print(value)\n    case .failure(let error):\n        print(error)\n    }\n}`
      }
      // URLSession (default)
      return `import Foundation\n\nvar request = URLRequest(url: URL(string: "${url}")!)\nrequest.httpMethod = "${method}"\n${allHLines.map(([k,v]) => `request.setValue("${v}", forHTTPHeaderField: "${k}")`).join('\n')}${hasBody ? `\nrequest.httpBody = Data(${JSON.stringify(body)}.utf8)` : ''}\n\nlet task = URLSession.shared.dataTask(with: request) { data, response, error in\n    guard let data = data, error == nil else { print(error ?? "Unknown error"); return }\n    if let json = try? JSONSerialization.jsonObject(with: data) { print(json) }\n    else { print(String(data: data, encoding: .utf8) ?? "") }\n}\ntask.resume()\nRunLoop.main.run(until: Date(timeIntervalSinceNow: 10))`

    case 'c':
      return `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <curl/curl.h>\n\nstruct response { char *data; size_t size; };\n\nstatic size_t write_cb(void *p, size_t s, size_t n, void *u) {\n  struct response *r = u;\n  r->data = realloc(r->data, r->size + s*n + 1);\n  memcpy(r->data + r->size, p, s*n);\n  r->size += s*n;\n  r->data[r->size] = 0;\n  return s*n;\n}\n\nint main(void) {\n  CURL *curl = curl_easy_init();\n  struct response resp = {malloc(1), 0};\n  if (curl) {\n    struct curl_slist *headers = NULL;\n${allHLines.map(([k,v]) => `    headers = curl_slist_append(headers, "${k}: ${v}");`).join('\n')}\n    curl_easy_setopt(curl, CURLOPT_URL, "${url}");\n    curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "${method}");\n    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);\n${hasBody ? `    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, ${JSON.stringify(body)});\n` : ''}    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_cb);\n    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &resp);\n    curl_easy_perform(curl);\n    printf("%s\\n", resp.data);\n    curl_slist_free_all(headers);\n    curl_easy_cleanup(curl);\n    free(resp.data);\n  }\n  return 0;\n}`

    default:
      return '// Not implemented'
  }
}

// ── Type generators ───────────────────────────────────────────
type TypeLang = 'typescript' | 'go' | 'java' | 'kotlin' | 'python' | 'swift'

const TYPE_LANGS: { id: TypeLang; label: string }[] = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'go',         label: 'Go' },
  { id: 'java',       label: 'Java' },
  { id: 'kotlin',     label: 'Kotlin' },
  { id: 'python',     label: 'Python' },
  { id: 'swift',      label: 'Swift' },
]

function typeOf(val: unknown, lang: TypeLang): string {
  if (val === null)             return lang === 'go' ? 'interface{}' : lang === 'java' ? 'Object' : lang === 'kotlin' ? 'Any?' : lang === 'python' ? 'Optional[Any]' : lang === 'swift' ? 'Any?' : 'null'
  if (typeof val === 'string')  return lang === 'go' ? 'string' : lang === 'java' ? 'String' : lang === 'kotlin' ? 'String' : lang === 'python' ? 'str' : lang === 'swift' ? 'String' : 'string'
  if (typeof val === 'number')  return Number.isInteger(val) ? (lang === 'go' ? 'int' : lang === 'java' ? 'int' : lang === 'kotlin' ? 'Int' : lang === 'python' ? 'int' : lang === 'swift' ? 'Int' : 'number') : (lang === 'go' ? 'float64' : lang === 'java' ? 'double' : lang === 'kotlin' ? 'Double' : lang === 'python' ? 'float' : lang === 'swift' ? 'Double' : 'number')
  if (typeof val === 'boolean') return lang === 'go' ? 'bool' : lang === 'java' ? 'boolean' : lang === 'kotlin' ? 'Boolean' : lang === 'python' ? 'bool' : lang === 'swift' ? 'Bool' : 'boolean'
  if (Array.isArray(val))       return lang === 'go' ? '[]interface{}' : lang === 'java' ? 'List<Object>' : lang === 'kotlin' ? 'List<Any>' : lang === 'python' ? 'List[Any]' : lang === 'swift' ? '[Any]' : 'any[]'
  if (typeof val === 'object')  return lang === 'go' ? 'map[string]interface{}' : lang === 'java' ? 'Map<String, Object>' : lang === 'kotlin' ? 'Map<String, Any>' : lang === 'python' ? 'Dict[str, Any]' : lang === 'swift' ? '[String: Any]' : 'Record<string, unknown>'
  return lang === 'typescript' ? 'unknown' : 'Object'
}

const toCamel  = (s: string) => s.replace(/[_\-.](\w)/g, (_, c: string) => c.toUpperCase())
const toPascal = (s: string) => { const c = toCamel(s); return c[0]?.toUpperCase() + c.slice(1) }

function generateTypes(data: unknown, lang: TypeLang, name = 'Response'): string {
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null)
    return generateTypes(data[0], lang, name.replace(/s$/, '') + 'Item') + `\n\n${lang === 'typescript' ? `type ${toPascal(name)} = ${toPascal(name.replace(/s$/, '') + 'Item')}[];` : lang === 'go' ? `type ${toPascal(name)} []${toPascal(name.replace(/s$/, '') + 'Item')}` : `// Array of ${toPascal(name.replace(/s$/, '') + 'Item')}`}`

  if (typeof data !== 'object' || data === null) return `// Response is a ${typeof data} — no types to generate`
  const obj = data as Record<string, unknown>
  const keys = Object.keys(obj)

  switch (lang) {
    case 'typescript':
      return `export interface ${toPascal(name)} {\n${keys.map((k) => `  ${k}: ${typeOf(obj[k], lang)};`).join('\n')}\n}`
    case 'go':
      return `type ${toPascal(name)} struct {\n${keys.map((k) => `\t${toPascal(k)} ${typeOf(obj[k], lang)} \`json:"${k}"\``).join('\n')}\n}`
    case 'java':
      return `public class ${toPascal(name)} {\n${keys.map((k) => `    private ${typeOf(obj[k], lang)} ${toCamel(k)};`).join('\n')}\n\n${keys.map((k) => {
        const t = typeOf(obj[k], lang); const p = toPascal(k); const c = toCamel(k)
        return `    public ${t} get${p}() { return ${c}; }\n    public void set${p}(${t} ${c}) { this.${c} = ${c}; }`
      }).join('\n')}\n}`
    case 'kotlin':
      return `data class ${toPascal(name)}(\n${keys.map((k) => `    val ${toCamel(k)}: ${typeOf(obj[k], lang)}`).join(',\n')}\n)`
    case 'python':
      return `from dataclasses import dataclass\nfrom typing import Optional, List, Dict, Any\n\n@dataclass\nclass ${toPascal(name)}:\n${keys.map((k) => `    ${k}: ${typeOf(obj[k], lang)}`).join('\n')}`
    case 'swift':
      return `struct ${toPascal(name)}: Codable {\n${keys.map((k) => `    let ${toCamel(k)}: ${typeOf(obj[k], lang)}`).join('\n')}\n\n    enum CodingKeys: String, CodingKey {\n${keys.map((k) => `        case ${toCamel(k)} = "${k}"`).join('\n')}\n    }\n}`
    default: return '// Not implemented'
  }
}

// ── Drawer component ──────────────────────────────────────────
interface Props { open: boolean; onClose: () => void }

export function CodeSnippetDrawer({ open, onClose }: Props) {
  const { currentRequest, response } = useAppSelector((s) => s.fetchlab)

  const [mode, setMode]           = useState<'snippet' | 'types'>('snippet')
  const [lang, setLang]           = useState<Lang>('curl')
  const [lib, setLib]             = useState<string>('default')
  const [typeLang, setTypeLang]   = useState<TypeLang>('typescript')
  const [copied, setCopied]       = useState(false)

  const langDef = LANGS.find((l) => l.id === lang) ?? LANGS[0]

  // Reset lib when lang changes
  const handleLangChange = (newLang: Lang) => {
    setLang(newLang)
    const def = LANGS.find((l) => l.id === newLang)
    setLib(def?.libs[0]?.id ?? 'default')
  }

  const code = useMemo(() => {
    if (mode === 'types') {
      if (!response?.body) return '// Send a request first to generate types from the response'
      try { return generateTypes(JSON.parse(response.body), typeLang, 'Response') }
      catch { return '// Response is not valid JSON — cannot generate types' }
    }
    if (!currentRequest) return '// Select a request first'
    return gen(currentRequest, lang, lib)
  }, [mode, currentRequest, lang, lib, typeLang, response])

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lines = code.split('\n')

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />

          <motion.div
            className="fixed right-0 top-0 h-full w-[480px] z-50 bg-surface-950 border-l border-surface-700/60 flex flex-col shadow-2xl"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/60 flex-shrink-0 bg-surface-900">
              <span className="text-sm font-bold text-white">Code Snippet</span>
              <button onClick={onClose} className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Mode tabs */}
            <div className="flex border-b border-surface-700/60 flex-shrink-0">
              {(['snippet', 'types'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={cn('flex-1 py-2.5 text-xs font-semibold transition-all',
                    mode === m ? 'text-brand-400 border-b-2 border-brand-500' : 'text-surface-400 hover:text-white'
                  )}>
                  {m === 'snippet' ? 'Code Snippet' : 'Generate Types'}
                </button>
              ))}
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-700/60 flex-shrink-0 bg-surface-900/60">
              {mode === 'snippet' ? (
                <>
                  <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider w-10">Code</span>
                  <select value={lang} onChange={(e) => handleLangChange(e.target.value as Lang)}
                    className="bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500 cursor-pointer appearance-none flex-1">
                    {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                  {langDef.libs.length > 1 && (
                    <select value={lib} onChange={(e) => setLib(e.target.value)}
                      className="bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500 cursor-pointer appearance-none flex-1">
                      {langDef.libs.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                    </select>
                  )}
                </>
              ) : (
                <>
                  <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider w-10">Types</span>
                  <select value={typeLang} onChange={(e) => setTypeLang(e.target.value as TypeLang)}
                    className="bg-surface-800 border border-surface-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-brand-500 cursor-pointer appearance-none flex-1">
                    {TYPE_LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                </>
              )}
              <button onClick={copy}
                className={cn('flex items-center gap-1.5 text-xs font-medium border px-3 py-1.5 rounded-lg transition-colors flex-shrink-0',
                  copied ? 'text-green-400 border-green-500/40 bg-green-500/10' : 'text-surface-300 hover:text-white border-surface-700 hover:border-surface-600 bg-surface-800'
                )}>
                {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>

            {/* Code with line numbers */}
            <div className="flex-1 overflow-auto bg-surface-950">
              <table className="w-full border-collapse font-mono text-[12px]">
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i} className="hover:bg-surface-900/50">
                      <td className="select-none text-right text-[11px] text-surface-700 pr-4 pl-3 py-0 leading-6 w-10 border-r border-surface-800/60 align-top">{i + 1}</td>
                      <td className="pl-4 pr-4 py-0 leading-6 text-slate-300 whitespace-pre break-all align-top">{line || ' '}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
