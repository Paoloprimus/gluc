-- =============================================
-- TEST ARCHIVIAZIONE NOTE - fliqk
-- =============================================
-- Esegui queste query nella console SQL di Supabase
-- (Dashboard → SQL Editor)

-- 1️⃣ TROVA IL TUO USER ID
SELECT id, nickname FROM users WHERE nickname = 'philip';
-- Copia l'id (es: b25c43b7-07a1-45e6-9d94-643872da281b)

-- 2️⃣ CREA UNA NOTA "VECCHIA" (10 giorni fa - mostrerà badge "ex")
INSERT INTO daily_notes (user_id, date, items)
VALUES (
  'b25c43b7-07a1-45e6-9d94-643872da281b',  -- sostituisci con il tuo user_id
  CURRENT_DATE - INTERVAL '10 days',
  '[{"id": "test-1", "text": "Nota vecchia di 10 giorni", "createdAt": "2025-12-27T10:00:00Z"}]'::jsonb
);

-- 3️⃣ CREA UNA NOTA "SCADUTA" (30 giorni fa - verrà archiviata)
INSERT INTO daily_notes (user_id, date, items)
VALUES (
  'b25c43b7-07a1-45e6-9d94-643872da281b',  -- sostituisci con il tuo user_id
  CURRENT_DATE - INTERVAL '30 days',
  '[{"id": "test-2", "text": "Nota scaduta di 30 giorni - DEVE ESSERE ARCHIVIATA", "createdAt": "2025-12-07T10:00:00Z"}]'::jsonb
);

-- 4️⃣ VERIFICA LE NOTE CREATE
SELECT id, date, items, 
       CURRENT_DATE - date as giorni_fa
FROM daily_notes 
WHERE user_id = 'b25c43b7-07a1-45e6-9d94-643872da281b'
ORDER BY date DESC;

-- =============================================
-- ORA VAI NELL'APP E VERIFICA:
-- =============================================
-- 
-- A) Nota di 10 giorni fa → deve mostrare badge "(ex)"
-- B) Nota di 30 giorni fa → NON deve apparire (già oltre 28 giorni)
--    OPPURE deve essere archiviata quando apri la pagina Note
--
-- Per forzare l'archiviazione, clicca su una nota "(ex)" 
-- e poi su "Archivia"

-- =============================================
-- 5️⃣ VERIFICA L'ARCHIVIO (dopo il test)
-- =============================================
SELECT * FROM notes_archive 
WHERE user_id = 'b25c43b7-07a1-45e6-9d94-643872da281b'
ORDER BY archived_at DESC;

-- =============================================
-- 6️⃣ PULIZIA (dopo il test)
-- =============================================
-- Elimina le note di test
DELETE FROM daily_notes 
WHERE user_id = 'b25c43b7-07a1-45e6-9d94-643872da281b'
  AND items::text LIKE '%test-%';

-- Elimina dall'archivio
DELETE FROM notes_archive 
WHERE user_id = 'b25c43b7-07a1-45e6-9d94-643872da281b'
  AND items::text LIKE '%test-%';

-- =============================================
-- TEST POST VECCHI (opzionale)
-- =============================================
-- I post più vecchi di 1 mese non appaiono in home
-- ma restano nel database (non vengono cancellati)

-- Crea un post "vecchio"
INSERT INTO links (user_id, url, title, description, tags, status, created_at)
VALUES (
  'b25c43b7-07a1-45e6-9d94-643872da281b',
  'https://example.com/old',
  'Post vecchio test',
  'Questo post ha 40 giorni',
  ARRAY['test'],
  'sent',
  NOW() - INTERVAL '40 days'
);

-- Verifica: questo post NON dovrebbe apparire nella home
-- (filtra solo ultimo mese)

-- Pulizia post test
DELETE FROM links 
WHERE user_id = 'b25c43b7-07a1-45e6-9d94-643872da281b'
  AND title = 'Post vecchio test';

