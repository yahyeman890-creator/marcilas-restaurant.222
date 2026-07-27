-- ============================================================
-- REPLACE MENU: New delivery-only menu for Marcilas Food Hub
-- Removes all old categories & foods (coffee, tea, drinks, etc.)
-- and replaces with the new delivery-friendly menu.
-- Order history is preserved: order_items.food_id has ON DELETE
-- SET NULL, and food_name/price are snapshotted per order.
-- ============================================================

-- 1. Delete all existing foods (order_items.food_id -> SET NULL)
DELETE FROM foods;

-- 2. Delete all existing categories
DELETE FROM categories;

-- 3. Insert new categories
-- (Keep "popular" slug out — MenuPage already filters it separately)
INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Ethiopian Mains', 'ethiopian', 'Flame', 1),
  ('Fast Food', 'fast-food', 'Pizza', 2),
  ('Desserts', 'desserts', 'IceCream', 3);

-- 4. Insert new food items (all prices in ETB)
INSERT INTO foods (category_id, name, description, price, image_url, rating, is_available)
VALUES
  -- === Ethiopian Mains ===
  (
    (SELECT id FROM categories WHERE slug = 'ethiopian'),
    'Special Beef Tibs',
    'Sizzling marinated beef cubes with onions & jalapeños served with fresh Injera',
    650,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Mutton_tibs_and_injera.jpg/960px-Mutton_tibs_and_injera.jpg',
    4.8,
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'ethiopian'),
    'Doro Wat Deluxe',
    'Traditional spiced chicken stew with hard-boiled egg & Injera',
    750,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/A_formal_serving_of_wat_atop_injera_in_Brussels%2C_Belgium.jpg/960px-A_formal_serving_of_wat_atop_injera_in_Brussels%2C_Belgium.jpg',
    4.9,
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'ethiopian'),
    'Kitfo Special',
    'Minced prime beef, spiced niter kibbeh, mitmita, served with Ayib cheese',
    700,
    'https://upload.wikimedia.org/wikipedia/commons/e/e0/Kitfo_Ethiopian_Food.JPG',
    4.7,
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'ethiopian'),
    'Beyaynetu / Fasting Platter',
    'Assorted spiced lentils, yellow peas, greens, and salad on Injera',
    500,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Ethiopian_fasting_platter.jpg/960px-Ethiopian_fasting_platter.jpg',
    4.6,
    true
  ),
  -- === Fast Food & International ===
  (
    (SELECT id FROM categories WHERE slug = 'fast-food'),
    'Marcilas Special Brick-Oven Pizza',
    'Freshly baked wood-fire pizza with melted mozzarella & toppings',
    580,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Vegetarian_Pizza.jpg/960px-Vegetarian_Pizza.jpg',
    4.7,
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'fast-food'),
    'Grilled Chicken Breast & Wedges',
    'Herb-marinated chicken breast with garlic potato wedges',
    680,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Masala_Grilled_Chicken_with_Baby_Potatoes%2C_Salad.JPG/960px-Masala_Grilled_Chicken_with_Baby_Potatoes%2C_Salad.JPG',
    4.6,
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'fast-food'),
    'Classic Beef Burger & Crispy Fries',
    'Prime beef patty, melted cheese, lettuce, tomato on brioche bun',
    550,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Cheeseburger_and_Fries_2.jpg/960px-Cheeseburger_and_Fries_2.jpg',
    4.5,
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'fast-food'),
    'Creamy Fettuccine Alfredo',
    'Pasta in rich garlic cream sauce with parmesan',
    520,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Chicken_fettuccine_alfredo.JPG/960px-Chicken_fettuccine_alfredo.JPG',
    4.4,
    true
  ),
  -- === Desserts & Chilled Treats ===
  (
    (SELECT id FROM categories WHERE slug = 'desserts'),
    'New York Style Cheesecake',
    'Creamy cheesecake topped with berry compote',
    380,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Plain_New_York-style_cheesecake.JPG/960px-Plain_New_York-style_cheesecake.JPG',
    4.7,
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'desserts'),
    'Fresh Fruit Bowl',
    'Sliced seasonal mango, papaya, pineapple, and watermelon',
    300,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Fruit_Salad_4.jpg/960px-Fruit_Salad_4.jpg',
    4.5,
    true
  ),
  (
    (SELECT id FROM categories WHERE slug = 'desserts'),
    'Chocolate Lava Cake',
    'Rich chocolate molten cake',
    420,
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Fondant_au_Chocolat_1.jpg/960px-Fondant_au_Chocolat_1.jpg',
    4.8,
    true
  );
