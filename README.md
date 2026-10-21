# ProductBook

Herramienta de e-commerce, catálogo y control de inventario de productos y agenda de contactos.
- **Backend:** Python (Flask, SQLAlchemy, JWT, Bcrypt, PyMySQL, Flask-CORS)
- **Frontend:** React 19 + Vite + TailwindCSS
- **Base de datos:** MySQL 8

---

## Módulos Principales

1. **ProductBook (Catálogo):** Vista en tarjetas con fotos, enlace directo al proveedor (al hacer clic en la imagen) y precios.
2. **Inventario de Productos por Nombre:**
   - Búsqueda en tiempo real por nombre de producto.
   - Control de existencias (ajuste rápido de stock `+` / `-`).
   - Métricas y KPIs (total de productos únicos, unidades totales, valoración monetaria total del inventario, alertas de bajo stock y agotados).
   - Filtros de disponibilidad (todos, en stock, bajo stock, agotados) y ordenamiento por nombre (A-Z, Z-A), cantidad y valor.
3. **Agenda:** Libreta de contactos (nombre, teléfono y correo).

---

## Estructura del Proyecto

```text
Productbook/
├── backend/
│   ├── app/
│   │   ├── middleware/        # Manejo de errores globales y autenticación
│   │   ├── models/            # Modelos SQLAlchemy (User, ProductBook, Agenda, Url)
│   │   ├── routes/            # Blueprints de la API (/auth, /productbooks, /agenda, /urls)
│   │   ├── schemas/           # Validaciones de datos de entrada
│   │   └── services/          # Lógica de negocio y consultas DB
│   ├── venv/                  # Entorno virtual de Python
│   ├── .env                   # Variables de entorno (credenciales MySQL, JWT, etc.)
│   ├── requirements.txt       # Dependencias de Python
│   ├── run.py                 # Punto de entrada del backend Flask
│   └── test_api.py            # Suite de pruebas automatizadas
└── frontend/
    ├── src/
    │   ├── components/        # Barra de navegación (NavBar)
    │   ├── context/           # Autenticación global (AuthContext)
    │   ├── hooks/             # Custom hook useProductLink
    │   ├── pages/             # Home, Login, Register, Agenda, ProductBook, Inventario
    │   └── services/          # Cliente Axios (api.js) con interceptores
    └── package.json           # Dependencias y scripts de Vite
```

---

## Cómo Ejecutar la Aplicación

### 1. Iniciar el Backend (Flask)

Abre una terminal (PowerShell o CMD) en la carpeta del backend:

```powershell
cd C:\Users\crazy\OneDrive\Desktop\Productbook\Productbook\backend
```

Activa el entorno virtual:
```powershell
.\venv\Scripts\Activate.ps1
```
*(O si usas Command Prompt / CMD: `venv\Scripts\activate.bat`)*

Ejecuta el servidor:
```powershell
python run.py
```

El servidor backend iniciará en: **`http://localhost:5000`**
> Al iniciar, `run.py` verifica automáticamente que la base de datos `productbook` exista en MySQL y crea las tablas si no están creadas.

---

### 2. Iniciar el Frontend (React + Vite)

Abre una **segunda terminal** en la carpeta del frontend:

```powershell
cd C:\Users\crazy\OneDrive\Desktop\Productbook\Productbook\frontend
```

Ejecuta el servidor de desarrollo:
```powershell
npm run dev
```

El frontend estará disponible en: **`http://localhost:5173`** (o el puerto que indique Vite).

---

### 3. Ejecutar Pruebas Automatizadas del Backend

En la carpeta `backend/` con el venv activo:

```powershell
python -m unittest test_api.py
```
