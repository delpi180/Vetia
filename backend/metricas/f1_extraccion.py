"""
Cálculo de F1-Score para evaluar la precisión de extracción de campos clínicos.

Uso:
    py metricas/f1_extraccion.py

Compara el JSON extraído automáticamente por GPT-4o-mini contra anotaciones
manuales (ground truth). Mide precisión, recall y F1 por campo y global.

F1 = 2 × (P × R) / (P + R)
P  = verdaderos_positivos / (VP + FP)   — de lo que extrajo, ¿qué % era correcto?
R  = verdaderos_positivos / (VP + FN)   — de lo que había, ¿qué % capturó?

Un campo se considera CORRECTO si:
  - Campos de texto: similitud de tokens >= umbral (por defecto 0.8)
  - Campos numéricos: diferencia absoluta <= tolerancia (por defecto 0.5)
  - Campos enum: coincidencia exacta (normalizada)
  - Listas: comparación elemento a elemento con similitud de tokens
"""

import re
import unicodedata
from typing import Any


UMBRAL_SIMILITUD = 0.8
TOLERANCIA_NUMERICA = 0.5


def normalizar_texto(texto: str) -> set[str]:
    texto = texto.lower()
    texto = unicodedata.normalize("NFD", texto)
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    texto = re.sub(r"[^a-z0-9\s]", " ", texto)
    return set(texto.split())


def similitud_tokens(a: str, b: str) -> float:
    """Jaccard sobre conjuntos de tokens normalizados."""
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    sa, sb = normalizar_texto(str(a)), normalizar_texto(str(b))
    interseccion = len(sa & sb)
    union = len(sa | sb)
    return interseccion / union if union else 0.0


def campo_correcto(pred: Any, gt: Any) -> bool:
    """Determina si un campo extraído es correcto respecto al ground truth."""
    if pred is None and gt is None:
        return True
    if pred is None or gt is None:
        return False
    if isinstance(gt, (int, float)):
        try:
            return abs(float(pred) - float(gt)) <= TOLERANCIA_NUMERICA
        except (TypeError, ValueError):
            return False
    if isinstance(gt, list):
        if not isinstance(pred, list) or len(pred) != len(gt):
            return False
        return all(similitud_tokens(str(p), str(g)) >= UMBRAL_SIMILITUD for p, g in zip(pred, gt))
    return similitud_tokens(str(pred), str(gt)) >= UMBRAL_SIMILITUD


def aplanar(obj: Any, prefijo: str = "") -> dict:
    """Aplana un dict/lista anidado a un dict de clave_punto: valor."""
    resultado = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            nueva_clave = f"{prefijo}.{k}" if prefijo else k
            resultado.update(aplanar(v, nueva_clave))
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            resultado.update(aplanar(item, f"{prefijo}[{i}]"))
    else:
        resultado[prefijo] = obj
    return resultado


