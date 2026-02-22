
-- Rensa befintliga duplikater (behåll äldsta per user_id + name)
DELETE FROM article_categories
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, name) id
  FROM article_categories
  ORDER BY user_id, name, created_at ASC
);

-- Lägg till unik constraint
ALTER TABLE article_categories
ADD CONSTRAINT article_categories_user_id_name_key UNIQUE (user_id, name);
