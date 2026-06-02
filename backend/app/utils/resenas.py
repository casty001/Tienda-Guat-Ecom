import random
from datetime import datetime, timedelta

nombres = [
    "Valentina", "Daniela", "Camila", "Mariana", "Isabella",
    "Sebastián", "Santiago", "Mateo", "Andrés", "Felipe",
    "Juliana", "Natalia", "Alejandra", "Paola", "Laura",
    "Ana", "Luis", "Carlos", "Juan", "Pedro",         
    "Maria", "Jose", "Antonio", "Manuel", "Jesus",    
    "Sofia", "Lucia", "Emma", "Martina", "Julia",     
]

apellidos = [
    "García", "Rodríguez", "Martínez", "López", "González",
    "Pérez", "Sánchez", "Ramírez", "Torres", "Herrera",
    "Díaz", "Moreno", "Muñoz", "Rojas", "Jiménez",  
    "Ruiz", "Gomez", "Fernandez", "Morales", "Vasquez",  
]

ciudades = [
    "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena",
    "Bucaramanga", "Pereira", "Manizales", "Ibagué", "Cúcuta",
]

textos_5 = [
    "Llegó antes de lo esperado y en perfecto estado.",
    "Muy buen producto, me gustó bastante.",
    "La calidad superó mis expectativas.",
    "Me llegó bien empacado y funciona muy bien.",
    "Volvería a comprar sin dudarlo.",
    "El producto es tal cual como en las fotos.",
    "Buena atención y entrega rápida.",
    "Muy buena relación calidad-precio.",
    "Excelente producto, lo recomiendo al 100%.",
    "Me encantó, volveré a comprar más.",
]

textos_4 = [
    "Buen producto, aunque la entrega fue un poco lenta.",
    "Cumple con lo que promete.",
    "Bien por el precio.",
    "Funciona correctamente.",
    "Buena compra en general.",
    "Producto decente para su costo.",
    "Me gustó, aunque podría mejorar.",
    "Cumple su función correctamente.",
]

def puntuacion():
    # Distribución: 80% son 5 estrellas, 20% son entre 4.0 y 4.9
    rand = random.random()
    
    if rand < 0.80:  # 80% de 5 estrellas exactas
        return 5.0
    else:  # 20% entre 4.0 y 4.9 (con un decimal)
        return round(random.uniform(4.0, 4.9), 1)

def fecha_aleatoria():
    hoy = datetime.now()
    dias_atras = random.randint(5, 185)
    fecha = hoy - timedelta(days=dias_atras)
    return fecha.strftime("%Y-%m-%d")

def obtener_texto_por_puntuacion(punt):
    if punt >= 4.8:
        return random.choice(textos_5)
    elif punt >= 4.0:
        return random.choice(textos_4)
    else:
        return random.choice(textos_4)  # Nunca pasa, pero por si acaso

def generar_resenas(cantidad=10):
    usados = set()
    resenas = []

    while len(resenas) < cantidad:
        nombre = random.choice(nombres)
        apellido = random.choice(apellidos)
        clave = f"{nombre}-{apellido}"

        if clave in usados:
            continue

        usados.add(clave)
        
        punt = puntuacion()

        resenas.append({
            "nombre": f"{nombre} {apellido}",
            "ciudad": random.choice(ciudades),
            "resena": obtener_texto_por_puntuacion(punt),
            "puntuacion": punt,
            "fecha": fecha_aleatoria(),
            "verificado": True,
        })

    return resenas