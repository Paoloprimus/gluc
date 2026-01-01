-- Script per aggiornare i token esistenti con codici a 6 caratteri
-- ATTENZIONE: Esegui questo DOPO aver identificato il token admin

-- Visualizza tutti i token attuali (per identificare l'admin)
SELECT id, token, grants_role, used, used_by FROM invite_tokens;

-- ISTRUZIONI:
-- 1. Esegui la query sopra
-- 2. Identifica l'ID del token admin che NON vuoi cambiare
-- 3. Sostituisci 'ID_TOKEN_ADMIN' nella query sotto con l'ID reale
-- 4. Esegui la query di UPDATE

-- Genera nuovi token casuali per tutti tranne l'admin
-- (Esegui questa query UNA VOLTA per ogni token da aggiornare)

-- Esempio: se hai 3 token da aggiornare (non admin), esegui 3 volte:

/*
UPDATE invite_tokens 
SET token = (
  SELECT string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*', 
           floor(random() * 62 + 1)::int, 1), ''
  )
  FROM generate_series(1, 6)
)
WHERE id = 'ID_DEL_TOKEN_DA_AGGIORNARE'
AND id != 'ID_TOKEN_ADMIN';
*/

-- OPPURE aggiorna TUTTI i token tranne admin in un colpo solo:
-- (cambia 'ID_TOKEN_ADMIN' con l'ID reale del tuo token admin)

/*
DO $$
DECLARE
    token_record RECORD;
    new_token TEXT;
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
BEGIN
    FOR token_record IN 
        SELECT id FROM invite_tokens 
        WHERE id != 'ID_TOKEN_ADMIN' -- Sostituisci con ID reale
    LOOP
        new_token := '';
        FOR i IN 1..6 LOOP
            new_token := new_token || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        
        UPDATE invite_tokens SET token = new_token WHERE id = token_record.id;
    END LOOP;
END $$;
*/

-- Dopo l'esecuzione, verifica i nuovi token:
-- SELECT id, token, grants_role, used FROM invite_tokens;

