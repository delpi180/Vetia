import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Square, AlertCircle } from 'lucide-react'

export default function AudioRecorder({ onGrabacionCompleta }) {
  const [estado, setEstado] = useState('inactivo') // inactivo | grabando | detenido
  const [segundos, setSegundos] = useState(0)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const intervaloRef = useRef(null)

  useEffect(() => {
    return () => {
      clearInterval(intervaloRef.current)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const formatearTiempo = (seg) => {
    const m = String(Math.floor(seg / 60)).padStart(2, '0')
    const s = String(seg % 60).padStart(2, '0')
    return `${m}:${s}`
  }

  const iniciarGrabacion = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        stream.getTracks().forEach((t) => t.stop())
        onGrabacionCompleta(blob)
      }

      recorder.start(250)
      setEstado('grabando')
      setSegundos(0)
      intervaloRef.current = setInterval(() => setSegundos((s) => s + 1), 1000)
    } catch (e) {
      setError('No se pudo acceder al micrófono. Verifica los permisos del navegador.')
    }
  }

  const detenerGrabacion = () => {
    clearInterval(intervaloRef.current)
    mediaRecorderRef.current?.stop()
    setEstado('detenido')
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Indicador visual */}
      <div className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all
        ${estado === 'grabando'
          ? 'bg-red-50 ring-4 ring-red-200 ring-offset-2'
          : 'bg-slate-100'}`}
      >
        {estado === 'grabando' && (
          <span className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-60" />
        )}
        <Mic
          size={40}
          className={estado === 'grabando' ? 'text-red-500 relative z-10' : 'text-slate-400'}
        />
      </div>

      {/* Tiempo */}
      <div className="text-3xl font-mono font-semibold text-slate-700 tabular-nums">
        {formatearTiempo(segundos)}
      </div>

      {/* Estado */}
      <p className="text-sm text-slate-500">
        {estado === 'inactivo' && 'Presiona el botón para iniciar la grabación'}
        {estado === 'grabando' && 'Grabando... habla con naturalidad'}
        {estado === 'detenido' && 'Grabación finalizada'}
      </p>

      {/* Botones */}
      <div className="flex gap-3">
        {estado === 'inactivo' && (
          <button
            onClick={iniciarGrabacion}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            <Mic size={16} />
            Iniciar Grabación
          </button>
        )}

        {estado === 'grabando' && (
          <button
            onClick={detenerGrabacion}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            <Square size={16} />
            Finalizar Grabación
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  )
}
