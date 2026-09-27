-- Indices para las consultas del dashboard.
-- Ejecutar una sola vez en la base de datos de phpMyAdmin.

CREATE INDEX idx_jugadores_estado ON jugadores (estado_inscripcion);
CREATE INDEX idx_uniformes_anio_jugador ON uniformes_jugadores (anio, jugador_id);
CREATE INDEX idx_mensualidades_periodo_estado
  ON mensualidades (anio, mes, estado_pago);
CREATE INDEX idx_mensualidades_periodo_fecha
  ON mensualidades (anio, mes, fecha_pago, id);
