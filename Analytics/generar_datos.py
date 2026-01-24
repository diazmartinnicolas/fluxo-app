from asyncio.windows_events import NULL
import pandas as pd
import uuid
import random
from faker import Faker
from datetime import datetime, timedelta

fake = Faker('es_AR')

# --- CONFIGURACIÓN ---
# ID DEMO en tabla 'companies' supabase
COMPANY_ID = "17ea9272-bf9d-406d-bca3-01fc75d08032" 
NUM_PEDIDOS = 100

# 1. PRODUCTOS MOCK (Asegúrate de que estos existan en tu tabla 'products' o cámbialos)
# El script generará datos basados en estos IDs.
productos_db = [
    {"id": "76af6a89-c4e9-431e-97dc-cc01d319be1f", "name": "Napolitana (Demo)", "price": 9500, "category": "Pizzas"},
    {"id": "7ee18737-29e8-49a7-ae05-e7f3a39235dc", "name": "Muzzarella (Demo)", "price": 8000, "category": "Pizzas"},
    {"id": "030a4e11-ffeb-4db0-b4f7-ade3186d7c71", "name": "Cerveza Lager (Demo)", "price": 3500, "category": "Bebidas"},
    {"id": "a6f732bb-fafa-4d59-be16-7ba5f3b606c0", "name": "Hamburguesa Completa (Demo)", "price": 6500, "category": "Hamburguesas"}
]

clientes = []
for _ in range(20):
    # Generamos una fecha de creación para el cliente (por ejemplo, hace entre 60 y 120 días)
    fecha_registro_cliente = fake.date_time_between(start_date='-120d', end_date='-60d')
    
    clientes.append({
        "id": str(uuid.uuid4()),
        "name": fake.name(),
        "phone": fake.phone_number(),
        "address": fake.address(),
        "created_at": fecha_registro_cliente,
        "user_id": None,
        "company_id": COMPANY_ID,
        "is_active": True,
        "deleted_at": None,
        "birth_date": None
    })

# 3. GENERAR PEDIDOS (Orders) y DETALLES (Order Items)
pedidos = []
detalles = []

for _ in range(NUM_PEDIDOS):
    order_id = str(uuid.uuid4())
    cliente = random.choice(clientes)
    
    # Lógica de fechas: últimos 30 días
    fecha = fake.date_time_between(start_date='-30d', end_date='now')
    
    total_pedido = 0
    cantidad_items = random.randint(1, 3)
    
    for _ in range(cantidad_items):
        prod = random.choice(productos_db)
        cant = random.randint(1, 2)
        subtotal = prod['price'] * cant
        total_pedido += subtotal
        
        detalles.append({
            "id": str(uuid.uuid4()),
            "order_id": order_id,
            "product_id": prod['id'],
            "quantity": cant,
            "price_at_moment": prod['price'],
            "company_id": COMPANY_ID
        })
    
    pedidos.append({
        "id": order_id,
        "client_id": cliente['id'],
        "total": total_pedido,
        "status": "completado",
        "payment_type": random.choice(["Efectivo", "Transferencia", "Tarjeta"]),
        "user_id": None,
        "created_at": fecha,
        "company_id": COMPANY_ID,
        "deleted_at": None
    })

# Convertir a DataFrames
df_clients = pd.DataFrame(clientes)
df_orders = pd.DataFrame(pedidos)
df_items = pd.DataFrame(detalles)

# Guardar archivos
df_clients.to_csv("datos_clientes.csv", index=False)
df_orders.to_csv("datos_pedidos.csv", index=False)
df_items.to_csv("datos_detalles.csv", index=False)

print(f"Se han generado {NUM_PEDIDOS} pedidos y sus detalles con éxito.")