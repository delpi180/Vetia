# Proyecto: Sistema Automatizado de Historias Clínicas Veterinarias

## Contexto General

**Tipo de proyecto:** Tesis universitaria (Ingeniería de Computación y Sistemas)
**Universidad:** Universidad Privada Antenor Orrego (UPAO) - Trujillo, Perú
**Cliente real:** Veterinaria Los Pinos
**Objetivo:** Eliminar la doble digitación mediante un sistema que transcribe la voz del veterinario y autocompleta el formulario clínico usando IA.

---

## Arquitectura Técnica

### Stack
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** FastAPI (Python 3.11+)
- **Speech-to-Text:** Deepgram Nova-3 (API en nube, $200 crédito gratis)
- **LLM para extracción:** OpenAI GPT-4o-mini con Structured Outputs
- **Comunicación:** HTTP REST (no WebSocket - procesamiento batch al final)

### Flujo de la Aplicación

```
1. Veterinario selecciona cliente + paciente (manual, de BD existente)
2. Presiona "Iniciar Grabación"
3. Atiende al animal hablando naturalmente
4. Presiona "Finalizar Grabación"
5. Frontend envía el audio al backend
6. Backend transcribe con Deepgram Nova-3
7. Backend extrae campos clínicos con GPT-4o-mini
8. Frontend muestra el formulario AUTO-LLENO
9. Veterinario revisa y edita lo necesario
10. Guarda la historia clínica
```

---

## Estructura del Proyecto

```
tesis-veterinaria/
├── backend/
│   ├── venv/                       # Entorno virtual Python
│   ├── app/
│   │   ├── core/config.py          # Lee variables .env
│   │   ├── schemas/historia_clinica.py  # Modelo Pydantic
│   │   ├── services/
│   │   │   ├── deepgram_service.py      # Transcripción
│   │   │   └── extraccion_service.py    # LLM
│   │   ├── routes/consulta.py      # Endpoint /api/consulta/procesar
│   │   └── main.py                 # FastAPI app
│   ├── .env                        # API keys (NO subir a git)
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx         # Menú lateral estilo Volki
    │   │   ├── AudioRecorder.jsx   # Grabador de audio
    │   │   ├── ConsultaWizard.jsx  # Wizard de 4 pasos
    │   │   └── steps/              # Componentes por paso
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   └── ConsultaPage.jsx
    │   └── App.jsx
    └── package.json
```

---

## Esquema de Datos: Historia Clínica

El formulario clínico está basado en el **modelo clínico-anatómico tradicional veterinario** (no es SOAP). Se inspira en el sistema legado Volki pero con UX mejorado.

### Campos que llena la IA automáticamente:

1. **Anamnesis**
   - motivo_consulta (REQUERIDO)
   - tiempo_evolucion
   - derivado_por
   - anamnesis_detalle
   - alimentacion (tipo, cantidad_gr, veces_al_dia, observaciones)
   - antecedentes

2. **Examen Objetivo General**
   - mucosas
   - temperatura_c (rango 35-43)
   - peso_kg (rango 0.1-100)
   - condicion_corporal
   - estado_sensorio (ALERTA | DEPRIMIDO | ESTUPOROSO | COMATOSO)
   - hidratacion (estado: NORMAL/ANORMAL/NO_EXPLORADO + descripción)

3. **Examen Objetivo Particular** (11 sistemas anatómicos)
   Cada uno con: estado (NORMAL/ANORMAL/NO_EXPLORADO) + descripcion
   - piel, ojos, oidos
   - sistema_digestivo, cardiovascular, respiratorio
   - sistema_urinario, nervioso, linfatico
   - sistema_locomotor, reproductor

4. **Diagnóstico**
   - presuntivo (REQUERIDO)
   - diferenciales (lista)
   - definitivo (opcional)

5. **Tratamiento** (lista estructurada)
   - Cada medicamento: farmaco, presentacion, dosis, via (ORAL/SC/IM/IV/TOPICA/OFTALMICA/OTICA), frecuencia, duracion_dias, indicaciones

6. **Indicaciones y Cierre**
   - indicaciones_casa
   - dieta_recomendada
   - examenes_solicitados
   - observaciones
   - proximo_control_dias

---

## Decisiones Técnicas Importantes

1. **Deepgram Nova-3, no Whisper:** Mejor latencia (<300ms), custom vocabulary veterinario, robusto a ruido
2. **GPT-4o-mini, no GPT-4o:** Tarea de extracción no requiere razonamiento complejo; cuesta ~$0.0007 por consulta
3. **Procesamiento batch (al final), no streaming:** Mayor precisión, menor costo, código más simple
4. **HTTP REST, no WebSocket:** No necesitamos actualizaciones en vivo del formulario
5. **Modelo clínico-anatómico, no SOAP:** Compatibilidad con sistemas legados peruanos (Volki)
6. **Human-in-the-loop:** Vet siempre revisa antes de guardar

