# VetIA — Handoff Document
**Fecha:** 2026-05-27
**Universidad:** UPAO, Trujillo, Perú
**Alumna:** Diana
**Cliente real:** Veterinaria Los Pinos

---

## Objetivo del proyecto

Eliminar la doble digitación en la clínica veterinaria. El veterinario habla durante la consulta, el sistema transcribe el audio con Deepgram Nova-3 y extrae automáticamente los campos del formulario clínico usando GPT-4o-mini. El veterinario revisa, edita si es necesario, y guarda. Lo que antes tomaba 10–15 minutos de tipeo manual ahora toma menos de 2 minutos.

El sistema también recopila métricas académicas (WER, F1-Score, tiempos de procesamiento, SUS Score) para validar la tesis.

---

## Estado actual

El sistema está **completamente funcional de punta a punta**. Todo lo que se lista abajo está construido, probado en build y funcionando.

### Backend (FastAPI + SQLite)

| Archivo | Responsabilidad |
|---|---|
| `app/main.py` | FastAPI app, CORS, monta routers |
| `app/models.py` | SQLAlchemy models: `Cliente`, `Paciente`, `Historia`, `EncuestaSUS` |
| `app/core/database.py` | Engine SQLite, `get_db` dependency |
| `app/core/config.py` | Lee `.env` (DEEPGRAM_API_KEY, OPENAI_API_KEY) |
| `app/schemas/historia_clinica.py` | Pydantic v2: modelo clínico-anatómico completo (anamnesis, 11 sistemas, diagnóstico, tratamiento, indicaciones) |
| `app/schemas/historia.py` | Schemas de request/response para historias |
| `app/schemas/cliente.py` | Schemas cliente |
| `app/schemas/paciente.py` | Schemas paciente |
| `app/schemas/metricas.py` | Schemas para endpoints de métricas |
| `app/services/deepgram_service.py` | Transcripción de audio con Deepgram Nova-3, retorna texto + duración |
| `app/services/extraccion_service.py` | Extracción de campos clínicos con GPT-4o-mini Structured Outputs |
| `app/routes/consulta.py` | POST `/api/consulta/procesar` — recibe audio, retorna transcripción + historia_clinica |
| `app/routes/historias.py` | CRUD historias clínicas, GET `/api/historias` |
| `app/routes/clientes.py` | CRUD clientes |
| `app/routes/pacientes.py` | CRUD pacientes |
| `app/routes/metricas.py` | GET `/api/metricas/resumen`, GET `/api/metricas/sus`, POST `/api/metricas/sus` |

### Frontend (React 18 + Vite + Tailwind CSS v4)

| Archivo | Responsabilidad |
|---|---|
| `src/App.jsx` | React Router v6, rutas, layout con Sidebar |
| `src/components/Sidebar.jsx` | Menú lateral con navegación |
| `src/components/AudioRecorder.jsx` | Grabación de audio con MediaRecorder API |
| `src/components/CuestionarioSUS.jsx` | Modal de 10 preguntas SUS, se dispara al guardar una historia |
| `src/components/VoiceAddon.jsx` | Complemento de voz para agregar datos después de la consulta principal |
| `src/components/Toast.jsx` | Sistema de notificaciones toast con contexto React |
| `src/components/ConfirmModal.jsx` | Modal de confirmación reutilizable |
| `src/components/steps/PasoPaciente.jsx` | Paso 1 del wizard: buscar/crear cliente y paciente |
| `src/components/steps/PasoGrabacion.jsx` | Paso 2: grabar audio O entrar en modo manual |
| `src/components/steps/PasoProcesando.jsx` | Paso 3: spinner mientras backend transcribe y extrae |
| `src/components/steps/PasoRevision.jsx` | Paso 4: formulario completo editable, gestión de medicamentos |
| `src/pages/ConsultaPage.jsx` | Orquestador del wizard de 4 pasos, lógica de guardado |
| `src/pages/Dashboard.jsx` | Panel principal: estadísticas, últimas consultas, próximos controles |
| `src/pages/HistoriasPage.jsx` | Lista de todas las historias con expansión inline |
| `src/pages/PacientesPage.jsx` | Lista de pacientes |
| `src/pages/PacientePerfilPage.jsx` | Perfil de paciente: gráfica signos vitales, historial, panel WhatsApp |
| `src/pages/ClientesPage.jsx` | Lista de propietarios |
| `src/pages/ClientePerfilPage.jsx` | Perfil de propietario con sus pacientes |
| `src/pages/MetricasPage.jsx` | 3 tabs: Tiempos de IA, SUS Score, WER/F1-Score |
| `src/pages/AjustesPage.jsx` | Configuración del sistema |

