import * as XLSX from 'xlsx'

// Ajusta el ancho de columnas basado en el contenido
function autoWidth(ws, datos) {
  const anchos = datos[0]?.map((_, ci) => {
    const maxLen = datos.reduce((max, fila) => {
      const val = fila[ci] != null ? String(fila[ci]) : ''
      return Math.max(max, val.length)
    }, datos[0][ci] ? String(datos[0][ci]).length : 8)
    return { wch: Math.min(maxLen + 2, 50) }
  }) ?? []
  ws['!cols'] = anchos
}

export function exportarMetricasExcel({ historias, encuestasSUS, encuestasTAM, pacientes }) {
  const wb = XLSX.utils.book_new()

  // ── Hoja 1: Tiempos IA ───────────────────────────────────
  const cabTiempos = [
    'ID Historia', 'Fecha', 'Paciente', 'Diagnostico presuntivo',
    'Transcripcion (ms)', 'Extraccion IA (ms)', 'Edicion manual (ms)', 'Total IA (ms)',
    'Tiempo manual (ms)', 'Ahorro (ms)', '% Reduccion',
    'Total IA (s)', 'Tiempo manual (s)', 'Ahorro (s)',
  ]
  const filasTiempos = historias.map(h => {
    const p = pacientes.find(px => px.id === h.paciente_id)
    const tr = h.duracion_transcripcion_ms
    const ex = h.duracion_extraccion_ms
    const ed = h.tiempo_edicion_ms
    const tot = (tr ?? 0) + (ex ?? 0) + (ed ?? 0)
    const man = h.tiempo_manual_ms
    const ahorro = man != null ? man - tot : ''
    const pct    = (man != null && man > 0) ? +((man - tot) / man * 100).toFixed(1) : ''
    return [
      h.id,
      new Date(h.fecha).toLocaleDateString('es-PE'),
      p?.nombre ?? '—',
      h.historia_clinica?.diagnostico?.presuntivo ?? '—',
      tr ?? '', ex ?? '', ed ?? '', tot > 0 ? tot : '',
      man ?? '', ahorro, pct,
      tot > 0 ? +(tot / 1000).toFixed(2) : '',
      man != null ? +(man / 1000).toFixed(2) : '',
      typeof ahorro === 'number' ? +(ahorro / 1000).toFixed(2) : '',
    ]
  })
  const datosTiempos = [cabTiempos, ...filasTiempos]
  const wsTiempos = XLSX.utils.aoa_to_sheet(datosTiempos)
  autoWidth(wsTiempos, datosTiempos)
  XLSX.utils.book_append_sheet(wb, wsTiempos, 'Tiempos IA')

  // ── Hoja 2: SUS Score ────────────────────────────────────
  const cabSUS = [
    'ID Encuesta', 'ID Historia',
    'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10',
    'Puntaje SUS (0-100)', 'Clasificacion', 'Fecha',
  ]
  const clasSUS = (p) =>
    p >= 90 ? 'Excelente (A)' : p >= 80 ? 'Bueno (B)' : p >= 70 ? 'Aceptable (C)' : p >= 60 ? 'Pobre (D)' : 'Inaceptable (F)'
  const filasSUS = encuestasSUS.map(e => [
    e.id, e.historia_id,
    ...e.respuestas,
    +e.puntaje.toFixed(1), clasSUS(e.puntaje),
    new Date(e.creado_en).toLocaleDateString('es-PE'),
  ])
  const datosSUS = [cabSUS, ...filasSUS]
  const wsSUS = XLSX.utils.aoa_to_sheet(datosSUS)
  autoWidth(wsSUS, datosSUS)
  XLSX.utils.book_append_sheet(wb, wsSUS, 'SUS Score')

  // ── Hoja 3: TAM ──────────────────────────────────────────
  const cabTAM = [
    'ID Encuesta', 'ID Historia',
    'UP1', 'UP2', 'UP3', 'UP4', 'UP5',
    'FUP6', 'FUP7', 'FUP8', 'FUP9',
    'IA10', 'IA11', 'IA12',
    'Utilidad Percibida (1-7)', 'Facilidad de Uso (1-7)',
    'Intencion de Adopcion (1-7)', 'Global TAM (1-7)', 'Fecha',
  ]
  const filasTAM = encuestasTAM.map(e => [
    e.id, e.historia_id,
    ...e.respuestas,
    +e.puntaje_utilidad.toFixed(2), +e.puntaje_facilidad.toFixed(2),
    +e.puntaje_intencion.toFixed(2), +e.puntaje_global.toFixed(2),
    new Date(e.creado_en).toLocaleDateString('es-PE'),
  ])
  const datosTAM = [cabTAM, ...filasTAM]
  const wsTAM = XLSX.utils.aoa_to_sheet(datosTAM)
  autoWidth(wsTAM, datosTAM)
  XLSX.utils.book_append_sheet(wb, wsTAM, 'TAM')

  // ── Hoja 4: Referencias WER (desde localStorage) ─────────
  const werKeys = Object.keys(localStorage).filter(k => k.startsWith('vetia_wf_'))
  if (werKeys.length > 0) {
    const cabWER = ['ID Historia', 'Transcripcion de referencia (texto correcto)']
    const filasWER = []
    werKeys.forEach(k => {
      const hid = Number(k.replace('vetia_wf_', ''))
      try {
        const d = JSON.parse(localStorage.getItem(k) || '{}')
        if (d.tx) filasWER.push([hid, d.tx])
      } catch { /* skip */ }
    })
    if (filasWER.length > 0) {
      const datosWER = [cabWER, ...filasWER]
      const wsWER = XLSX.utils.aoa_to_sheet(datosWER)
      autoWidth(wsWER, datosWER)
      XLSX.utils.book_append_sheet(wb, wsWER, 'Referencias WER')
    }
  }

  // ── Hoja 5: Resumen ──────────────────────────────────────
  const promedioArr = (arr) => arr.length ? +(arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2) : ''
  const tiemposTr  = historias.map(h => h.duracion_transcripcion_ms).filter(v => v != null)
  const tiemposEx  = historias.map(h => h.duracion_extraccion_ms).filter(v => v != null)
  const tiemposEd  = historias.map(h => h.tiempo_edicion_ms).filter(v => v != null)
  const susPunts   = encuestasSUS.map(e => e.puntaje)
  const tamGlobal  = encuestasTAM.map(e => e.puntaje_global)
  const tamUtil    = encuestasTAM.map(e => e.puntaje_utilidad)
  const tamFac     = encuestasTAM.map(e => e.puntaje_facilidad)
  const tamInt     = encuestasTAM.map(e => e.puntaje_intencion)

  const resumenData = [
    ['Metrica', 'Valor', 'N'],
    ['Total consultas', historias.length, ''],
    ['Total encuestas SUS', encuestasSUS.length, ''],
    ['Total encuestas TAM', encuestasTAM.length, ''],
    [],
    ['Tiempos de IA (ms)'],
    ['Promedio transcripcion', promedioArr(tiemposTr), tiemposTr.length],
    ['Promedio extraccion IA', promedioArr(tiemposEx), tiemposEx.length],
    ['Promedio edicion manual', promedioArr(tiemposEd), tiemposEd.length],
    [],
    ['SUS Score (0-100)'],
    ['Promedio SUS', promedioArr(susPunts), susPunts.length],
    ['SUS minimo', susPunts.length ? Math.min(...susPunts) : '', ''],
    ['SUS maximo', susPunts.length ? Math.max(...susPunts) : '', ''],
    [],
    ['TAM Score (1-7)'],
    ['Promedio global', promedioArr(tamGlobal), tamGlobal.length],
    ['Utilidad Percibida', promedioArr(tamUtil), tamUtil.length],
    ['Facilidad de Uso', promedioArr(tamFac), tamFac.length],
    ['Intencion de Adopcion', promedioArr(tamInt), tamInt.length],
  ]
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
  wsResumen['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  const fecha = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `VetIA_Metricas_${fecha}.xlsx`)
}
