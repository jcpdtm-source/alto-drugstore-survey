'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Prize, ConsolationMessage, PrizeDelivery, GameConfig } from '@/lib/types'

export default function JuegoAdminPage() {
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [consolations, setConsolations] = useState<ConsolationMessage[]>([])
  const [deliveries, setDeliveries] = useState<PrizeDelivery[]>([])
  const [activeTab, setActiveTab] = useState<'config' | 'prizes' | 'consolation' | 'deliveries'>('config')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // ── Form states ─────────────────────────────────────────────
  const [newPrize, setNewPrize] = useState({ name: '', message: '', activation_vote: 1000, frequency: 5000, priority: 1, stock: '', is_active: true })
  const [newConsolation, setNewConsolation] = useState('')

  const load = useCallback(async () => {
    const [cfgRes, pRes, cRes, dRes] = await Promise.all([
      fetch('/api/admin/game/config'),
      fetch('/api/admin/game/prizes'),
      fetch('/api/admin/game/consolation'),
      fetch('/api/admin/game/deliveries'),
    ])
    if (cfgRes.ok) setConfig(await cfgRes.json())
    if (pRes.ok) setPrizes(await pRes.json())
    if (cRes.ok) setConsolations(await cRes.json())
    if (dRes.ok) setDeliveries(await dRes.json())
  }, [])

  useEffect(() => { load() }, [load])

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  // ── Config ──────────────────────────────────────────────────
  const saveConfig = async (patch: Partial<GameConfig>) => {
    setSaving(true)
    const res = await fetch('/api/admin/game/config', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) { setConfig(await res.json()); flash('Guardado') }
    else flash('Error al guardar')
    setSaving(false)
  }

  // ── Premios ─────────────────────────────────────────────────
  const createPrize = async () => {
    const res = await fetch('/api/admin/game/prizes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newPrize, stock: newPrize.stock ? Number(newPrize.stock) : null }),
    })
    if (res.ok) {
      setNewPrize({ name: '', message: '', activation_vote: 1000, frequency: 5000, priority: 1, stock: '', is_active: true })
      load(); flash('Premio creado')
    } else flash('Error al crear')
  }

  const togglePrize = async (p: Prize) => {
    await fetch(`/api/admin/game/prizes/${p.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !p.is_active }),
    })
    load()
  }

  const deletePrize = async (id: string) => {
    if (!confirm('¿Eliminar este premio?')) return
    await fetch(`/api/admin/game/prizes/${id}`, { method: 'DELETE' })
    load()
  }

  // ── Consolación ─────────────────────────────────────────────
  const createConsolation = async () => {
    if (!newConsolation.trim()) return
    const res = await fetch('/api/admin/game/consolation', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newConsolation }),
    })
    if (res.ok) { setNewConsolation(''); load(); flash('Mensaje creado') }
  }

  const toggleConsolation = async (c: ConsolationMessage) => {
    await fetch(`/api/admin/game/consolation/${c.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !c.is_active }),
    })
    load()
  }

  const deleteConsolation = async (id: string) => {
    if (!confirm('¿Eliminar?')) return
    await fetch(`/api/admin/game/consolation/${id}`, { method: 'DELETE' })
    load()
  }

  const tabStyle = (t: string) => ({
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 600,
    background: activeTab === t ? '#f6d365' : 'rgba(255,255,255,0.1)',
    color: activeTab === t ? '#1a1a2e' : '#ccc',
  })

  const inputStyle = { background: '#374151', border: '1px solid #4B5563', borderRadius: 8, color: 'white', padding: '8px 12px', fontSize: 14, width: '100%', boxSizing: 'border-box' as const }
  const btnPrimary = { background: '#f6d365', color: '#1a1a2e', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }
  const btnDanger = { background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }

  return (
    <div style={{ minHeight: '100vh', background: '#111827', padding: '32px 16px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: 0 }}>🎰 Sistema de Premios</h1>
            {config && (
              <p style={{ color: '#9CA3AF', fontSize: 13, margin: '4px 0 0' }}>
                Contador global: <span style={{ color: '#f6d365', fontWeight: 700 }}>{config.global_counter.toLocaleString()}</span> participaciones
              </p>
            )}
          </div>
          <a href="/admin/dashboard" style={{ color: '#9CA3AF', fontSize: 13, textDecoration: 'none' }}>← Panel</a>
        </div>

        {msg && <div style={{ background: '#065F46', color: '#6EE7B7', borderRadius: 8, padding: '8px 16px', marginBottom: 16, fontSize: 13 }}>{msg}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          <button style={tabStyle('config')} onClick={() => setActiveTab('config')}>Configuración</button>
          <button style={tabStyle('prizes')} onClick={() => setActiveTab('prizes')}>Premios ({prizes.length})</button>
          <button style={tabStyle('consolation')} onClick={() => setActiveTab('consolation')}>Consolación ({consolations.length})</button>
          <button style={tabStyle('deliveries')} onClick={() => setActiveTab('deliveries')}>Historial ({deliveries.length})</button>
        </div>

        {/* ── TAB: Config ── */}
        {activeTab === 'config' && config && (
          <div style={{ background: '#1F2937', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'white', fontWeight: 700, margin: '0 0 4px' }}>Estado del juego</p>
                <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>
                  {config.is_active ? '✅ Activo — los clientes pueden participar' : '⏸️ Inactivo — el juego está pausado'}
                </p>
              </div>
              <button
                onClick={() => saveConfig({ is_active: !config.is_active })}
                style={{ ...btnPrimary, background: config.is_active ? '#374151' : '#f6d365', color: config.is_active ? 'white' : '#1a1a2e' }}
                disabled={saving}
              >
                {config.is_active ? 'Pausar juego' : 'Activar juego'}
              </button>
            </div>

            <div>
              <label style={{ color: '#D1D5DB', fontSize: 13, fontWeight: 600 }}>Tiempo de canje (horas)</label>
              <p style={{ color: '#9CA3AF', fontSize: 12, margin: '2px 0 8px' }}>El cliente tiene este tiempo para canjear el premio en caja</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number" min={1} max={24}
                  value={config.redemption_hours}
                  onChange={e => setConfig({ ...config, redemption_hours: Number(e.target.value) })}
                  style={{ ...inputStyle, width: 80 }}
                />
                <button onClick={() => saveConfig({ redemption_hours: config.redemption_hours })} style={btnPrimary} disabled={saving}>
                  Guardar
                </button>
              </div>
            </div>

            <div>
              <label style={{ color: '#D1D5DB', fontSize: 13, fontWeight: 600 }}>Reiniciar contador</label>
              <p style={{ color: '#9CA3AF', fontSize: 12, margin: '2px 0 8px' }}>Solo si querés empezar el conteo desde cero (cuidado: afecta las frecuencias de premios)</p>
              <button
                onClick={() => { if (confirm('¿Reiniciar el contador a 0? Esto afecta cuándo se entregan los próximos premios.')) saveConfig({ global_counter: 0 }) }}
                style={{ ...btnDanger, padding: '8px 16px', fontSize: 13 }}
              >
                Reiniciar contador a 0
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: Premios ── */}
        {activeTab === 'prizes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Formulario nuevo premio */}
            <div style={{ background: '#1F2937', borderRadius: 16, padding: 24 }}>
              <h3 style={{ color: 'white', margin: '0 0 16px', fontSize: 15 }}>Nuevo premio</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ color: '#D1D5DB', fontSize: 12, fontWeight: 600 }}>Nombre interno</label>
                  <input style={inputStyle} placeholder="ej: Pelota de fútbol" value={newPrize.name} onChange={e => setNewPrize({ ...newPrize, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ color: '#D1D5DB', fontSize: 12, fontWeight: 600 }}>Mensaje que ve el ganador</label>
                  <input style={inputStyle} placeholder="ej: ¡Ganaste una pelota de fútbol!" value={newPrize.message} onChange={e => setNewPrize({ ...newPrize, message: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ color: '#D1D5DB', fontSize: 11, fontWeight: 600 }}>Voto activación</label>
                    <input type="number" style={inputStyle} value={newPrize.activation_vote} onChange={e => setNewPrize({ ...newPrize, activation_vote: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label style={{ color: '#D1D5DB', fontSize: 11, fontWeight: 600 }}>Frecuencia (cada N)</label>
                    <input type="number" style={inputStyle} value={newPrize.frequency} onChange={e => setNewPrize({ ...newPrize, frequency: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label style={{ color: '#D1D5DB', fontSize: 11, fontWeight: 600 }}>Prioridad (1=mayor)</label>
                    <input type="number" min={1} style={inputStyle} value={newPrize.priority} onChange={e => setNewPrize({ ...newPrize, priority: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label style={{ color: '#D1D5DB', fontSize: 11, fontWeight: 600 }}>Stock (vacío=∞)</label>
                    <input type="number" style={inputStyle} value={newPrize.stock} onChange={e => setNewPrize({ ...newPrize, stock: e.target.value })} placeholder="∞" />
                  </div>
                </div>
                <button onClick={createPrize} style={{ ...btnPrimary, alignSelf: 'flex-start' }}>Crear premio</button>
              </div>
            </div>

            {/* Lista de premios */}
            {prizes.map(p => (
              <div key={p.id} style={{ background: '#1F2937', borderRadius: 12, padding: '16px 20px', opacity: p.is_active ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: 'white', fontWeight: 700 }}>{p.name}</span>
                      <span style={{ background: '#374151', color: '#9CA3AF', fontSize: 11, padding: '2px 8px', borderRadius: 4 }}>Prioridad {p.priority}</span>
                      {!p.is_active && <span style={{ color: '#6B7280', fontSize: 11 }}>INACTIVO</span>}
                    </div>
                    <p style={{ color: '#D1D5DB', fontSize: 13, margin: '0 0 6px' }}>{p.message}</p>
                    <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>
                      Desde voto {p.activation_vote.toLocaleString()} · Cada {p.frequency.toLocaleString()} votos ·{' '}
                      Stock: {p.stock != null ? `${p.stock_remaining}/${p.stock}` : '∞'} ·{' '}
                      Entregados: {p.deliveries_count ?? 0}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => togglePrize(p)} style={{ background: p.is_active ? '#374151' : '#065F46', color: p.is_active ? '#9CA3AF' : '#6EE7B7', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                      {p.is_active ? 'Pausar' : 'Activar'}
                    </button>
                    <button onClick={() => deletePrize(p.id)} style={btnDanger}>Eliminar</button>
                  </div>
                </div>
              </div>
            ))}

            {prizes.length === 0 && <p style={{ color: '#6B7280', textAlign: 'center', padding: 24 }}>No hay premios configurados</p>}
          </div>
        )}

        {/* ── TAB: Consolación ── */}
        {activeTab === 'consolation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#1F2937', borderRadius: 16, padding: 24 }}>
              <h3 style={{ color: 'white', margin: '0 0 12px', fontSize: 15 }}>Nuevo mensaje de consolación</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="ej: ¡Muy cerca! Seguí intentando" value={newConsolation} onChange={e => setNewConsolation(e.target.value)} onKeyDown={e => e.key === 'Enter' && createConsolation()} />
                <button onClick={createConsolation} style={btnPrimary}>Agregar</button>
              </div>
            </div>

            {consolations.map(c => (
              <div key={c.id} style={{ background: '#1F2937', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: c.is_active ? 1 : 0.5 }}>
                <span style={{ color: '#D1D5DB', fontSize: 14 }}>{c.message}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => toggleConsolation(c)} style={{ background: c.is_active ? '#374151' : '#065F46', color: c.is_active ? '#9CA3AF' : '#6EE7B7', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                    {c.is_active ? 'Ocultar' : 'Mostrar'}
                  </button>
                  <button onClick={() => deleteConsolation(c.id)} style={btnDanger}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: Historial ── */}
        {activeTab === 'deliveries' && (
          <div style={{ background: '#1F2937', borderRadius: 16, overflow: 'hidden' }}>
            {deliveries.length === 0 ? (
              <p style={{ color: '#6B7280', textAlign: 'center', padding: 32 }}>Aún no se entregaron premios</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#374151' }}>
                    {['Premio', 'Dispositivo', 'Voto #', 'Válido hasta', 'Fecha'].map(h => (
                      <th key={h} style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 600, padding: '10px 16px', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d, i) => (
                    <tr key={d.id} style={{ borderTop: '1px solid #374151', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ color: 'white', fontSize: 13, padding: '10px 16px' }}>{d.prize_name}</td>
                      <td style={{ color: '#9CA3AF', fontSize: 11, padding: '10px 16px', fontFamily: 'monospace' }}>{d.device_fingerprint.slice(0, 8)}...</td>
                      <td style={{ color: '#f6d365', fontSize: 13, padding: '10px 16px', fontWeight: 700 }}>{d.counter_value.toLocaleString()}</td>
                      <td style={{ color: '#fda085', fontSize: 13, padding: '10px 16px' }}>
                        {new Date(d.expires_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ color: '#6B7280', fontSize: 12, padding: '10px 16px' }}>
                        {new Date(d.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