---

## Funcionalidades implementadas (sesiones anteriores + esta sesión)

### Flujo principal
- Wizard de 4 pasos: selección de paciente → grabación/manual → procesamiento IA → revisión y guardado
- **Modo manual sin audio** (esta sesión): botón "Ingresar historia manualmente" en PasoGrabacion salta directo al formulario vacío; guarda `transcripcion: null` y tiempos IA como `null` para no contaminar métricas

### Dashboard
- Saludo dinámico por hora del día
- Stats: consultas totales, propietarios, pacientes, encuestas SUS
- Tiempos promedio de IA (transcripción, extracción, edición, total)
- **Widget "Próximos controles"**: lee `proximo_control_dias` de cada historia y muestra los vencidos/urgentes/futuros con color-coded badges

### Perfil de paciente
- Gráfica mini SVG de signos vitales (temperatura, peso) a lo largo de las consultas
- Historial de consultas expandible con todos los campos clínicos
- Botones de WhatsApp por consulta (resumen de texto + flujo PDF)
- **Panel WhatsApp derecho** (sticky en desktop): 4 plantillas editables (seguimiento, control, medicamento, personalizado) con botones copiar y abrir chat

### HistoriasPage
- Nombre del paciente como link navegable al perfil
- Expansión inline de cada historia

### ConsultaPage — navegación
- Después de guardar: redirige al perfil del paciente si venía de ahí, al dashboard si no
- Botón "Atrás" en PasoGrabacion: vuelve al perfil del paciente si fue lanzado desde ahí
- Precarga de datos del paciente cuando se inicia consulta desde el perfil

### MetricasPage
- **Tab Tiempos**: promedios globales, barra de composición proporcional, tabla por consulta
- **Tab SUS**: puntaje global con gauge circular, barra de rangos (A/B/C/D), promedio por pregunta, tabla individual
- **Tab WER/F1-Score** (esta sesión):
  - Selector de historia clínica (con tick si ya tiene datos de referencia guardados)
  - Sub-tab WER: muestra transcripción Deepgram vs. referencia que escribe el evaluador; calcula WER con backtracking (sustituciones, eliminaciones, inserciones)
  - Sub-tab F1-Score: tabla de 12 campos (Anamnesis / Ex. General / Diagnóstico / Cierre), input de valor correcto por campo, calcula TP/FP/FN → Precisión/Recall/F1 global y por categoría
  - Persiste datos de referencia en localStorage por `historia_id`

### Tratamiento (mejora de esta sesión)
- Botón "+ Agregar medicamento" en la sección Tratamiento (ambos modos)
- Botón "Eliminar" por medicamento

---

## Errores conocidos y cómo se resolvieron

| Problema | Causa | Solución |
|---|---|---|
| `Thermometer`, `Weight` no existen en lucide-react | Esos nombres no son íconos válidos de la librería | Se eliminaron; se usan spans de texto (`text-[10px]`) para "°C" y "kg" |
| `<Link>` dentro de `<button>` | HTML inválido: `<a>` no puede estar dentro de `<button>` | Se convirtió el `<button>` a `<div onClick>` con `cursor-pointer` |
| WhatsApp no puede recibir PDFs por `wa.me` | La API pública de WhatsApp solo acepta texto | Flujo en dos pasos: primero abre el diálogo de impresión (guardar PDF), luego abre el chat con mensaje "adjunte el PDF" |

---

## Qué se intentó y no funcionó

- **Envío directo de PDF por WhatsApp**: la URL `wa.me` solo soporta el parámetro `text=`. Enviar archivos requiere WhatsApp Business API (pago + verificación de Meta). Se documentó como limitación conocida.
- **Íconos `Thermometer` y `Weight` de lucide-react**: no existen con esos nombres en la versión instalada. Se descartaron y se usaron etiquetas de texto.

---

## Pendiente / Próximas mejoras sugeridas

En orden de prioridad para la tesis:

### 1. ~~Cuestionario TAM (Technology Acceptance Model)~~ ✅ IMPLEMENTADO (2026-05-27)
- Modal `CuestionarioTAM.jsx` con 12 preguntas en escala 1–7
- Flujo: guardar historia → SUS → TAM → navegar a perfil/dashboard
- Backend: modelo `RespuestaTAM` (tabla `respuestas_tam`), schemas en `metricas.py`, endpoints `POST/GET /api/metricas/tam`
- Frontend: tab "TAM" en `MetricasPage` con gauge, barras por dimensión (Utilidad Percibida, Facilidad de Uso, Intención de Adopción), tabla individual

