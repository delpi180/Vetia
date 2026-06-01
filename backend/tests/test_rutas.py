import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Infraestructura
# ---------------------------------------------------------------------------

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"estado": "ok"}


def test_raiz():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["servicio"] == "VetIA API"


# ---------------------------------------------------------------------------
# Consulta / procesar
# ---------------------------------------------------------------------------

def test_procesar_sin_archivo():
    r = client.post("/api/consulta/procesar")
    assert r.status_code == 422


def test_procesar_formato_invalido():
    r = client.post(
        "/api/consulta/procesar",
        files={"audio": ("virus.exe", b"datos", "application/octet-stream")},
    )
    assert r.status_code == 400
    assert "no soportado" in r.json()["detail"]


def test_procesar_audio_vacio():
    r = client.post(
        "/api/consulta/procesar",
        files={"audio": ("consulta.wav", b"", "audio/wav")},
    )
    assert r.status_code == 400
    assert "vacío" in r.json()["detail"]


# ---------------------------------------------------------------------------
# Clientes
# ---------------------------------------------------------------------------

def _crear_cliente(**kwargs):
    datos = {"nombre": "Test Cliente", **kwargs}
    return client.post("/api/clientes", json=datos)


def test_crear_cliente_minimo():
    r = _crear_cliente(nombre="María García")
    assert r.status_code == 201
    body = r.json()
    assert body["nombre"] == "María García"
    assert body["dni"] is None
    assert "id" in body


def test_crear_cliente_con_dni():
    r = _crear_cliente(nombre="Pedro Ríos", dni="87654321")
    assert r.status_code == 201
    assert r.json()["dni"] == "87654321"


def test_dni_invalido_letras():
    r = _crear_cliente(nombre="X", dni="ABCD1234")
    assert r.status_code == 422


def test_dni_invalido_longitud():
    r = _crear_cliente(nombre="X", dni="1234567")   # solo 7 dígitos
    assert r.status_code == 422


def test_dni_duplicado_retorna_409():
    _crear_cliente(nombre="Primero", dni="11112222")
    r = _crear_cliente(nombre="Segundo", dni="11112222")
    assert r.status_code == 409
    assert "DNI" in r.json()["detail"]


def test_buscar_cliente_por_dni():
    _crear_cliente(nombre="Ana Torres", dni="33334444")
    r = client.get("/api/clientes/buscar-dni/33334444")
    assert r.status_code == 200
    assert r.json()["nombre"] == "Ana Torres"


def test_buscar_dni_inexistente():
    r = client.get("/api/clientes/buscar-dni/00000000")
    assert r.status_code == 404


def test_listar_clientes_filtro_nombre():
    _crear_cliente(nombre="Zoila Quispe")
    r = client.get("/api/clientes?q=Zoila")
    assert r.status_code == 200
    nombres = [c["nombre"] for c in r.json()]
    assert any("Zoila" in n for n in nombres)


def test_listar_clientes_filtro_dni():
    _crear_cliente(nombre="Luis Vera", dni="55556666")
    r = client.get("/api/clientes?q=55556666")
    assert r.status_code == 200
    assert any(c["dni"] == "55556666" for c in r.json())


def test_eliminar_cliente():
    r = _crear_cliente(nombre="Temporal")
    cliente_id = r.json()["id"]
    d = client.delete(f"/api/clientes/{cliente_id}")
    assert d.status_code == 204
    assert client.get(f"/api/clientes/{cliente_id}").status_code == 404


# ---------------------------------------------------------------------------
# Pacientes
# ---------------------------------------------------------------------------

@pytest.fixture
def cliente_id():
    r = _crear_cliente(nombre="Propietario Test")
    return r.json()["id"]


def test_crear_paciente(cliente_id):
    r = client.post("/api/pacientes", json={
        "nombre": "Rocky", "especie": "Canino", "cliente_id": cliente_id
    })
    assert r.status_code == 201
    body = r.json()
    assert body["nombre"] == "Rocky"
    assert body["especie"] == "Canino"


def test_listar_pacientes_por_cliente(cliente_id):
    client.post("/api/pacientes", json={"nombre": "Michi", "especie": "Felino", "cliente_id": cliente_id})
    r = client.get(f"/api/pacientes?cliente_id={cliente_id}")
    assert r.status_code == 200
    assert all(p["cliente_id"] == cliente_id for p in r.json())


def test_paciente_cliente_inexistente():
    r = client.post("/api/pacientes", json={"nombre": "X", "especie": "Canino", "cliente_id": 999999})
    assert r.status_code == 404


# ---------------------------------------------------------------------------
# Historias
# ---------------------------------------------------------------------------

