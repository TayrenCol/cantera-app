-- Ejecutar una sola vez en cada entorno antes de usar el alta de jugadores,
-- el registro de mensualidades y el checklist documental.
-- Los archivos se guardan en almacenamiento privado; MySQL conserva solo
-- estados y metadatos/referencias. No almacenar contenido binario en estas tablas.

ALTER TABLE jugadores
  ADD COLUMN categoria VARCHAR(30) NULL AFTER anio_nacimiento;

UPDATE jugadores
   SET categoria = CASE
     WHEN anio_nacimiento IN (2022, 2023) THEN '2022-2023'
     WHEN anio_nacimiento = 2021 THEN '2021'
     WHEN anio_nacimiento = 2020 THEN '2020'
     WHEN anio_nacimiento = 2019 THEN '2019'
     WHEN anio_nacimiento = 2016 THEN '2016'
     WHEN anio_nacimiento = 2015 THEN '2015'
     WHEN anio_nacimiento IN (2013, 2014) THEN '2013-2014'
     ELSE categoria
   END
 WHERE categoria IS NULL;

ALTER TABLE mensualidades
  ADD COLUMN monto DECIMAL(10, 2) NULL AFTER estado_pago,
  ADD COLUMN numero_comprobante VARCHAR(100) NULL AFTER monto;

CREATE TABLE documentos_jugadores (
  id INT NOT NULL AUTO_INCREMENT,
  jugador_id INT UNSIGNED NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  estado ENUM('Pendiente', 'Cargado', 'Verificado') NOT NULL DEFAULT 'Pendiente',
  storage_key VARCHAR(512) NULL,
  nombre_archivo VARCHAR(255) NULL,
  mime_type VARCHAR(100) NULL,
  tamano_bytes INT UNSIGNED NULL,
  retener_hasta DATE NULL,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_jugador_documento_version (jugador_id, tipo, version),
  KEY idx_documentos_retenidos (retener_hasta),
  CONSTRAINT fk_documentos_jugador
    FOREIGN KEY (jugador_id) REFERENCES jugadores (id)
    ON DELETE CASCADE
);