import { useState, useEffect } from 'react'
import {
  Settings, Cpu, Mic, FileText, Download, CheckCircle,
  AlertCircle, ChevronRight, Info, Database,
} from 'lucide-react'

function Panel({ titulo, icono: Icono, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        <Icono size={16} className="text-emerald-600" />
        <span className="font-semibold text-slate-800 text-sm">{titulo}</span>
      </div>
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  )
}

function Fila({ label, valor, badge, mono = false }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      {badge
        ? <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge}`}>{valor}</span>
        : <span className={`text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{valor ?? '—'}</span>
      }
    </div>
  )
}

function FilaBoton({ label, desc, onClick, cargando, listo, icono: Icono }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={onClick}
        disabled={cargando}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-colors"
      >
        {listo
          ? <><CheckCircle size={13} className="text-emerald-500" /> Listo</>
          : cargando
            ? 'Generando...'
            : <><Icono size={13} /> Exportar</>
        }
      </button>
    </div>
  )
}

function exportarCSV(filas, nombreArchivo) {
  const bom = '﻿'
  const csv = bom + filas.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}

export default function AjustesPage() {
  const [config, setConfig] = useState(null)
  const [metricas, setMetricas] = useState(null)
  const [apiOk, setApiOk] = useState(null)
  const [exportando, setExportando] = useState({ tiempos: false, sus: false })
  const [listo, setListo] = useState({ tiempos: false, sus: false })

  useEffect(() => {
    fetch('/api/metricas/config').then(r => r.json()).then(setConfig).catch(() => {})
    fetch('/api/metricas/resumen').then(r => r.json()).then(setMetricas).catch(() => {})
    fetch('/health').then(r => r.ok ? setApiOk(true) : setApiOk(false)).catch(() => setApiOk(false))
  }, [])

  const exportarTiempos = async () => {
    setExportando(e => ({ ...e, tiempos: true }))
    const historias = await fetch('/api/historias').then(r => r.json()).catch(() => [])
    const cabecera = ['ID', 'Fecha', 'Diagnostico', 'Transcripcion_ms', 'Extraccion_ms', 'Edicion_ms', 'Total_ms']
    const filas = historias.map(h => [
      h.id,
      new Date(h.fecha).toLocaleDateString('es-PE'),
      h.historia_clinica?.diagnostico?.presuntivo ?? '',
      h.duracion_transcripcion_ms ?? '',
      h.duracion_extraccion_ms ?? '',
      h.tiempo_edicion_ms ?? '',
      ((h.duracion_transcripcion_ms ?? 0) + (h.duracion_extraccion_ms ?? 0) + (h.tiempo_edicion_ms ?? 0)) || '',
    ])
    exportarCSV([cabecera, ...filas], 'vetia_tiempos.csv')
    setExportando(e => ({ ...e, tiempos: false }))
    setListo(l => ({ ...l, tiempos: true }))
    setTimeout(() => setListo(l => ({ ...l, tiempos: false })), 3000)
  }

  const exportarSUS = async () => {
    setExportando(e => ({ ...e, sus: true }))
    const encuestas = await fetch('/api/metricas/sus').then(r => r.json()).catch(() => [])
    const cabecera = ['ID', 'Historia_ID', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'Puntaje', 'Fecha']
    const filas = encuestas.map(s => [
      s.id, s.historia_id,
      ...s.respuestas,
      s.puntaje,
      new Date(s.creado_en).toLocaleDateString('es-PE'),
    ])
    exportarCSV([cabecera, ...filas], 'vetia_sus.csv')
    setExportando(e => ({ ...e, sus: false }))
    setListo(l => ({ ...l, sus: true }))
    setTimeout(() => setListo(l => ({ ...l, sus: false })), 3000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-800">Ajustes</h1>
        <p className="text-slate-500 text-sm mt-1">Configuración del sistema VetIA</p>
      </div>

      <div className="space-y-5">

        {/* Estado del sistema */}
        <Panel titulo="Estado del sistema" icono={Settings}>
          <Fila
            label="Backend API"
            valor={apiOk === null ? 'Verificando...' : apiOk ? 'Conectado' : 'Sin conexión'}
            badge={
              apiOk === null ? 'bg-slate-100 text-slate-500'
              : apiOk ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
            }
          />
          <Fila label="Versión del sistema" valor={config?.version ?? '...'} mono />
          <Fila label="Modo debug" valor={config?.debug ? 'Activo' : 'Inactivo'}
            badge={config?.debug ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}
          />
        </Panel>

        {/* Modelos de IA */}
        <Panel titulo="Modelos de inteligencia artificial" icono={Cpu}>
          <Fila label="Motor de transcripción" valor={config ? `Deepgram ${config.deepgram_model}` : '...'} />
          <Fila label="Idioma de transcripción" valor={config?.deepgram_language === 'multi' ? 'Multiidioma' : config?.deepgram_language} />
          <Fila label="Modelo de extracción" valor={config?.llm_model ?? '...'} mono />
          <div className="px-5 py-3 flex items-start gap-2 bg-slate-50">
            <Info size={13} className="text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Para cambiar los modelos edita el archivo <span className="font-mono bg-white border border-slate-200 px-1 rounded text-slate-600">.env</span> en la carpeta <span className="font-mono bg-white border border-slate-200 px-1 rounded text-slate-600">backend/</span> y reinicia el servidor.
            </p>
          </div>
        </Panel>

        {/* Audio */}
        <Panel titulo="Configuración de audio" icono={Mic}>
          <Fila label="Duración máxima" valor={config ? `${config.max_audio_duration_seconds / 60} minutos` : '...'} />
          <Fila label="Formatos admitidos" valor={config?.formatos_permitidos?.join(', ') ?? '...'} mono />
        </Panel>

        {/* Base de datos */}
        <Panel titulo="Base de datos" icono={Database}>
          <Fila label="Motor" valor="SQLite" />
          <Fila label="Archivo" valor="backend/vetia.db" mono />
          <Fila label="Total de consultas" valor={metricas?.total_consultas ?? '...'} />
          <Fila label="Encuestas SUS registradas" valor={metricas?.total_encuestas_sus ?? '...'} />
        </Panel>

        {/* Exportar datos */}
        <Panel titulo="Exportar datos para la tesis" icono={Download}>
          <FilaBoton
            label="Tiempos de procesamiento"
            desc="CSV con transcripción, extracción y edición por consulta"
            onClick={exportarTiempos}
            cargando={exportando.tiempos}
            listo={listo.tiempos}
            icono={Download}
          />
          <FilaBoton
            label="Encuestas SUS"
            desc="CSV con las 10 respuestas y puntaje por sesión"
            onClick={exportarSUS}
            cargando={exportando.sus}
            listo={listo.sus}
            icono={Download}
          />
        </Panel>

        {/* Acerca de */}
        <Panel titulo="Acerca del sistema" icono={Info}>
          <Fila label="Nombre" valor="VetIA" />
          <Fila label="Descripción" valor="Sistema automatizado de historias clínicas veterinarias" />
          <Fila label="Universidad" valor="UPAO — Trujillo, Perú" />
          <Fila label="Cliente" valor="Veterinaria Los Pinos" />
          <Fila label="Stack" valor="FastAPI · Deepgram Nova-3 · GPT-4o-mini · React" />
        </Panel>

      </div>
    </div>
  )
}