@pytest.fixture
def paciente_id(cliente_id):
    r = client.post("/api/pacientes", json={
        "nombre": "Firulais", "especie": "Canino", "cliente_id": cliente_id
    })
    return r.json()["id"]


def _historia_minima(paciente_id):
    return {
        "paciente_id": paciente_id,
        "transcripcion": "Paciente con fiebre.",
        "historia_clinica": {
            "anamnesis": {"motivo_consulta": "Fiebre"},
            "examen_objetivo_general": {},
            "examen_objetivo_particular": {},
            "diagnostico": {"presuntivo": "Síndrome febril"},
            "tratamiento": [],
            "indicaciones_cierre": {},
        },
    }


def test_guardar_historia(paciente_id):
    r = client.post("/api/historias", json=_historia_minima(paciente_id))
    assert r.status_code == 201
    body = r.json()
    assert body["paciente_id"] == paciente_id
    assert body["historia_clinica"]["diagnostico"]["presuntivo"] == "Síndrome febril"


def test_guardar_historia_con_tiempos(paciente_id):
    datos = _historia_minima(paciente_id)
    datos.update({"duracion_transcripcion_ms": 1500.0, "duracion_extraccion_ms": 4000.0, "tiempo_edicion_ms": 30000.0})
    r = client.post("/api/historias", json=datos)
    assert r.status_code == 201
    body = r.json()
    assert body["duracion_transcripcion_ms"] == 1500.0
    assert body["tiempo_edicion_ms"] == 30000.0


def test_guardar_historia_paciente_inexistente():
    datos = _historia_minima(999999)
    r = client.post("/api/historias", json=datos)
    assert r.status_code == 404


def test_listar_historias_por_paciente(paciente_id):
    client.post("/api/historias", json=_historia_minima(paciente_id))
    r = client.get(f"/api/historias?paciente_id={paciente_id}")
    assert r.status_code == 200
    assert all(h["paciente_id"] == paciente_id for h in r.json())


# ---------------------------------------------------------------------------
# Métricas SUS
# ---------------------------------------------------------------------------

@pytest.fixture
def historia_id(paciente_id):
    r = client.post("/api/historias", json=_historia_minima(paciente_id))
    return r.json()["id"]


def test_guardar_sus(historia_id):
    r = client.post("/api/metricas/sus", json={
        "historia_id": historia_id,
        "respuestas": [5, 1, 5, 1, 5, 1, 5, 1, 5, 1],
    })
    assert r.status_code == 201
    body = r.json()
    assert body["puntaje"] == 100.0
    assert body["historia_id"] == historia_id


def test_sus_puntaje_calculo():
    # Todas las respuestas neutras (3) → contribución 0 por item → SUS = 0 × 2.5 = 0...
    # Espera: impares: 3-1=2 × 5 = 10, pares: 5-3=2 × 5 = 10, total = 20 × 2.5 = 50
    r_cli = _crear_cliente(nombre="SUS Test")
    cli_id = r_cli.json()["id"]
    r_pac = client.post("/api/pacientes", json={"nombre": "P", "especie": "Canino", "cliente_id": cli_id})
    pac_id = r_pac.json()["id"]
    r_his = client.post("/api/historias", json=_historia_minima(pac_id))
    his_id = r_his.json()["id"]

    r = client.post("/api/metricas/sus", json={"historia_id": his_id, "respuestas": [3,3,3,3,3,3,3,3,3,3]})
    assert r.status_code == 201
    assert r.json()["puntaje"] == 50.0


def test_sus_duplicado_retorna_409(historia_id):
    respuestas = {"historia_id": historia_id, "respuestas": [4,2,4,2,4,2,4,2,4,2]}
    client.post("/api/metricas/sus", json=respuestas)
    r = client.post("/api/metricas/sus", json=respuestas)
    assert r.status_code == 409


def test_sus_historia_inexistente():
    r = client.post("/api/metricas/sus", json={
        "historia_id": 999999,
        "respuestas": [5,1,5,1,5,1,5,1,5,1],
    })
    assert r.status_code == 404


def test_sus_respuestas_invalidas(historia_id):
    r = client.post("/api/metricas/sus", json={
        "historia_id": historia_id,
        "respuestas": [5,1,5,1,5],   # solo 5 respuestas
    })
    assert r.status_code == 422


def test_resumen_metricas():
    r = client.get("/api/metricas/resumen")
    assert r.status_code == 200
    body = r.json()
    assert "total_consultas" in body
    assert "total_encuestas_sus" in body
    assert "promedio_sus" in body


def test_config_endpoint():
    r = client.get("/api/metricas/config")
    assert r.status_code == 200
    body = r.json()
    assert body["deepgram_model"] == "nova-3"
    assert body["llm_model"] == "gpt-4o-mini"
    assert isinstance(body["formatos_permitidos"], list)
