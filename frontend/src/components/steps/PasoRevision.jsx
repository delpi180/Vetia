import { useState, useRef } from 'react'
import { ChevronDown, ChevronUp, Save, Clock, Loader2, PenLine, Plus, Trash2 } from 'lucide-react'
import VoiceAddon from '../VoiceAddon'

const TRATAMIENTO_VACIO = () => ({ farmaco: '', presentacion: '', dosis: '', via: 'ORAL', frecuencia: '', duracion_dias: null, indicaciones: '' })

const inputCls = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white"
const selectCls = inputCls

function Campo({ label, valor, onChange, tipo = 'text', opciones }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {opciones ? (
        <select className={selectCls} value={valor ?? ''} onChange={(e) => onChange(e.target.value)}>
          {opciones.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : tipo === 'textarea' ? (
        <textarea className={inputCls + ' resize-none'} rows={2} value={valor ?? ''} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={tipo} className={inputCls} value={valor ?? ''} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  )
}

function Seccion({ titulo, badge, defaultOpen = false, children }) {
  const [abierto, setAbierto] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <button onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">{titulo}</span>
          {badge && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{badge}</span>}
        </div>
        {abierto ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {abierto && <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-3">{children}</div>}
    </div>
  )
}

const OPCIONES_ESTADO = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'ANORMAL', label: 'Anormal' },
  { value: 'NO_EXPLORADO', label: 'No explorado' },
]

const SISTEMAS = [
  ['piel','Piel'], ['ojos','Ojos'], ['oidos','Oídos'],
  ['sistema_digestivo','Digestivo'], ['cardiovascular','Cardiovascular'],
  ['respiratorio','Respiratorio'], ['sistema_urinario','Urinario'],
  ['nervioso','Nervioso'], ['linfatico','Linfático'],
  ['sistema_locomotor','Locomotor'], ['reproductor','Reproductor'],
]

export default function PasoRevision({ resultado, datosPaciente, onGuardar, guardando, modoManual = false }) {
  const [historia, setHistoria] = useState(resultado.historia_clinica)
  const inicioEdicion = useRef(Date.now())

  const set = (ruta, valor) => {
    const partes = ruta.split('.')
    setHistoria((prev) => {
      const copia = structuredClone(prev)
      let obj = copia
      for (let i = 0; i < partes.length - 1; i++) obj = obj[partes[i]]
      obj[partes[partes.length - 1]] = valor
      return copia
    })
  }

  const setTratamiento = (i, campo, valor) => {
    const tr = structuredClone(historia.tratamiento)
    tr[i] = { ...tr[i], [campo]: valor }
    set('tratamiento', tr)
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-800">
            {datosPaciente.nombrePaciente} · {datosPaciente.especie}
            {datosPaciente.raza ? ` · ${datosPaciente.raza}` : ''}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Propietario: {datosPaciente.nombreCliente}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
          {modoManual ? (
            <><PenLine size={12} /> Modo manual</>
          ) : (
            <><Clock size={12} /> {(resultado.duracion_total_ms / 1000).toFixed(1)}s</>
          )}
        </div>
      </div>

      {/* Transcripción */}
      {!modoManual && (
        <div className="bg-slate-800 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Transcripción</p>
          <p className="text-sm text-slate-200 leading-relaxed">{resultado.transcripcion}</p>
        </div>
      )}

      {/* Anamnesis */}
      <Seccion titulo="Anamnesis" defaultOpen>
        <Campo label="Motivo de consulta *" valor={historia.anamnesis.motivo_consulta} onChange={(v) => set('anamnesis.motivo_consulta', v)} />
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Tiempo de evolución" valor={historia.anamnesis.tiempo_evolucion} onChange={(v) => set('anamnesis.tiempo_evolucion', v)} />
          <Campo label="Derivado por" valor={historia.anamnesis.derivado_por} onChange={(v) => set('anamnesis.derivado_por', v)} />
        </div>
        <Campo label="Detalle" valor={historia.anamnesis.anamnesis_detalle} onChange={(v) => set('anamnesis.anamnesis_detalle', v)} tipo="textarea" />
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Alimentación (tipo)" valor={historia.anamnesis.alimentacion?.tipo} onChange={(v) => set('anamnesis.alimentacion.tipo', v)} />
          <Campo label="Cantidad (gr)" valor={historia.anamnesis.alimentacion?.cantidad_gr} onChange={(v) => set('anamnesis.alimentacion.cantidad_gr', v)} tipo="number" />
        </div>
        <Campo label="Antecedentes" valor={historia.anamnesis.antecedentes} onChange={(v) => set('anamnesis.antecedentes', v)} tipo="textarea" />
      </Seccion>

      {/* Examen General */}
      <Seccion titulo="Examen Objetivo General" defaultOpen>
        <div className="grid grid-cols-3 gap-3">
          <Campo label="Temperatura (°C)" valor={historia.examen_objetivo_general.temperatura_c} onChange={(v) => set('examen_objetivo_general.temperatura_c', v)} tipo="number" />
          <Campo label="Peso (kg)" valor={historia.examen_objetivo_general.peso_kg} onChange={(v) => set('examen_objetivo_general.peso_kg', v)} tipo="number" />
          <Campo label="Cond. corporal" valor={historia.examen_objetivo_general.condicion_corporal} onChange={(v) => set('examen_objetivo_general.condicion_corporal', v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Mucosas" valor={historia.examen_objetivo_general.mucosas} onChange={(v) => set('examen_objetivo_general.mucosas', v)} />
          <Campo label="Estado sensorio" valor={historia.examen_objetivo_general.estado_sensorio ?? ''}
            onChange={(v) => set('examen_objetivo_general.estado_sensorio', v)}
            opciones={[
              { value: '', label: 'No evaluado' },
              { value: 'ALERTA', label: 'Alerta' },
              { value: 'DEPRIMIDO', label: 'Deprimido' },
              { value: 'ESTUPOROSO', label: 'Estuporoso' },
              { value: 'COMATOSO', label: 'Comatoso' },
            ]}
          />
        </div>
        <Campo label="Hidratación" valor={historia.examen_objetivo_general.hidratacion?.estado}
          onChange={(v) => set('examen_objetivo_general.hidratacion.estado', v)}
          opciones={OPCIONES_ESTADO}
        />
      </Seccion>

      {/* 11 Sistemas */}
      <Seccion titulo="Examen Objetivo Particular" badge="11 sistemas">
        <div className="space-y-2">
          {SISTEMAS.map(([clave, nombre]) => (
            <div key={clave} className="grid grid-cols-5 gap-2 items-center">
              <label className="text-xs font-medium text-slate-600 col-span-1">{nombre}</label>
              <select
                value={historia.examen_objetivo_particular[clave]?.estado ?? 'NO_EXPLORADO'}
                onChange={(e) => set(`examen_objetivo_particular.${clave}.estado`, e.target.value)}
                className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              >
                {OPCIONES_ESTADO.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input
                placeholder="Descripción..."
                value={historia.examen_objetivo_particular[clave]?.descripcion ?? ''}
                onChange={(e) => set(`examen_objetivo_particular.${clave}.descripcion`, e.target.value)}
                className="col-span-2 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              />
            </div>
          ))}
        </div>
      </Seccion>

      {/* Diagnóstico */}
      <Seccion titulo="Diagnóstico" defaultOpen>
        <Campo label="Diagnóstico presuntivo *" valor={historia.diagnostico.presuntivo} onChange={(v) => set('diagnostico.presuntivo', v)} />
        <Campo label="Diferenciales (separados por coma)"
          valor={historia.diagnostico.diferenciales?.join(', ')}
          onChange={(v) => set('diagnostico.diferenciales', v.split(',').map(s => s.trim()).filter(Boolean))}
        />
        <Campo label="Diagnóstico definitivo" valor={historia.diagnostico.definitivo} onChange={(v) => set('diagnostico.definitivo', v)} />
      </Seccion>

      {/* Tratamiento */}
      <Seccion titulo="Tratamiento" badge={`${historia.tratamiento?.length ?? 0} ítems`} defaultOpen>
        {historia.tratamiento?.length === 0 && (
          <p className="text-sm text-slate-400 italic mb-2">
            {modoManual ? 'Ningún medicamento agregado aún.' : 'No se detectó tratamiento en el audio.'}
          </p>
        )}
        {historia.tratamiento?.map((t, i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Medicamento {i + 1}</p>
              <button
                onClick={() => set('tratamiento', historia.tratamiento.filter((_, j) => j !== i))}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors">
                <Trash2 size={12} /> Eliminar
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Fármaco" valor={t.farmaco} onChange={(v) => setTratamiento(i, 'farmaco', v)} />
              <Campo label="Dosis" valor={t.dosis} onChange={(v) => setTratamiento(i, 'dosis', v)} />
              <Campo label="Vía" valor={t.via} onChange={(v) => setTratamiento(i, 'via', v)}
                opciones={[
                  { value: 'ORAL', label: 'Oral' }, { value: 'SC', label: 'SC' },
                  { value: 'IM', label: 'IM' }, { value: 'IV', label: 'IV' },
                  { value: 'TOPICA', label: 'Tópica' }, { value: 'OFTALMICA', label: 'Oftálmica' },
                  { value: 'OTICA', label: 'Ótica' },
                ]}
              />
              <Campo label="Frecuencia" valor={t.frecuencia} onChange={(v) => setTratamiento(i, 'frecuencia', v)} />
              <Campo label="Duración (días)" valor={t.duracion_dias} onChange={(v) => setTratamiento(i, 'duracion_dias', Number(v))} tipo="number" />
              <Campo label="Indicaciones" valor={t.indicaciones} onChange={(v) => setTratamiento(i, 'indicaciones', v)} />
            </div>
          </div>
        ))}
        <button
          onClick={() => set('tratamiento', [...(historia.tratamiento ?? []), TRATAMIENTO_VACIO()])}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-slate-300 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 rounded-xl text-sm transition-colors">
          <Plus size={14} /> Agregar medicamento
        </button>
      </Seccion>

      {/* Indicaciones y cierre */}
      <Seccion titulo="Indicaciones y Cierre">
        <Campo label="Indicaciones en casa" valor={historia.indicaciones_cierre.indicaciones_casa} onChange={(v) => set('indicaciones_cierre.indicaciones_casa', v)} tipo="textarea" />
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Dieta recomendada" valor={historia.indicaciones_cierre.dieta_recomendada} onChange={(v) => set('indicaciones_cierre.dieta_recomendada', v)} />
          <Campo label="Control en (días)" valor={historia.indicaciones_cierre.proximo_control_dias} onChange={(v) => set('indicaciones_cierre.proximo_control_dias', Number(v))} tipo="number" />
        </div>
        <Campo label="Exámenes solicitados" valor={historia.indicaciones_cierre.examenes_solicitados} onChange={(v) => set('indicaciones_cierre.examenes_solicitados', v)} />
        <Campo label="Observaciones" valor={historia.indicaciones_cierre.observaciones} onChange={(v) => set('indicaciones_cierre.observaciones', v)} tipo="textarea" />
      </Seccion>

      {/* Agregar por voz */}
      <VoiceAddon historiaActual={historia} onActualizar={setHistoria} />

      {/* Guardar */}
      <button onClick={() => onGuardar({ historia, tiempo_edicion_ms: Date.now() - inicioEdicion.current })} disabled={guardando}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-3.5 rounded-2xl font-bold text-sm transition-colors shadow-sm">
        {guardando
          ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
          : <><Save size={16} /> Guardar historia clínica</>
        }
      </button>

      <div className="h-4" />
    </div>
  )
}
