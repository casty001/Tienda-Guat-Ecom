import random
from datetime import datetime, timedelta

nombres = [
    "Valentina", "Daniela", "Camila", "Mariana", "Isabella",
    "Sebastián", "Santiago", "Mateo", "Andrés", "Felipe",
    "Juliana", "Natalia", "Alejandra", "Paola", "Laura",
]

apellidos = [
    "García", "Rodríguez", "Martínez", "López", "González",
    "Pérez", "Sánchez", "Ramírez", "Torres", "Herrera",
]

ciudades = [
    "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena",
    "Bucaramanga", "Pereira", "Manizales", "Ibagué", "Cúcuta",
]

textos = [
    "Llegó antes de lo esperado y en perfecto estado.",
    "Muy buen producto, me gustó bastante.",
    "La calidad superó mis expectativas.",
    "Me llegó bien empacado y funciona muy bien.",
    "Volvería a comprar sin dudarlo.",
    "El producto es tal cual como en las fotos.",
    "Buena atención y entrega rápida.",
    "Muy buena relación calidad-precio.",
]

def puntuacion():
    rand = random.random()

    if rand < 0.92:
        return 5

    return 4

def fecha_aleatoria():
    hoy = datetime.now()
    dias_atras = random.randint(5, 185)
    fecha = hoy - timedelta(days=dias_atras)

    return fecha.strftime("%Y-%m-%d")

def generar_resenas(cantidad=8):
    usados = set()
    resenas = []

    while len(resenas) < cantidad:
        nombre = random.choice(nombres)
        apellido = random.choice(apellidos)
        clave = f"{nombre}-{apellido}"

        if clave in usados:
            continue

        usados.add(clave)

        resenas.append({
            "nombre": f"{nombre} {apellido}",
            "ciudad": random.choice(ciudades),
            "resena": random.choice(textos),
            "puntuacion": puntuacion(),
            "fecha": fecha_aleatoria(),
            "verificado": True,
        })

    return resenas