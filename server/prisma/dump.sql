-- ============================================================
-- Reference data dump for Fact Front
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING)
-- Usage: psql -U factfront factfront < server/prisma/dump.sql
-- ============================================================

BEGIN;

-- -----------------------------------------------------------
-- Categories (10 records)
-- -----------------------------------------------------------
INSERT INTO "Category" (id, name, "nameEn", slug, icon, color, "sortOrder", "createdAt")
VALUES
  ('clref0001cat0science00', 'Наука',       'Science',    'science',    '🧪', '#34C759', 1,  NOW()),
  ('clref0002cat0history00', 'История',     'History',    'history',    '📜', '#34C759', 2,  NOW()),
  ('clref0003cat0geograph0', 'География',   'Geography',  'geography',  '🌍', '#34C759', 3,  NOW()),
  ('clref0004cat0language0', 'Языки',       'Languages',  'languages',  '📖', '#34C759', 4,  NOW()),
  ('clref0005cat0nature000', 'Природа',     'Nature',     'nature',     '🌿', '#34C759', 5,  NOW()),
  ('clref0006cat0space0000', 'Космос',      'Space',      'space',      '🚀', '#34C759', 6,  NOW()),
  ('clref0007cat0culture00', 'Культура',    'Culture',    'culture',    '🎨', '#34C759', 7,  NOW()),
  ('clref0008cat0technolog', 'Технологии',  'Technology', 'technology', '💻', '#34C759', 8,  NOW()),
  ('clref0009cat0sport0000', 'Спорт',       'Sport',      'sport',      '🏆', '#FF9500', 9,  NOW()),
  ('clref0010cat0health000', 'Здоровье',    'Health',     'health',     '🏥', '#FF2D55', 10, NOW())
ON CONFLICT (slug) DO NOTHING;

