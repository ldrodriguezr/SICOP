-- Aumenta precision para montos altos provenientes de SICOP/Observatorio
-- Ejecutar despues de 001_initial_schema.sql

ALTER TABLE IF EXISTS licitaciones
  ALTER COLUMN monto_estimado TYPE NUMERIC(25,2);

ALTER TABLE IF EXISTS licitaciones
  ALTER COLUMN monto_adjudicado TYPE NUMERIC(25,2);

ALTER TABLE IF EXISTS historial_precios
  ALTER COLUMN monto_adjudicado TYPE NUMERIC(25,2);

ALTER TABLE IF EXISTS historial_precios
  ALTER COLUMN precio_unitario TYPE NUMERIC(25,2);

ALTER TABLE IF EXISTS alertas_config
  ALTER COLUMN monto_min TYPE NUMERIC(25,2);

ALTER TABLE IF EXISTS alertas_config
  ALTER COLUMN monto_max TYPE NUMERIC(25,2);
