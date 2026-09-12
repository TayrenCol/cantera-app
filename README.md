# Cantera App — Arquitectura de Software y Manual de Operaciones

Sistema SaaS multi-tenant para la gestión integral de escuelas deportivas, automatización de expedientes digitales, seguimiento documental y administración de pagos recurrentes.

* **Repositorio Oficial:** [https://github.com/TayrenCol/cantera-app](https://github.com/TayrenCol/cantera-app)
* **Entorno de Ejecución:** Node.js (v22.x LTS) + Express sobre Hostinger Business Web Hosting.
* **Base de Datos:** MySQL (Gestión mediante phpMyAdmin y conexión `mysql2`).

---

## 1. Visión General de la Arquitectura de Despliegue

El proyecto cuenta con dos entornos totalmente aislados en Hostinger para garantizar la estabilidad del código en producción y evitar la contaminación de datos reales durante el desarrollo.

```text
===========================================================================
                      REPOSITORIO CENTRAL EN GITHUB                        
               https://github.com/TayrenCol/cantera-app                    
===========================================================================
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
            [ Rama: dev ]                       [ Rama: main ]
                  │                                   │
                  ▼                                   ▼
  ┌──────────────────────────────┐    ┌──────────────────────────────┐
  │     ENTORNO DE PRUEBAS       │    │    ENTORNO DE PRODUCCIÓN     │
  ├──────────────────────────────┤    ├──────────────────────────────┤
  │ URL Temporal:                │    │ URL Temporal:                │
  │ ghostwhite-swallow-...       │    │ violet-termite-...           │
  │                              │    │                              │
  │ Base de Datos:               │    │ Base de Datos:               │
  │ u448206008_cantera_dev       │    │ u448206008_cantera_prod      │
  │                              │    │                              │
  │ Variable de Entorno:         │    │ Variable de Entorno:         │
  │ NODE_ENV = development       │    │ NODE_ENV = production        │
  └──────────────────────────────┘    └──────────────────────────────┘
```

### Tabla de Entornos

| Entorno | URL Temporal | Rama Git | Base de Datos MySQL | Flag `NODE_ENV` |
| :--- | :--- | :--- | :--- | :--- |
| **Producción** | `violet-termite-484823.hostingersite.com` | `main` | `u448206008_cantera_prod` | `production` |
| **Pruebas (DEV)** | `ghostwhite-swallow-284933.hostingersite.com` | `dev` | `u448206008_cantera_dev` | `development` |

---

## 2. Límites y Recursos del Hosting (Hostinger Business)

* **Almacenamiento:** 50 GB compartidos.
* **Procesamiento:** 2 Núcleos CPU / 3072 MB RAM.
* **Límites de Procesos:** 120 procesos máximos concurrentes / 60 PHP Workers.
* **Bases de Datos:** MySQL nativo. Límite máximo de 3 GB por base de datos.
* **Puerto del Servidor:** Asignación dinámica mediante `process.env.PORT || 3000`.

---

## 3. Flujo de Trabajo para Desarrolladores (Lean Git Flow)

Para evitar sobrescribir el trabajo de otros integrantes o introducir fallos en producción, sigue este procedimiento:

### Paso 1: Clonar y Preparar el Proyecto
```bash
git clone [https://github.com/TayrenCol/cantera-app.git]
cd cantera-app
npm install
cp .env.example .env
```

### Paso 2: Crear una Rama de Trabajo
Nunca hagas commits directos en dev ni en main. Crea siempre una rama secundaria basada en dev:
```bash
git checkout dev
git pull origin dev
git checkout -b feature/nombre-de-la-funcionalidad
# o para correcciones:
git checkout -b fix/nombre-del-error
```

### Paso 3: Confirmar Cambios y Subir a GitHub
```bash
git add .
git commit -m "feat: descripción breve del cambio realizado"
git push origin feature/nombre-de-la-funcionalidad
```

### Paso 4: Despliegue a Pruebas (Pull Request -> dev)
1. Ve al repositorio en GitHub y abre un Pull Request (PR) hacia la rama dev.
2. Solicita la revisión de código (Code Review) a un compañero.
3. Al aprobar el merge en dev, Hostinger compilará y actualizará el servidor de pruebas (ghostwhite-swallow-284933.hostingersite.com) de forma automática.  

### Paso 5: Despliegue a Producción (Pull Request -> main)

1. Una vez probada la función en la web de pruebas, crea un Pull Request de dev hacia main.
2. Al fusionar en main, el servidor de producción (violet-termite-484823.hostingersite.com) actualizará la aplicación automáticamente.

## 4. Módulo de Conexión a Base de Datos (src/config/db.js)
La app utiliza un Pool de Conexiones de mysql2/promise para optimizar el rendimiento y reutilizar recursos en Hostinger.
```JavaScript
import mysql from 'mysql2/promise';

// Crear el Pool reutilizable leyendo las variables de entorno inyectadas por hPanel
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default db;
```

## Reglas de Seguridad SQL (Prevención de Inyección SQL)
Utiliza siempre consultas preparadas (db.execute)
```JavaScript
import db from '../config/db.js';

// [X]  PROHIBIDO (Concatenación directa):
// const [rows] = await db.query(`SELECT * FROM users WHERE email = '${email}'`);

// [OK] OBLIGATORIO (Consulta preparada):
export const getUserByEmail = async (email) => {
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};
```

## 5. Reglas de Oro del Proyecto
1. Protección de main: Nadie realiza git push directo a main. Todo código en producción proviene de un PR revisado desde dev.
2. Cero Credenciales en Código: Las contraseñas, claves y usuarios de MySQL se configuran mediante variables de entorno en Hostinger (hPanel > Deployments > Environment Variables) y en el archivo local .env (el cual está excluido en .gitignore).
3. Control de Paquetes (package-lock.json): Commitea siempre el archivo package-lock.json para garantizar versiones consistentes en Hostinger.  
4. Endpoint de Salud (/health): Mantener activo un endpoint para verificación de estado del backend sin exponer datos sensibles.