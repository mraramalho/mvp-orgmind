import { useQuery } from '@tanstack/react-query'
import { getHealth } from './api/health'
import './styles.css'

export function App() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    retry: false,
    refetchInterval: 30_000,
  })

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Process intelligence</p>
        <h1>OrgMind</h1>
        <p className="summary">
          Mapeie processos BPMN e transforme o conhecimento operacional em análises acionáveis.
        </p>

        <div className="status-card" aria-live="polite">
          <span
            className={`status-dot ${health.isSuccess ? 'online' : health.isError ? 'offline' : ''}`}
            aria-hidden="true"
          />
          {health.isPending && <span>Verificando a API…</span>}
          {health.isSuccess && (
            <span>
              API disponível <small>versão {health.data.version}</small>
            </span>
          )}
          {health.isError && <span>API indisponível</span>}
        </div>
      </section>
    </main>
  )
}
