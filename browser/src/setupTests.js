// Setup for Vitest
// Polyfill crypto.subtle for jsdom environment (needed for SEA crypto)
// This must be done before importing any Holster modules
import {webcrypto} from "crypto"
if (!globalThis.crypto) {
  globalThis.crypto = {}
}
if (!globalThis.crypto.subtle) {
  globalThis.crypto.subtle = webcrypto.subtle
}

import "@testing-library/jest-dom"
import {expect, afterEach, vi} from "vitest"
import {cleanup} from "@testing-library/react"

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia for theme tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver for infinite scroll tests
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }

  observe() {
    // Mock observe - trigger callback with all entries visible
    this.callback([{isIntersecting: true}], this)
  }

  unobserve() {}

  disconnect() {}

  takeRecords() {
    return []
  }
}
