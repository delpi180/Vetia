import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import ConsultaPage from './pages/ConsultaPage'
import ClientesPage from './pages/ClientesPage'
import PacientesPage from './pages/PacientesPage'
import HistoriasPage from './pages/HistoriasPage'
import AjustesPage from './pages/AjustesPage'
import MetricasPage from './pages/MetricasPage'
import PacientePerfilPage from './pages/PacientePerfilPage'
import ClientePerfilPage from './pages/ClientePerfilPage'
import CitasPage from './pages/CitasPage'

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="flex h-screen overflow-hidden bg-slate-50">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/"          element={<Dashboard />} />
              <Route path="/consulta"  element={<ConsultaPage />} />
              <Route path="/clientes"  element={<ClientesPage />} />
              <Route path="/clientes/:id" element={<ClientePerfilPage />} />
              <Route path="/pacientes" element={<PacientesPage />} />
              <Route path="/pacientes/:id" element={<PacientePerfilPage />} />
              <Route path="/historias" element={<HistoriasPage />} />
              <Route path="/citas"     element={<CitasPage />} />
              <Route path="/metricas"  element={<MetricasPage />} />
              <Route path="/ajustes"   element={<AjustesPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ToastProvider>
  )
}
