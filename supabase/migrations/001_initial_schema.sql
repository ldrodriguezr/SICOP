-- ============================================
-- SICOP Copilot — Schema inicial v1.0
-- Ejecutar en orden en Supabase SQL Editor
-- ============================================

-- TABLA: user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_empresa TEXT,
  cedula_juridica TEXT UNIQUE,
  nombre_contacto TEXT NOT NULL,
  telefono TEXT,
  zona_geografica TEXT,
  categorias_interes TEXT[],
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  plan_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  registrado_sicop BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: licitaciones
CREATE TABLE IF NOT EXISTS licitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_procedimiento TEXT UNIQUE NOT NULL,
  tipo TEXT,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  institucion TEXT NOT NULL,
  fecha_publicacion TIMESTAMPTZ,
  fecha_limite_oferta TIMESTAMPTZ,
  monto_estimado NUMERIC(15,2),
  moneda TEXT DEFAULT 'CRC',
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'adjudicado', 'desierto', 'cancelado')),
  url_sicop TEXT,
  url_cartel TEXT,
  categorias TEXT[],
  codigo_cabie TEXT,
  ganador_cedula TEXT,
  ganador_nombre TEXT,
  monto_adjudicado NUMERIC(15,2),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licitaciones_estado ON licitaciones(estado);
CREATE INDEX IF NOT EXISTS idx_licitaciones_fecha ON licitaciones(fecha_limite_oferta);
CREATE INDEX IF NOT EXISTS idx_licitaciones_institucion ON licitaciones(institucion);
CREATE INDEX IF NOT EXISTS idx_licitaciones_titulo ON licitaciones USING gin(to_tsvector('spanish', titulo));

-- TABLA: analisis_carteles
CREATE TABLE IF NOT EXISTS analisis_carteles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  licitacion_id UUID REFERENCES licitaciones(id),
  texto_original TEXT,
  resumen TEXT NOT NULL,
  requisitos JSONB,
  score_viabilidad INTEGER CHECK (score_viabilidad BETWEEN 0 AND 100),
  documentos_necesarios TEXT[],
  observaciones_ia TEXT,
  tokens_usados INTEGER,
  costo_usd NUMERIC(10,6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: licitaciones_guardadas
CREATE TABLE IF NOT EXISTS licitaciones_guardadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  licitacion_id UUID REFERENCES licitaciones(id) ON DELETE CASCADE,
  estado_usuario TEXT DEFAULT 'seguimiento'
    CHECK (estado_usuario IN ('seguimiento', 'ofertando', 'ganada', 'perdida', 'descartada')),
  notas TEXT,
  documentos_pendientes TEXT[],
  recordatorio_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, licitacion_id)
);

-- TABLA: alertas_config
CREATE TABLE IF NOT EXISTS alertas_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  palabras_clave TEXT[],
  categorias TEXT[],
  instituciones TEXT[],
  monto_min NUMERIC(15,2),
  monto_max NUMERIC(15,2),
  activa BOOLEAN DEFAULT true,
  frecuencia TEXT DEFAULT 'diario' CHECK (frecuencia IN ('inmediato', 'diario', 'semanal')),
  email_activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: consorcio_perfiles
CREATE TABLE IF NOT EXISTS consorcio_perfiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  productos_servicios TEXT[],
  capacidad_mensual_usd NUMERIC(12,2),
  zona_cobertura TEXT[],
  tiene_sicop BOOLEAN DEFAULT false,
  experiencia_licitaciones INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: consorcio_solicitudes
CREATE TABLE IF NOT EXISTS consorcio_solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante_id UUID REFERENCES auth.users(id),
  receptor_id UUID REFERENCES auth.users(id),
  licitacion_id UUID REFERENCES licitaciones(id),
  mensaje TEXT,
  estado TEXT DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'completada')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: consorcio_mensajes
