# 📋 Documento de Requerimientos: Cantera App (MVP)

**Proyecto:** Sistema de Gestión Multi-tenant para Academias Deportivas  
**Tecnologías:** Node.js (v22.x LTS) + Express, MySQL 8.0, React / Tailwind CSS  
**Infraestructura:** Hostinger Web Apps + Lean Git Flow (GitHub)  

---

## 1. Visión General del Producto (MVP)

Cantera App es un SaaS diseñado para automatizar la gestión administrativa, el control de cartera (pago de mensualidades e inscripciones) y el expediente digital de documentación de los jugadores de escuelas deportivas.

---

## 2. Requerimientos Funcionales (RF)

### **Módulo 1: Gestión de Jugadores y Categorización**
* **RF-01 (Registro de Jugadores):** El sistema debe permitir registrar y administrar la información de los jugadores (125 alumnos actuales distribuidos en 9 categorías).
* **RF-02 (Asignación Automática de Categorías):** Al ingresar el año de nacimiento del jugador, el sistema debe asignarlo automáticamente a su categoría correspondiente:
  1. Categoría 2022-2023 (9 alumnos)
  2. Categoría 2021 (12 alumnos)
  3. Categoría 2020 (12 alumnos)
  4. Categoría 2019 (13 alumnos)
  5. Categoría 2017-2018 B (15 alumnos)
  6. Categoría 2017-2018 A (15 alumnos)
  7. Categoría 2016 (18 alumnos)
  8. Categoría 2015 (15 alumnos)
  9. Categoría 2013-2014 (14 alumnos)
* **RF-03 (Ficha del Acudiente):** Almacenar los datos de contacto del acudiente principal (nombre, cédula, teléfono del papá/mamá).

### **Módulo 2: Control Financiero y Alertas de Cartera**
* **RF-04 (Estructura Tarifaria Automatizada):**
  * **Categorías 2022-2023:** Mensualidad: **$80.000** | Inscripción: **$190.000**.
  * **Categorías 2021 a 2013-2014:** Mensualidad: **$110.000** | Inscripción: **$300.000**.
* **RF-05 (Registro de Cobros):** Permitir relacionar de forma rápida al jugador con el pago recibido (Inscripción o Mensualidad específica de cada mes).
* **RF-06 (Motor de Alertas de Mora):** El sistema debe marcar automáticamente un cobro en estado **Pendiente / Vencido** si el pago no se registra tras el **primer fin de semana de cada mes**.
* **RF-07 (Dashboard Consolidado):** Presentar métricas en tiempo real:
  * Total de alumnos registrados y activos.
  * Ingresos generados en el mes actual.
  * Cantidad de pagos pendientes.
  * Alertas de estudiantes con más de 5 días de retraso en mensualidad.

### **Módulo 3: Expediente Digital de Documentación**
* **RF-08 (Control de Documentos Personales):** Trazabilidad de estado (*Pendiente*, *Cargado*, *Verificado*) para:
    1. Registro civil o Tarjeta de identidad.
    2. Certificado de afiliación a la EPS.
    3. Cédula de ciudadanía del acudiente principal.
* **RF-09 (Control de Documentos Normativos del Club):** Trazabilidad de estado para:

    4. Hoja de vida del jugador.
    5. Compromiso de vinculación.
    6. Cesión de derechos de imagen.
* **RF-10 (Navegación e Indicador de Expediente Incompleto):** Redirección directa desde el perfil del jugador o la relación de pago hacia su expediente documental, mostrando una alerta o badge visual si le hace falta al menos 1 documento.

---

## 3. Requerimientos No Funcionales (RNF)

* **RNF-01 (Modelo Relacional Normalizado - 3FN):**
  * La base de datos MySQL debe implementarse bajo la Tercera Forma Normal (3FN), separando las entidades `players`, `categories`, `payments` y `documents`.
  * **Prohibición de Diseño:** No se permite crear tablas dinámicas por año (ej: `jugadores_2026`) ni columnas fijas por meses (`ene`, `feb`, `mar`), para evitar la reestructuración periódica del código.
* **RNF-02 (Seguridad y Prevención de Inyección SQL):**
  * Uso obligatorio del pool de conexiones `mysql2/promise` (`src/config/db.js`).
  * Toda interacción con la base de datos debe realizarse con consultas preparadas (`db.execute`).
* **RNF-03 (Aislamiento de Entornos y Gestión de Secretos):**
  * Separación total de entornos en Hostinger:
    * **Pruebas (DEV):** `ghostwhite-swallow-284933.hostingersite.com` (DB: `u448206008_cantera_dev`).
    * **Producción:** `violet-termite-484823.hostingersite.com` (DB: `u448206008_cantera_prod`).
  * Inyección estricta de credenciales mediante variables de entorno (`.env` local y hPanel Deployments en servidor).
* **RNF-04 (Control de Versiones y Lean Git Flow):**
  * Adherencia obligatoria a la convención de ramas:
    * Desarrollo individual en ramas `feature/` o `fix/`.
    * Integración previa en `pre_dev` y `dev`.
    * Despliegue a producción exclusivo mediante Pull Request hacia `main`.
* **RNF-05 (Rendimiento):**
  * Optimización para el entorno de hosting compartido (máximo 120 procesos concurrentes y 3 GB por base de datos).