### 2. ~~Registro de vacunas y desparasitación~~ ✅ IMPLEMENTADO (2026-05-27)
- Tabla `vacunas` en BD (tipo, nombre, fecha_aplicacion, proxima_dosis_dias, lote, notas)
- Backend: modelo `Vacuna`, schemas en `schemas/vacuna.py`, CRUD + endpoint `/api/vacunas/proximas` en `routes/vacunas.py`
- Frontend: componente `PanelVacunas` en PacientePerfilPage con formulario (datalist con nombres sugeridos), badges de estado (vencida/urgente/próxima) y botón eliminar
- Dashboard: widget "Vacunas y desparasitaciones pendientes" — muestra alertas de los próximos 30 días y vencidas

### 3. ~~Exportar reportes~~ ✅ IMPLEMENTADO (2026-05-27)
- **PDF historia clínica**: `jsPDF` + `jspdf-autotable`. Botón "Descargar PDF" en cada historia del perfil de paciente. Layout profesional con header verde VetIA, secciones (paciente, propietario, diagnóstico, anamnesis, examen general, tabla de sistemas con colores, tabla de tratamiento, indicaciones, transcripción). Footer con número de página. Descarga directa como `historia_{id}_{paciente}.pdf`.
- **Excel de métricas**: `xlsx` (SheetJS). Botón "Exportar Excel" en MetricasPage. Genera `.xlsx` con 5 hojas: Tiempos IA (ms y segundos), SUS Score (respuestas + puntaje + clasificación), TAM (respuestas + puntajes por dimensión), Referencias WER (desde localStorage), Resumen global.
- Paquetes instalados: `jspdf@4.2.1`, `jspdf-autotable@5.0.8`, `xlsx@0.18.5`
- Utilidades: `src/utils/exportPDF.js`, `src/utils/exportExcel.js`

### 5. ~~Sistema de citas y seguimiento clínico~~ ✅ IMPLEMENTADO (2026-05-27)
- **Backend**: modelo `Cita` (tabla `citas`): paciente_id, cliente_id, fecha_hora, tipo, motivo, notas, estado, historia_id
- Rutas: `POST/GET /api/citas`, `GET /api/citas/hoy`, `GET /api/citas/proximas?dias=7`, `PUT /api/citas/{id}`, `PATCH /api/citas/{id}/estado`, `DELETE /api/citas/{id}`
- **CitasPage** (`/citas`): lista agrupada por urgencia (Vencidas/Hoy/Mañana/Semana/Próximas/Completadas/Canceladas), filtros por pestaña, acciones inline (confirmar/completar/cancelar/editar/eliminar), panel lateral para crear/editar
- **Dashboard**: sección "Agenda de hoy" con citas del día + acciones rápidas confirmar/completar; preview de próximas 7 días; stat card "Citas pendientes"
- **PacientePerfilPage**: `PanelCitas` por paciente con formulario inline, gestión de estado, historial de completadas colapsable
- **ConsultaPage**: después de guardar con `proximo_control_dias > 0`, muestra `ModalSugerirCita` (flujo SUS → TAM → sugerir cita → navegar) con fecha pre-calculada y campo motivo
- **Sidebar**: enlace "Agenda" con ícono Calendar

### 4. ~~Modo de comparación manual vs automático~~ ✅ IMPLEMENTADO (2026-05-27)
- Nuevo tab "Manual vs IA" en MetricasPage
- Backend: columna `tiempo_manual_ms` en tabla `historias`, endpoint `PATCH /api/historias/{id}` para guardar el tiempo manual
- Frontend: componente `PanelComparacion` con tabla editable (input en minutos + botón guardar por fila), dobles barras SVG de comparación por consulta, resumen global (ahorro promedio, total ahorrado, % reducción), barra de progreso proporcional IA vs Manual
- Excel actualizado: hoja "Tiempos IA" incluye tiempo_manual_ms, ahorro (ms y s) y % reducción por consulta

---

## Comandos para correr el sistema

```bash
# Backend
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Frontend (en otra terminal)
cd frontend
npm run dev
```

El frontend usa proxy de Vite: todas las peticiones a `/api/*` se redirigen a `http://localhost:8000`.

---

## Variables de entorno (backend/.env)

```
DEEPGRAM_API_KEY=...
OPENAI_API_KEY=sk-proj-...
DEEPGRAM_MODEL=nova-3
LLM_MODEL=gpt-4o-mini
```

No subir a git. Ya está en `.gitignore`.
