from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Cliente
from app.schemas.cliente import ClienteCrear, ClienteActualizar, ClienteRespuesta

router = APIRouter(prefix="/api/clientes", tags=["clientes"])


@router.post("", response_model=ClienteRespuesta, status_code=201)
def crear_cliente(datos: ClienteCrear, db: Session = Depends(get_db)):
    if datos.dni:
        existente = db.query(Cliente).filter_by(dni=datos.dni).first()
        if existente:
            raise HTTPException(status_code=409, detail="Ya existe un cliente con ese DNI")
    cliente = Cliente(**datos.model_dump())
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    return cliente


@router.get("", response_model=list[ClienteRespuesta])
def listar_clientes(q: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Cliente)
    if q:
        termino = q.strip()
        if termino.isdigit():
            query = query.filter(Cliente.dni.contains(termino))
        else:
            query = query.filter(Cliente.nombre.ilike(f"%{termino}%"))
    return query.order_by(Cliente.nombre).all()


@router.get("/buscar-dni/{dni}", response_model=ClienteRespuesta)
def buscar_por_dni(dni: str, db: Session = Depends(get_db)):
    cliente = db.query(Cliente).filter_by(dni=dni).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.get("/{cliente_id}", response_model=ClienteRespuesta)
def obtener_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.put("/{cliente_id}", response_model=ClienteRespuesta)
def actualizar_cliente(cliente_id: int, datos: ClienteActualizar, db: Session = Depends(get_db)):
    cliente = db.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    if datos.dni and datos.dni != cliente.dni:
        existente = db.query(Cliente).filter_by(dni=datos.dni).first()
        if existente:
            raise HTTPException(status_code=409, detail="Ya existe un cliente con ese DNI")
    cambios = datos.model_dump(exclude_unset=True)
    for campo, valor in cambios.items():
        setattr(cliente, campo, valor)
    db.commit()
    db.refresh(cliente)
    return cliente


@router.delete("/{cliente_id}", status_code=204)
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(cliente)
    db.commit()
