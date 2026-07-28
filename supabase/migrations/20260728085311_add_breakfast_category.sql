-- Add a new "Breakfast" menu category.
-- Reuses the existing categories table and the existing icon system
-- (MenuPage ICON_MAP already includes 'Sandwich').
INSERT INTO categories (name, slug, icon, sort_order)
VALUES ('Breakfast', 'breakfast', 'Sandwich', 4)
ON CONFLICT (slug) DO NOTHING;
