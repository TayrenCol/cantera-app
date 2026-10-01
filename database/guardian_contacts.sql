-- Ejecutar una sola vez en la base cantera_dev desde phpMyAdmin.
-- Los campos quedan NULL para identificar los registros que requieren completar datos.

ALTER TABLE jugadores
  ADD COLUMN nombre_mama VARCHAR(150) NULL AFTER celular_mama,
  ADD COLUMN nombre_papa VARCHAR(150) NULL AFTER celular_papa;

CREATE INDEX idx_jugadores_contactos
  ON jugadores (nombre_mama, celular_mama, nombre_papa, celular_papa);
