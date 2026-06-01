"""
Cálculo de WER (Word Error Rate) para evaluar la precisión de transcripción.

Uso:
    py metricas/wer.py

El script compara la transcripción generada por Deepgram contra un texto de
referencia manual. Modifica la lista CASOS_PRUEBA con tus propios pares.

WER = (S + D + I) / N
  S = sustituciones, D = eliminaciones, I = inserciones, N = palabras en referencia
Rango: 0.0 (perfecto) → 1.0+ (muy impreciso). <0.10 es excelente.
"""

import re
import unicodedata


def normalizar(texto: str) -> list[str]:
    """Convierte a minúsculas, elimina acentos y puntuación, divide en tokens."""
    texto = texto.lower()
    texto = unicodedata.normalize("NFD", texto)
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    texto = re.sub(r"[^a-z0-9\s]", " ", texto)
    return texto.split()


def calcular_wer(referencia: str, hipotesis: str) -> dict:
    """
    Calcula WER usando programación dinámica (distancia de edición).
    Devuelve dict con wer, sustituciones, eliminaciones, inserciones, n_palabras.
    """
    ref = normalizar(referencia)
    hip = normalizar(hipotesis)

    n = len(ref)
    m = len(hip)

    if n == 0:
        return {"wer": 0.0, "S": 0, "D": 0, "I": m, "N": 0}

    # Matriz de distancia de edición
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = i
    for j in range(m + 1):
        dp[0][j] = j

    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if ref[i - 1] == hip[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(
                    dp[i - 1][j - 1],  # sustitución
                    dp[i - 1][j],      # eliminación
                    dp[i][j - 1],      # inserción
                )

    # Backtrack para contar operaciones
    S = D = I = 0
    i, j = n, m
    while i > 0 or j > 0:
        if i > 0 and j > 0 and ref[i - 1] == hip[j - 1]:
            i -= 1; j -= 1
        elif i > 0 and j > 0 and dp[i][j] == dp[i - 1][j - 1] + 1:
            S += 1; i -= 1; j -= 1
        elif i > 0 and dp[i][j] == dp[i - 1][j] + 1:
            D += 1; i -= 1
        else:
            I += 1; j -= 1

    wer = (S + D + I) / n
    return {"wer": round(wer, 4), "S": S, "D": D, "I": I, "N": n}


# ---------------------------------------------------------------------------
# CASOS DE PRUEBA — reemplaza con tus transcripciones reales
# ---------------------------------------------------------------------------
CASOS_PRUEBA = [
    {
        "id": "caso_01",
        "referencia": "El paciente es un golden retriever de tres años con fiebre y vómitos desde hace dos días",
        "hipotesis": "El paciente es un golden retriever de tres años con fiebre y vómitos desde hace dos días",
    },
    {
        "id": "caso_02",
        "referencia": "Temperatura treinta y nueve punto cinco peso doce kilogramos mucosas rosadas",
        "hipotesis": "temperatura treinta nueve punto cinco peso doce kilogramos mucosas rosadas",
    },
]


if __name__ == "__main__":
    print(f"{'Caso':<12} {'WER':>6} {'S':>4} {'D':>4} {'I':>4} {'N':>5}")
    print("-" * 40)
    total_s = total_d = total_i = total_n = 0
    for caso in CASOS_PRUEBA:
        r = calcular_wer(caso["referencia"], caso["hipotesis"])
        print(f"{caso['id']:<12} {r['wer']:>6.4f} {r['S']:>4} {r['D']:>4} {r['I']:>4} {r['N']:>5}")
        total_s += r["S"]; total_d += r["D"]; total_i += r["I"]; total_n += r["N"]

    wer_global = (total_s + total_d + total_i) / total_n if total_n else 0
    print("-" * 40)
    print(f"{'GLOBAL':<12} {wer_global:>6.4f} {total_s:>4} {total_d:>4} {total_i:>4} {total_n:>5}")
    print(f"\nWER global: {wer_global:.2%}")
    if wer_global <= 0.05:
        print("Calificacion: Excelente (<=5%)")
    elif wer_global <= 0.10:
        print("Calificacion: Muy bueno (<=10%)")
    elif wer_global <= 0.20:
        print("Calificacion: Aceptable (<=20%)")
    else:
        print("Calificacion: Necesita mejora (>20%)")
