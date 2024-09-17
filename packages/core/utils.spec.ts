import { expect } from 'chai'
import { injectIntoUrl, getHeader } from './utils'
import { RequestHeaders } from './types'

describe('utils', () => {
  describe('injectIntoUrl', () => {
    it('should replace keys in the route with their corresponding values', () => {
      const route = '/api/:version/resource/:id'
      const keys = { version: 'v1', id: '123' }
      const result = injectIntoUrl(route, keys)
      expect(result).to.equal('/api/v1/resource/123')
    })

    it('should return the original route if no keys are provided', () => {
      const route = '/api/resource'
      const keys = {}
      const result = injectIntoUrl(route, keys)
      expect(result).to.equal('/api/resource')
    })

    it('should replace only the keys that are present in the route', () => {
      const route = '/api/:version/resource'
      const keys = { version: 'v1', id: '123' }
      const result = injectIntoUrl(route, keys)
      expect(result).to.equal('/api/v1/resource')
    })
  })

  describe('getHeader', () => {
    it('should return the header value when headers is an object', () => {
      const headers: RequestHeaders = { 'Content-Type': 'application/json' }
      const result = getHeader(headers, 'Content-Type')
      expect(result).to.equal('application/json')
    })

    it('should return the header value when headers is a function', () => {
      const headers: RequestHeaders = (name: string) => {
        if (name === 'Content-Type') return 'application/json'
      }
      const result = getHeader(headers, 'Content-Type')
      expect(result).to.equal('application/json')
    })

    it('should return undefined if the header is not found', () => {
      const headers: RequestHeaders = { 'Content-Type': 'application/json' }
      const result = getHeader(headers, 'Authorization')
      expect(result).to.be.undefined
    })

    it('should throw an error if the header value is an array', () => {
      const headers: RequestHeaders = { 'Set-Cookie': ['cookie1', 'cookie2'] }
      expect(() => getHeader(headers, 'Set-Cookie')).to.throw(
        'Array header values not yet supported'
      )
    })
  })
})
