export interface HttpStatus {
  code: number
  name: string
  description: string
  category: '1xx' | '2xx' | '3xx' | '4xx' | '5xx'
  tip?: string
}

export const HTTP_STATUSES: HttpStatus[] = [
  // 1xx Informational
  { code: 100, name: 'Continue', category: '1xx', description: 'The server has received the request headers and the client should proceed to send the request body.' },
  { code: 101, name: 'Switching Protocols', category: '1xx', description: 'The requester has asked the server to switch protocols and the server has agreed to do so.' },
  { code: 102, name: 'Processing', category: '1xx', description: 'The server is processing the request but no response is available yet.' },
  { code: 103, name: 'Early Hints', category: '1xx', description: 'Used to return some response headers before the final HTTP message.' },
  // 2xx Success
  { code: 200, name: 'OK', category: '2xx', description: 'The request has succeeded.', tip: 'The standard response for successful HTTP requests.' },
  { code: 201, name: 'Created', category: '2xx', description: 'The request has been fulfilled and resulted in a new resource being created.', tip: 'Typically returned for POST requests.' },
  { code: 202, name: 'Accepted', category: '2xx', description: 'The request has been accepted for processing, but processing has not been completed.' },
  { code: 203, name: 'Non-Authoritative Information', category: '2xx', description: 'The server successfully processed the request but is returning information that may be from another source.' },
  { code: 204, name: 'No Content', category: '2xx', description: 'The server successfully processed the request and is not returning any content.', tip: 'Common for DELETE requests.' },
  { code: 205, name: 'Reset Content', category: '2xx', description: 'The server successfully processed the request, but is not returning any content. The client should reset the document view.' },
  { code: 206, name: 'Partial Content', category: '2xx', description: 'The server is delivering only part of the resource due to a range header sent by the client.', tip: 'Used for resumable downloads.' },
  // 3xx Redirection
  { code: 300, name: 'Multiple Choices', category: '3xx', description: 'Indicates multiple options for the resource from which the client may choose.' },
  { code: 301, name: 'Moved Permanently', category: '3xx', description: 'This and all future requests should be directed to the given URI.', tip: 'Use for permanent URL changes. Update your links.' },
  { code: 302, name: 'Found', category: '3xx', description: 'The resource was found but at a different URI temporarily.', tip: 'Temporary redirect — the original URL may be used again later.' },
  { code: 303, name: 'See Other', category: '3xx', description: 'The response to the request can be found under another URI using a GET method.' },
  { code: 304, name: 'Not Modified', category: '3xx', description: 'Indicates that the resource has not been modified since the version specified in the request headers.', tip: 'Used for caching — client can use cached version.' },
  { code: 307, name: 'Temporary Redirect', category: '3xx', description: 'The target resource resides temporarily under a different URI. Method and body are preserved.' },
  { code: 308, name: 'Permanent Redirect', category: '3xx', description: 'The target resource has been assigned a new permanent URI. Method and body are preserved.' },
  // 4xx Client Errors
  { code: 400, name: 'Bad Request', category: '4xx', description: 'The server cannot or will not process the request due to an apparent client error.', tip: 'Check request syntax, parameters, and body format.' },
  { code: 401, name: 'Unauthorized', category: '4xx', description: 'Authentication is required and has failed or has not been provided.', tip: 'Check your Authorization header or token.' },
  { code: 403, name: 'Forbidden', category: '4xx', description: 'The server understood the request but refuses to authorize it.', tip: 'You are authenticated but not allowed to access this resource.' },
  { code: 404, name: 'Not Found', category: '4xx', description: 'The requested resource could not be found.', tip: 'Check the URL and ensure the resource exists.' },
  { code: 405, name: 'Method Not Allowed', category: '4xx', description: 'A request method is not supported for the requested resource.', tip: 'Check allowed methods in the Allow response header.' },
  { code: 406, name: 'Not Acceptable', category: '4xx', description: 'The requested resource is capable of generating only content not acceptable according to the Accept headers.' },
  { code: 408, name: 'Request Timeout', category: '4xx', description: 'The server timed out waiting for the request.', tip: 'Retry the request. May indicate network issues.' },
  { code: 409, name: 'Conflict', category: '4xx', description: 'Indicates that the request could not be processed because of conflict in the current state of the resource.', tip: 'Common when creating a resource that already exists.' },
  { code: 410, name: 'Gone', category: '4xx', description: 'The resource requested is no longer available and will not be available again. Use 404 if permanence is unknown.' },
  { code: 411, name: 'Length Required', category: '4xx', description: 'The request did not specify the length of its content, which is required by the resource.' },
  { code: 413, name: 'Payload Too Large', category: '4xx', description: 'The request is larger than the server is willing or able to process.', tip: 'Reduce request body size or increase server limit.' },
  { code: 414, name: 'URI Too Long', category: '4xx', description: 'The URI provided was too long for the server to process.' },
  { code: 415, name: 'Unsupported Media Type', category: '4xx', description: 'The request entity has a media type which the server does not support.', tip: 'Check your Content-Type header.' },
  { code: 422, name: 'Unprocessable Entity', category: '4xx', description: 'The request was well-formed but unable to be followed due to semantic errors.', tip: 'Check request body for validation errors.' },
  { code: 429, name: 'Too Many Requests', category: '4xx', description: 'The user has sent too many requests in a given amount of time.', tip: 'Implement retry logic with exponential backoff.' },
  // 5xx Server Errors
  { code: 500, name: 'Internal Server Error', category: '5xx', description: 'A generic error message when no more specific message is suitable.', tip: 'Check server logs for details.' },
  { code: 501, name: 'Not Implemented', category: '5xx', description: 'The server does not recognize the request method or lacks the ability to fulfill it.' },
  { code: 502, name: 'Bad Gateway', category: '5xx', description: 'The server was acting as a gateway or proxy and received an invalid response.', tip: 'Often a temporary issue with upstream servers.' },
  { code: 503, name: 'Service Unavailable', category: '5xx', description: 'The server is currently unavailable (overloaded or down for maintenance).', tip: 'Check Retry-After header. Implement retry logic.' },
  { code: 504, name: 'Gateway Timeout', category: '5xx', description: 'The server was acting as a gateway and did not receive a timely response.', tip: 'Increase timeout on upstream service or optimize slow queries.' },
  { code: 505, name: 'HTTP Version Not Supported', category: '5xx', description: 'The server does not support the HTTP protocol version used in the request.' },
]