-- -----------------------------------------------------------
-- Nickname Adjectives (20 records)
-- -----------------------------------------------------------
INSERT INTO nickname_adjectives (id, "textRu", "textEn", "isActive", "createdAt", "updatedAt")
VALUES
  ('a0000001-0001-4000-8000-000000000001', 'Быстрый',   'Swift',     true, NOW(), NOW()),
  ('a0000001-0002-4000-8000-000000000002', 'Храбрый',   'Brave',     true, NOW(), NOW()),
  ('a0000001-0003-4000-8000-000000000003', 'Мудрый',    'Wise',      true, NOW(), NOW()),
  ('a0000001-0004-4000-8000-000000000004', 'Хитрый',    'Cunning',   true, NOW(), NOW()),
  ('a0000001-0005-4000-8000-000000000005', 'Весёлый',   'Cheerful',  true, NOW(), NOW()),
  ('a0000001-0006-4000-8000-000000000006', 'Тихий',     'Quiet',     true, NOW(), NOW()),
  ('a0000001-0007-4000-8000-000000000007', 'Яркий',     'Bright',    true, NOW(), NOW()),
  ('a0000001-0008-4000-8000-000000000008', 'Ловкий',    'Agile',     true, NOW(), NOW()),
  ('a0000001-0009-4000-8000-000000000009', 'Дерзкий',   'Bold',      true, NOW(), NOW()),
  ('a0000001-0010-4000-8000-000000000010', 'Сонный',    'Sleepy',    true, NOW(), NOW()),
  ('a0000001-0011-4000-8000-000000000011', 'Гордый',    'Proud',     true, NOW(), NOW()),
  ('a0000001-0012-4000-8000-000000000012', 'Шустрый',   'Nimble',    true, NOW(), NOW()),
  ('a0000001-0013-4000-8000-000000000013', 'Дикий',     'Wild',      true, NOW(), NOW()),
  ('a0000001-0014-4000-8000-000000000014', 'Ночной',    'Nocturnal', true, NOW(), NOW()),
  ('a0000001-0015-4000-8000-000000000015', 'Полярный',  'Polar',     true, NOW(), NOW()),
  ('a0000001-0016-4000-8000-000000000016', 'Огненный',  'Fiery',     true, NOW(), NOW()),
  ('a0000001-0017-4000-8000-000000000017', 'Звёздный',  'Stellar',   true, NOW(), NOW()),
  ('a0000001-0018-4000-8000-000000000018', 'Тайный',    'Secret',    true, NOW(), NOW()),
  ('a0000001-0019-4000-8000-000000000019', 'Лунный',    'Lunar',     true, NOW(), NOW()),
  ('a0000001-0020-4000-8000-000000000020', 'Грозный',   'Mighty',    true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------
-- Nickname Animals (20 records)
-- -----------------------------------------------------------
INSERT INTO nickname_animals (id, "textRu", "textEn", emoji, "isActive", "createdAt", "updatedAt")
VALUES
  ('b0000002-0001-4000-8000-000000000001', 'Лис',       'Fox',       '🦊', true, NOW(), NOW()),
  ('b0000002-0002-4000-8000-000000000002', 'Волк',      'Wolf',      '🐺', true, NOW(), NOW()),
  ('b0000002-0003-4000-8000-000000000003', 'Медведь',   'Bear',      '🐻', true, NOW(), NOW()),
  ('b0000002-0004-4000-8000-000000000004', 'Сова',      'Owl',       '🦉', true, NOW(), NOW()),
  ('b0000002-0005-4000-8000-000000000005', 'Орёл',      'Eagle',     '🦅', true, NOW(), NOW()),
  ('b0000002-0006-4000-8000-000000000006', 'Тигр',      'Tiger',     '🐯', true, NOW(), NOW()),
  ('b0000002-0007-4000-8000-000000000007', 'Лев',       'Lion',      '🦁', true, NOW(), NOW()),
  ('b0000002-0008-4000-8000-000000000008', 'Панда',     'Panda',     '🐼', true, NOW(), NOW()),
  ('b0000002-0009-4000-8000-000000000009', 'Кот',       'Cat',       '🐱', true, NOW(), NOW()),
  ('b0000002-0010-4000-8000-000000000010', 'Пёс',       'Dog',       '🐶', true, NOW(), NOW()),
  ('b0000002-0011-4000-8000-000000000011', 'Дельфин',   'Dolphin',   '🐬', true, NOW(), NOW()),
  ('b0000002-0012-4000-8000-000000000012', 'Пингвин',   'Penguin',   '🐧', true, NOW(), NOW()),
  ('b0000002-0013-4000-8000-000000000013', 'Коала',     'Koala',     '🐨', true, NOW(), NOW()),
  ('b0000002-0014-4000-8000-000000000014', 'Единорог',  'Unicorn',   '🦄', true, NOW(), NOW()),
  ('b0000002-0015-4000-8000-000000000015', 'Дракон',    'Dragon',    '🐉', true, NOW(), NOW()),
  ('b0000002-0016-4000-8000-000000000016', 'Кролик',    'Rabbit',    '🐰', true, NOW(), NOW()),
  ('b0000002-0017-4000-8000-000000000017', 'Ёж',        'Hedgehog',  '🦔', true, NOW(), NOW()),
  ('b0000002-0018-4000-8000-000000000018', 'Хамелеон',  'Chameleon', '🦎', true, NOW(), NOW()),
  ('b0000002-0019-4000-8000-000000000019', 'Фламинго',  'Flamingo',  '🦩', true, NOW(), NOW()),
  ('b0000002-0020-4000-8000-000000000020', 'Осьминог',  'Octopus',   '🐙', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------
-- Avatar Emojis (32 records)
-- -----------------------------------------------------------
INSERT INTO avatar_emojis (id, emoji, category, "isActive", "createdAt", "updatedAt")
VALUES
  -- Animals (20)
  ('c0000003-0001-4000-8000-000000000001', '🦊', 'animals', true, NOW(), NOW()),
  ('c0000003-0002-4000-8000-000000000002', '🐱', 'animals', true, NOW(), NOW()),
  ('c0000003-0003-4000-8000-000000000003', '🦉', 'animals', true, NOW(), NOW()),
  ('c0000003-0004-4000-8000-000000000004', '🐺', 'animals', true, NOW(), NOW()),
  ('c0000003-0005-4000-8000-000000000005', '🐻', 'animals', true, NOW(), NOW()),
  ('c0000003-0006-4000-8000-000000000006', '🦅', 'animals', true, NOW(), NOW()),
  ('c0000003-0007-4000-8000-000000000007', '🐼', 'animals', true, NOW(), NOW()),
  ('c0000003-0008-4000-8000-000000000008', '🐯', 'animals', true, NOW(), NOW()),
  ('c0000003-0009-4000-8000-000000000009', '🐬', 'animals', true, NOW(), NOW()),
  ('c0000003-0010-4000-8000-000000000010', '🐧', 'animals', true, NOW(), NOW()),
  ('c0000003-0011-4000-8000-000000000011', '🦎', 'animals', true, NOW(), NOW()),
  ('c0000003-0012-4000-8000-000000000012', '🦄', 'animals', true, NOW(), NOW()),
  ('c0000003-0013-4000-8000-000000000013', '🐉', 'animals', true, NOW(), NOW()),
  ('c0000003-0014-4000-8000-000000000014', '🦔', 'animals', true, NOW(), NOW()),
  ('c0000003-0015-4000-8000-000000000015', '🦁', 'animals', true, NOW(), NOW()),
  ('c0000003-0016-4000-8000-000000000016', '🐰', 'animals', true, NOW(), NOW()),
  ('c0000003-0017-4000-8000-000000000017', '🦒', 'animals', true, NOW(), NOW()),
  ('c0000003-0018-4000-8000-000000000018', '🐙', 'animals', true, NOW(), NOW()),
  ('c0000003-0019-4000-8000-000000000019', '🦩', 'animals', true, NOW(), NOW()),
  ('c0000003-0020-4000-8000-000000000020', '🐨', 'animals', true, NOW(), NOW()),
  -- Faces (8)
  ('c0000003-0021-4000-8000-000000000021', '😎', 'faces', true, NOW(), NOW()),
  ('c0000003-0022-4000-8000-000000000022', '🤓', 'faces', true, NOW(), NOW()),
  ('c0000003-0023-4000-8000-000000000023', '🧐', 'faces', true, NOW(), NOW()),
  ('c0000003-0024-4000-8000-000000000024', '😈', 'faces', true, NOW(), NOW()),
  ('c0000003-0025-4000-8000-000000000025', '👻', 'faces', true, NOW(), NOW()),
  ('c0000003-0026-4000-8000-000000000026', '🤖', 'faces', true, NOW(), NOW()),
  ('c0000003-0027-4000-8000-000000000027', '👽', 'faces', true, NOW(), NOW()),
  ('c0000003-0028-4000-8000-000000000028', '🎃', 'faces', true, NOW(), NOW()),
  -- Nature (6)
  ('c0000003-0029-4000-8000-000000000029', '🌸', 'nature', true, NOW(), NOW()),
  ('c0000003-0030-4000-8000-000000000030', '🔥', 'nature', true, NOW(), NOW()),
  ('c0000003-0031-4000-8000-000000000031', '⭐', 'nature', true, NOW(), NOW()),
  ('c0000003-0032-4000-8000-000000000032', '🌈', 'nature', true, NOW(), NOW()),
  ('c0000003-0033-4000-8000-000000000033', '❄️', 'nature', true, NOW(), NOW()),
  ('c0000003-0034-4000-8000-000000000034', '🌊', 'nature', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------
-- Feature Flags
-- -----------------------------------------------------------
INSERT INTO feature_flags (id, key, name, description, "isEnabled", payload, "createdAt", "updatedAt")
VALUES
  ('clref0001flag0showads0', 'show_ads',              'Показ рекламы',                    'Глобальное управление показом рекламы в приложении (legacy)',              true,  NULL, NOW(), NOW()),
  ('clref0002flag0maintena', 'maintenance_mode',       'Режим обслуживания',               'Показывает заглушку вместо контента во время технических работ',           false, NULL, NOW(), NOW()),
  ('clref0003flag0adsenable', 'ads_enable',            'Реклама (глобальный)',              'Глобальное включение/отключение всей рекламы',                            true,  NULL, NOW(), NOW()),
  ('clref0005flag0unityads',  'unity_ads',             'Unity Ads',                        'Включить рекламу Unity для остальных стран',                              true,  NULL, NOW(), NOW()),
  ('clref0006flag0banhome',   'ad_banner_home',        'Баннер: Главная',                  'Баннер внизу главного экрана',                                            true,  NULL, NOW(), NOW()),
  ('clref0007flag0banlead',   'ad_banner_leaderboard', 'Баннер: Рейтинг',                  'Баннер внизу экрана рейтинга',                                            true,  NULL, NOW(), NOW()),
  ('clref0008flag0banprof',   'ad_banner_profile',     'Баннер: Профиль',                  'Баннер внизу экрана профиля',                                             true,  NULL, NOW(), NOW()),
  ('clref0009flag0bancat',    'ad_banner_category',    'Баннер: Категория',                'Баннер на экране информации о категории',                                 true,  NULL, NOW(), NOW()),
  ('clref0010flag0bangame',   'ad_banner_game',        'Баннер: Игра',                     'Баннер внизу экрана игры',                                                true,  NULL, NOW(), NOW()),
  ('clref0011flag0banres',    'ad_banner_results',     'Баннер: Результаты',               'Баннер на экране завершения игры',                                        true,  NULL, NOW(), NOW()),
  ('clref0012flag0intgame',   'ad_interstitial_game',  'Полноэкранная реклама',            'Полноэкранная реклама перед началом игры',                                true,  '{"factsThreshold": 24, "yandex_factsThreshold": 24, "unity_factsThreshold": 39}', NOW(), NOW()),
  ('clref0013flag0rewvideo',  'ad_rewarded_video',     'Видео реклама (отключение рекламы)','Видео для отключения рекламы',                                            true,  '{"adFreeMinutes": 25, "requiredViews": 2, "yandex_requiredViews": 2, "unity_requiredViews": 1}', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

COMMIT;
