import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('App', () => {
  it('shows the backend version when the health check succeeds', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok', version: 'test-version' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    )

    expect(await screen.findByText(/API disponível/)).toBeInTheDocument()
    expect(screen.getByText(/versão test-version/)).toBeInTheDocument()
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/health', {
      headers: { Accept: 'application/json' },
    })
  })
})