---

## Convenciones de Código

### Backend (Python)
- **Versión Python:** 3.11+
- **Formato:** Black + Ruff
- **Tipado:** Type hints obligatorios (mypy strict)
- **Docstrings:** Google style
- **Idioma de comentarios:** Español
- **Idioma de nombres de variables/funciones:** Español snake_case (ej: `historia_clinica`, `extraer_campos`)
- **Idioma de nombres de clases:** Español PascalCase (ej: `HistoriaClinica`)

### Frontend (React)
- **JavaScript** (no TypeScript para esta tesis)
- **Componentes:** Functional components con hooks
- **Estilo:** Tailwind CSS (NO CSS-in-JS)
- **Iconos:** lucide-react
- **Idioma UI:** Español (Perú)
- **Nombres de componentes:** PascalCase en inglés (ej: `AudioRecorder.jsx`)

### Naming Convention de la Marca

El sistema se llama **"VetIA"** (Veterinaria + IA). El logo y colores los definiremos juntos.

---

## API Keys y Variables de Entorno

Las API keys están en `backend/.env` (NO subir a git, ya está en .gitignore):

```
DEEPGRAM_API_KEY=...
OPENAI_API_KEY=sk-proj-...
DEEPGRAM_MODEL=nova-3
LLM_MODEL=gpt-4o-mini
```

---

## Tareas Pendientes (Orden de Implementación)

### Fase 1: Backend Base
- [ ] `app/core/config.py` - Cargar configuración del .env
- [ ] `app/schemas/historia_clinica.py` - Modelo Pydantic completo
- [ ] `app/services/deepgram_service.py` - Cliente Deepgram
- [ ] `app/services/extraccion_service.py` - Cliente OpenAI con Structured Outputs
- [ ] `app/routes/consulta.py` - Endpoint POST /api/consulta/procesar
- [ ] `app/main.py` - FastAPI app con CORS

### Fase 2: Frontend Base
- [ ] Layout con Sidebar estilo Volki
- [ ] Dashboard principal
- [ ] Lista de clientes/pacientes
- [ ] Página de nueva consulta con wizard

### Fase 3: Integración
- [ ] AudioRecorder.jsx con MediaRecorder API
- [ ] Componentes de los 4 pasos del wizard
- [ ] Conexión con backend (axios o fetch)
- [ ] Manejo de errores y loading states

### Fase 4: Pruebas y Métricas
- [ ] Script de testing para medir WER (Word Error Rate)
- [ ] Script de testing para medir F1-Score de extracción
- [ ] Cronómetro automático para comparar tiempos
- [ ] Cuestionario SUS integrado

---

## Métricas Académicas que Debemos Medir

Para validar la tesis, el sistema debe permitir medir:

1. **WER (Word Error Rate)** - Precisión de transcripción
2. **F1-Score** - Precisión de extracción de campos
3. **Tiempo de documentación** - Manual vs Automático
4. **Tasa de edición** - % de campos modificados por el vet
5. **SUS Score** - Puntuación de usabilidad (escala 0-100)
6. **TAM** - Modelo de aceptación tecnológica

---

## Limitaciones Conocidas

1. **Ruido ambiental:** Ladridos, maullidos, equipos pueden afectar la transcripción
2. **Modismos locales:** Jerga peruana veterinaria puede no estar en el dataset base
3. **Hardware:** Usamos micrófonos integrados (no de grado médico)
4. **Sistema legado:** No tenemos acceso al código fuente de Volki, solo replicamos
5. **Tamaño de muestra:** 169 historias clínicas (limitado a Los Pinos)

---

## Buenas Prácticas para el Desarrollo

1. **Hacer commits frecuentes** con mensajes descriptivos en español
2. **Probar cada servicio individualmente** antes de integrar
3. **Siempre validar datos del LLM** antes de mostrarlos al usuario
4. **Logs detallados** para poder medir tiempos y errores
5. **Manejar errores explícitamente** - nunca fallar en silencio
6. **Documentar decisiones** que se salgan de lo planeado

---

## Comandos Útiles

### Backend
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload  # Inicia servidor con auto-reload
pytest                          # Corre tests
```

### Frontend
```bash
cd frontend
npm run dev      # Inicia servidor de desarrollo
npm run build    # Build para producción
```
