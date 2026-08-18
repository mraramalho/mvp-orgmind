export type Health = {
  status: string
  version: string
}

export async function getHealth(): Promise<Health> {
  const response = await fetch('/api/health', {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`)
  }

  return response.json() as Promise<Health>
}
