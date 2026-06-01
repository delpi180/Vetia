import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Paleta de colores (RGB)
const C_VERDE  = [5, 150, 105]
const C_TEXTO  = [30, 41, 59]
const C_GRIS   = [100, 116, 139]
const C_FONDO  = [248, 250, 252]

// Reemplaza caracteres que WinAnsi no soporta bien
function limpiar(str) {
  if (!str) return ''
  return String(str)
    .replace(/‘|’/g, "'")
    .replace(/“|”/g, '"')
    .replace(/–|—/g, '-')
}

const SISTEMAS_LABELS = {
  piel: 'Piel', ojos: 'Ojos', oidos: 'Oidos',
  sistema_digestivo: 'Digestivo', cardiovascular: 'Cardiovascular',
  respiratorio: 'Respiratorio', sistema_urinario: 'Urinario',
  nervioso: 'Nervioso', linfatico: 'Linfatico',
  sistema_locomotor: 'Locomotor', reproductor: 'Reproductor',
}

export function exportarHistoriaPDF(historia, paciente, cliente) {
  const doc  = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const hc   = historia.historia_clinica
  const AW   = doc.internal.pageSize.getWidth()   // 210
  const AH   = doc.internal.pageSize.getHeight()  // 297
  const M    = 16  // margen
  const COL2 = (AW - M * 2) / 2

  // ── Header band ────────────────────────────────────────
  doc.setFillColor(...C_VERDE)
  doc.rect(0, 0, AW, 24, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('VetIA', M, 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text('Historia Clinica — Veterinaria Los Pinos, Trujillo', M, 16)

  const fecha = new Date(historia.fecha).toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  doc.setFontSize(8.5)
  doc.text(`Historia N. ${historia.id}`, AW - M, 10, { align: 'right' })
  doc.text(fecha, AW - M, 16, { align: 'right' })

  let y = 32

  // ── Helpers ─────────────────────────────────────────────
  const checkPagina = (espacio = 25) => {
    if (y + espacio > AH - 12) { doc.addPage(); y = 20 }
  }

  const seccion = (titulo) => {
    checkPagina(12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_VERDE)
    doc.text(titulo.toUpperCase(), M, y)
    doc.setDrawColor(...C_VERDE)
    doc.setLineWidth(0.25)
    doc.line(M, y + 1.2, AW - M, y + 1.2)
    y += 6
    doc.setTextColor(...C_TEXTO)
  }

  const fila2 = (l1, v1, l2, v2) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...C_GRIS)
    doc.text(l1 + ':', M, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C_TEXTO)
    if (v1 != null) doc.text(limpiar(String(v1)), M + 28, y)
    if (l2) {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C_GRIS)
      doc.text(l2 + ':', M + COL2, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C_TEXTO)
      if (v2 != null) doc.text(limpiar(String(v2)), M + COL2 + 28, y)
    }
    y += 5.5
  }

  const campo = (label, valor, labelW = 32) => {
    if (valor == null || valor === '') return
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...C_GRIS)
    doc.text(label + ':', M, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C_TEXTO)
    const lines = doc.splitTextToSize(limpiar(String(valor)), AW - M - M - labelW)
    doc.text(lines, M + labelW, y)
    y += Math.max(5.5, lines.length * 4.5)
  }

  // ── Paciente ─────────────────────────────────────────────
  seccion('Paciente')
  fila2('Nombre', paciente.nombre, 'Especie', paciente.especie)
  fila2('Raza', paciente.raza || '—', 'Edad', paciente.edad || '—')
  fila2('Sexo', paciente.sexo || '—', '', null)
  y += 3

  // ── Propietario ──────────────────────────────────────────
  if (cliente) {
    seccion('Propietario')
    fila2('Nombre', cliente.nombre, 'DNI', cliente.dni || '—')
    fila2('Telefono', cliente.telefono || '—', 'Email', cliente.email || '—')
    if (cliente.direccion) campo('Direccion', cliente.direccion)
    y += 3
  }

  // ── Diagnóstico ──────────────────────────────────────────
  seccion('Diagnostico')
  campo('Presuntivo', hc.diagnostico?.presuntivo)
  if (hc.diagnostico?.definitivo) campo('Definitivo', hc.diagnostico.definitivo)
  if (hc.diagnostico?.diferenciales?.length > 0)
    campo('Diferenciales', hc.diagnostico.diferenciales.join(', '))
  y += 3

  // ── Anamnesis ────────────────────────────────────────────
  seccion('Anamnesis')
  campo('Motivo', hc.anamnesis?.motivo_consulta)
  campo('Evolucion', hc.anamnesis?.tiempo_evolucion)
  campo('Detalle', hc.anamnesis?.anamnesis_detalle)
  if (hc.anamnesis?.antecedentes) campo('Antecedentes', hc.anamnesis.antecedentes)
  y += 3

  // ── Examen General ───────────────────────────────────────
  checkPagina(28)
  seccion('Examen Objetivo General')
  const eg = hc.examen_objetivo_general ?? {}
  fila2('Temperatura', eg.temperatura_c ? `${eg.temperatura_c} C` : '—',
        'Peso', eg.peso_kg ? `${eg.peso_kg} kg` : '—')
  fila2('Mucosas', eg.mucosas || '—', 'Sensorio', eg.estado_sensorio || '—')
  fila2('Hidratacion', eg.hidratacion?.estado || '—', 'Cond. corporal', eg.condicion_corporal || '—')
  y += 3

  // ── Sistemas ─────────────────────────────────────────────
  checkPagina(35)
  seccion('Examen Objetivo Particular')
  const sistemasRows = Object.entries(hc.examen_objetivo_particular ?? {}).map(([k, v]) => [
    SISTEMAS_LABELS[k] ?? k,
    v.estado ?? 'NO_EXPLORADO',
    limpiar(v.descripcion || ''),
  ])
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [['Sistema', 'Estado', 'Descripcion']],
    body: sistemasRows,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: C_VERDE, textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 30 } },
    alternateRowStyles: { fillColor: C_FONDO },
    didParseCell(data) {
      if (data.column.index === 1 && data.section === 'body') {
        const est = data.cell.raw
        if (est === 'ANORMAL')       data.cell.styles.textColor = [220, 38, 38]
        else if (est === 'NORMAL')   data.cell.styles.textColor = [22, 163, 74]
        else                         data.cell.styles.textColor = [148, 163, 184]
      }
    },
  })
  y = doc.lastAutoTable.finalY + 5

  // ── Tratamiento ──────────────────────────────────────────
  if (hc.tratamiento?.length > 0) {
    checkPagina(20)
    seccion('Tratamiento')
    const tratRows = hc.tratamiento.map(t => [
      limpiar(t.farmaco ?? ''),
      limpiar(t.presentacion ?? ''),
      limpiar(t.dosis ?? ''),
      t.via ?? '',
      limpiar(t.frecuencia ?? ''),
      t.duracion_dias ? `${t.duracion_dias} d` : '',
      limpiar(t.indicaciones ?? ''),
    ])
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['Farmaco', 'Present.', 'Dosis', 'Via', 'Frecuencia', 'Dias', 'Indicaciones']],
      body: tratRows,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: C_VERDE, textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 30 }, 3: { cellWidth: 14 }, 5: { cellWidth: 12 } },
      alternateRowStyles: { fillColor: C_FONDO },
    })
    y = doc.lastAutoTable.finalY + 5
  }

  // ── Indicaciones y cierre ────────────────────────────────
  const ic = hc.indicaciones_cierre ?? {}
  if (ic.indicaciones_casa || ic.proximo_control_dias || ic.dieta_recomendada) {
    checkPagina(20)
    seccion('Indicaciones y Cierre')
    campo('Indicaciones', ic.indicaciones_casa)
    campo('Dieta', ic.dieta_recomendada)
    if (ic.proximo_control_dias) campo('Control en', `${ic.proximo_control_dias} dias`)
    campo('Examenes', ic.examenes_solicitados)
    campo('Observaciones', ic.observaciones)
    y += 3
  }

  // ── Transcripción ────────────────────────────────────────
  if (historia.transcripcion) {
    checkPagina(25)
    seccion('Transcripcion — Deepgram Nova-3')
    const lineas = doc.splitTextToSize(limpiar(historia.transcripcion), AW - M * 2)
    const maxLineas = Math.min(lineas.length, 40)
    const alturaBox = maxLineas * 4.2 + 6
    doc.setFillColor(...C_FONDO)
    doc.roundedRect(M, y - 2, AW - M * 2, alturaBox, 2, 2, 'F')
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(...C_GRIS)
    doc.text(lineas.slice(0, maxLineas), M + 3, y + 3)
    y += alturaBox + 3
  }

  // ── Footer en todas las páginas ──────────────────────────
  const totalPags = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPags; p++) {
    doc.setPage(p)
    doc.setFillColor(...C_FONDO)
    doc.rect(0, AH - 10, AW, 10, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...C_GRIS)
    doc.text('Generado por VetIA — Veterinaria Los Pinos', M, AH - 4)
    doc.text(`Pagina ${p} / ${totalPags}`, AW - M, AH - 4, { align: 'right' })
  }

  const nombre = `historia_${historia.id}_${limpiar(paciente.nombre).replace(/\s+/g, '_')}.pdf`
  doc.save(nombre)
}