CREATE TABLE IF NOT EXISTS consorcio_mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID REFERENCES consorcio_solicitudes(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mensaje TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consorcio_mensajes_solicitud ON consorcio_mensajes(solicitud_id, created_at);

-- TABLA: notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensaje TEXT,
  data JSONB,
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: historial_precios
CREATE TABLE IF NOT EXISTS historial_precios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_cabie TEXT,
  descripcion_bien TEXT,
  institucion TEXT,
  monto_adjudicado NUMERIC(15,2),
  fecha_adjudicacion DATE,
  proveedor_nombre TEXT,
  cantidad NUMERIC(12,2),
  unidad TEXT,
  precio_unitario NUMERIC(12,4),
  año INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_historial_cabie ON historial_precios(codigo_cabie);
CREATE INDEX IF NOT EXISTS idx_historial_año ON historial_precios(año);
CREATE INDEX IF NOT EXISTS idx_historial_desc ON historial_precios USING gin(to_tsvector('spanish', COALESCE(descripcion_bien, '')));

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analisis_carteles ENABLE ROW LEVEL SECURITY;
ALTER TABLE licitaciones_guardadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE consorcio_perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE consorcio_solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consorcio_mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- user_profiles
CREATE POLICY "Users manage own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- analisis_carteles
CREATE POLICY "Users manage own analyses" ON analisis_carteles
  FOR ALL USING (auth.uid() = user_id);

-- licitaciones_guardadas
CREATE POLICY "Users manage own saved" ON licitaciones_guardadas
  FOR ALL USING (auth.uid() = user_id);

-- alertas_config
CREATE POLICY "Users manage own alerts" ON alertas_config
  FOR ALL USING (auth.uid() = user_id);

-- licitaciones: públicas para SELECT
ALTER TABLE licitaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Licitaciones son publicas" ON licitaciones
  FOR SELECT USING (true);

-- historial_precios: público para SELECT
ALTER TABLE historial_precios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Historial precios publico" ON historial_precios
  FOR SELECT USING (true);

-- consorcio_perfiles: perfiles activos son públicos
CREATE POLICY "Perfiles consorcio publicos" ON consorcio_perfiles
  FOR SELECT USING (activo = true);

CREATE POLICY "Users manage own consorcio profile" ON consorcio_perfiles
  FOR ALL USING (auth.uid() = user_id);

-- consorcio_solicitudes
CREATE POLICY "Users see own solicitudes" ON consorcio_solicitudes
  FOR SELECT USING (auth.uid() = solicitante_id OR auth.uid() = receptor_id);

CREATE POLICY "Users create solicitudes" ON consorcio_solicitudes
  FOR INSERT WITH CHECK (auth.uid() = solicitante_id);

CREATE POLICY "Users update own solicitudes" ON consorcio_solicitudes
  FOR UPDATE USING (auth.uid() = solicitante_id OR auth.uid() = receptor_id);

-- consorcio_mensajes
CREATE POLICY "Users see own consorcio messages" ON consorcio_mensajes
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM consorcio_solicitudes cs
      WHERE cs.id = solicitud_id
        AND (auth.uid() = cs.solicitante_id OR auth.uid() = cs.receptor_id)
    )
  );

CREATE POLICY "Users create own consorcio messages" ON consorcio_mensajes
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1
      FROM consorcio_solicitudes cs
      WHERE cs.id = solicitud_id
        AND (auth.uid() = cs.solicitante_id OR auth.uid() = cs.receptor_id)
    )
  );

CREATE POLICY "Users update read_at own consorcio messages" ON consorcio_mensajes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM consorcio_solicitudes cs
      WHERE cs.id = solicitud_id
        AND (auth.uid() = cs.solicitante_id OR auth.uid() = cs.receptor_id)
    )
  );

-- notificaciones
CREATE POLICY "Users see own notifications" ON notificaciones
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCIÓN: auto-crear user_profile en registro
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, nombre_contacto, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre_contacto', split_part(NEW.email, '@', 1)),
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
