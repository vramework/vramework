import { Duplex } from 'stream'  // Assuming `Duplex` is from Node.js' 'stream' module
import type { JSONValue } from '@vramework/core'
import { VrameworkHTTPAbstractResponse } from '@vramework/core/http'

export class VrameworkDuplexResponse extends VrameworkHTTPAbstractResponse {
  private aborted = false

  constructor(private duplex: Duplex) {
    super()
    this.duplex.on('close', () => {
      this.aborted = true
    })
  }

  // Set the status code for the response
  public setStatus(status: number): void {
    if (!this.aborted) {
      this.duplex.write(`HTTP/1.1 ${status} OK\r\n`)
    }
  }

  // Set the response body as JSON
  public setJson(body: JSONValue): void {
    this.setHeader('Content-Type', 'application/json')
    this.setResponse(JSON.stringify(body))
  }

  public setResponse(body: string): void {
    if (!this.aborted) {
      this.writeBody(body)
    }
  }

  // Helper function to write the body
  private writeBody(body: string | Buffer): void {
    if (!this.aborted) {
      // Write the headers
      this.duplex.write('\r\n')  // Empty line to separate headers from body
      // Write the actual body content
      this.duplex.write(body)
    }
  }

  // Set headers (for content-type, cookies, etc.)
  public setHeader(name: string, value: string): void {
    if (!this.aborted) {
      // Write the header to the response (e.g., Content-Type)
      this.duplex.write(`${name}: ${value}\r\n`)
    }
  }

  // End the response
  public end(): void {
    if (!this.aborted) {
      this.duplex.end()  // Close the Duplex stream
    }
  }
}