def calcular_f1(prediccion: dict, ground_truth: dict) -> dict:
    """
    Calcula precisión, recall y F1 comparando dos historias clínicas aplanadas.
    Ignora campos con valor None/null en el ground truth (no anotados).
    """
    pred_flat = aplanar(prediccion)
    gt_flat = aplanar(ground_truth)

    # Solo evaluamos campos presentes en el ground truth (con valor no nulo)
    campos_gt = {k: v for k, v in gt_flat.items() if v is not None}

    vp = 0  # campo presente en GT y extraído correctamente
    fp = 0  # campo extraído pero incorrecto o no en GT
    fn = 0  # campo en GT pero no extraído o incorrecto

    detalle = {}
    for campo, valor_gt in campos_gt.items():
        valor_pred = pred_flat.get(campo)
        correcto = campo_correcto(valor_pred, valor_gt)
        detalle[campo] = {
            "gt": valor_gt,
            "pred": valor_pred,
            "correcto": correcto,
        }
        if correcto:
            vp += 1
        else:
            fn += 1

    # FP: campos extraídos que NO están en el ground truth
    for campo in pred_flat:
        if campo not in campos_gt and pred_flat[campo] is not None:
            fp += 1

    precision = vp / (vp + fp) if (vp + fp) > 0 else 0.0
    recall = vp / (vp + fn) if (vp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

    return {
        "vp": vp, "fp": fp, "fn": fn,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "detalle": detalle,
    }


# ---------------------------------------------------------------------------
# CASOS DE PRUEBA — reemplaza con tus datos reales
# ---------------------------------------------------------------------------
CASOS_PRUEBA = [
    {
        "id": "caso_01",
        "ground_truth": {
            "anamnesis": {
                "motivo_consulta": "fiebre y vómitos",
                "tiempo_evolucion": "2 días",
                "antecedentes": None,
            },
            "examen_objetivo_general": {
                "temperatura_c": 39.5,
                "peso_kg": 12.0,
                "mucosas": "rosadas",
            },
            "diagnostico": {
                "presuntivo": "gastroenteritis aguda",
            },
        },
        "prediccion": {
            "anamnesis": {
                "motivo_consulta": "fiebre y vómitos desde hace dos días",
                "tiempo_evolucion": "2 días",
                "antecedentes": None,
            },
            "examen_objetivo_general": {
                "temperatura_c": 39.5,
                "peso_kg": 12.0,
                "mucosas": "rosadas húmedas",
            },
            "diagnostico": {
                "presuntivo": "gastroenteritis aguda",
            },
        },
    },
]


if __name__ == "__main__":
    print(f"{'Caso':<12} {'VP':>4} {'FP':>4} {'FN':>4} {'P':>7} {'R':>7} {'F1':>7}")
    print("-" * 55)
    total = {"vp": 0, "fp": 0, "fn": 0, "p_sum": 0.0, "r_sum": 0.0, "f1_sum": 0.0}
    for caso in CASOS_PRUEBA:
        r = calcular_f1(caso["prediccion"], caso["ground_truth"])
        print(f"{caso['id']:<12} {r['vp']:>4} {r['fp']:>4} {r['fn']:>4} "
              f"{r['precision']:>7.4f} {r['recall']:>7.4f} {r['f1']:>7.4f}")
        total["vp"] += r["vp"]; total["fp"] += r["fp"]; total["fn"] += r["fn"]
        total["f1_sum"] += r["f1"]

        # Detalle de errores
        errores = [(k, v) for k, v in r["detalle"].items() if not v["correcto"]]
        if errores:
            for campo, info in errores:
                print(f"  INCORRECTO {campo}: GT={info['gt']!r}  PRED={info['pred']!r}")

    n = len(CASOS_PRUEBA)
    vp_t, fp_t, fn_t = total["vp"], total["fp"], total["fn"]
    p_micro = vp_t / (vp_t + fp_t) if (vp_t + fp_t) else 0
    r_micro = vp_t / (vp_t + fn_t) if (vp_t + fn_t) else 0
    f1_micro = 2 * p_micro * r_micro / (p_micro + r_micro) if (p_micro + r_micro) else 0
    f1_macro = total["f1_sum"] / n if n else 0

    print("-" * 55)
    print(f"{'MICRO':<12} {vp_t:>4} {fp_t:>4} {fn_t:>4} {p_micro:>7.4f} {r_micro:>7.4f} {f1_micro:>7.4f}")
    print(f"F1 macro (promedio por caso): {f1_macro:.4f}")
    print(f"\nF1 micro global: {f1_micro:.2%}")
    if f1_micro >= 0.90:
        print("Calificacion: Excelente (>=90%)")
    elif f1_micro >= 0.75:
        print("Calificacion: Bueno (>=75%)")
    elif f1_micro >= 0.60:
        print("Calificacion: Aceptable (>=60%)")
    else:
        print("Calificacion: Necesita mejora (<60%)")
