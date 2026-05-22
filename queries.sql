-- =============================================
-- MOTOCLUBES — QUERIES ÚTILES
-- =============================================

-- USUARIOS ACTIVOS HOY
SELECT 
  p.nickname, u.email,
  COUNT(pv.id) as paginas_vistas,
  MIN(pv.created_at) as primera_visita,
  MAX(pv.created_at) as ultima_visita,
  ROUND(EXTRACT(EPOCH FROM (MAX(pv.created_at) - MIN(pv.created_at))) / 60, 1) as minutos_en_app
FROM page_views pv
JOIN profiles p ON p.id = pv.user_id
JOIN auth.users u ON u.id = pv.user_id
WHERE pv.created_at >= CURRENT_DATE
GROUP BY p.id, p.nickname, u.email
ORDER BY paginas_vistas DESC;

-- =============================================

-- REPORTE HOY + AYER + ESTA SEMANA
SELECT 
  'HOY' as periodo, p.nickname, u.email,
  COUNT(pv.id) as paginas_vistas,
  ROUND(EXTRACT(EPOCH FROM (MAX(pv.created_at) - MIN(pv.created_at))) / 60, 1) as minutos_en_app
FROM page_views pv
JOIN profiles p ON p.id = pv.user_id
JOIN auth.users u ON u.id = pv.user_id
WHERE pv.created_at >= CURRENT_DATE
GROUP BY p.id, p.nickname, u.email
UNION ALL
SELECT 'AYER', p.nickname, u.email, COUNT(pv.id),
  ROUND(EXTRACT(EPOCH FROM (MAX(pv.created_at) - MIN(pv.created_at))) / 60, 1)
FROM page_views pv
JOIN profiles p ON p.id = pv.user_id
JOIN auth.users u ON u.id = pv.user_id
WHERE pv.created_at >= CURRENT_DATE - INTERVAL '1 day' AND pv.created_at < CURRENT_DATE
GROUP BY p.id, p.nickname, u.email
UNION ALL
SELECT 'ESTA SEMANA', p.nickname, u.email, COUNT(pv.id),
  ROUND(EXTRACT(EPOCH FROM (MAX(pv.created_at) - MIN(pv.created_at))) / 60, 1)
FROM page_views pv
JOIN profiles p ON p.id = pv.user_id
JOIN auth.users u ON u.id = pv.user_id
WHERE pv.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.id, p.nickname, u.email
ORDER BY periodo, paginas_vistas DESC;

-- =============================================

-- RUTAS DE UN USUARIO HOY
-- Cambiar 'Rapazdoorgal' por el nickname que quieras
SELECT r.title, r.created_at, r.km, r.is_public, r.is_planned,
  CASE WHEN r.gpx IS NOT NULL THEN 'GPX importado' ELSE 'Creada en app' END as tipo
FROM routes r
JOIN profiles p ON p.id = r.user_id
WHERE p.nickname = 'Rapazdoorgal'
  AND r.created_at >= CURRENT_DATE
ORDER BY r.created_at DESC;

-- =============================================

-- NUEVOS REGISTROS POR FECHA
SELECT p.nickname, u.email, p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.created_at >= '2026-05-01'
ORDER BY p.created_at DESC;

-- =============================================

-- EMAILS ENVIADOS HOY
SELECT template_name, recipient_email, status, created_at
FROM email_send_log
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC;
