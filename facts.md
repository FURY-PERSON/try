You are a professional fact-checker and content creator for a quiz app "Fact Front".                                                                                            
                                                                                                                                                                                  
  Generate 10000 statements (approximately 5000 facts and 5000 fakes) as a JSON array. Each statement must be bilingual (Russian + English).                                         
                                                                                                                                                                                  
  ## OUTPUT FORMAT

  Respond with ONLY a valid JSON array. No markdown, no code blocks. Each element:

  {
    "statement": "Утверждение на русском",
    "statementEn": "Statement in English",
    "isTrue": true | false,
    "explanation": "Пояснение на русском",
    "explanationEn": "Explanation in English",
    "source": "Название источника на русском",
    "sourceEn": "Source name in English",
    "sourceUrl": "https://...",
    "sourceUrlEn": "https://... (English version of source, if available)",
    "difficulty": 1-5,
    "categorySlug": "one of: science, history, geography, nature, technology, culture, sports, health, space, food"
  }

  ## CRITICAL RULES

  ### 1. CLARITY AND UNAMBIGUITY
  - Every statement must have ONE clear, unambiguous answer — either definitively true or definitively false.
  - NEVER use approximate values that could be argued either way.
    BAD: "Марафонская дистанция — 42 км" (actual is 42.195 km — user will be frustrated)
    BAD: "Эверест — самая высокая гора (8848 м)" (the exact height is debated)
    GOOD: "Марафонская дистанция составляет более 42 километров" (unambiguously true)
  - Avoid "trick" statements that try to catch users on technicalities.
    BAD: "Плутон был лишён статуса планеты из-за его размеров" (misleading — it was due to multiple criteria)
    GOOD: "Плутон официально классифицируется как карликовая планета с 2006 года"

  ### 2. EXPLANATIONS
  - Explanations must be accessible. If the statement uses specialized terms, FIRST explain the term, THEN explain the fact.
    EXAMPLE: Statement: "Тональные языки составляют большинство языков мира"
    Explanation: "Тональные языки — это языки, в которых изменение высоты тона меняет значение слова (например, китайский, вьетнамский). По оценкам лингвистов, около 60-70%
  языков мира являются тональными, включая большинство языков Африки и Юго-Восточной Азии. Источник: World Atlas of Language Structures."
  - Explanations: 2-4 sentences, educational, engaging.
  - For FAKES: explain the common misconception and provide the correct information.
  - For FACTS: explain why this is surprising or interesting, with context.

  ### 3. SOURCES (CRITICAL)
  - Every statement MUST have a real, verifiable source.
  - Preferred sources: Wikipedia, scientific journals (Nature, Science, The Lancet), NASA, WHO, UNESCO, Britannica, Guinness World Records, reputable universities, government
  agencies.
  - sourceUrl must be a REAL, working URL to the specific article/page. Do NOT fabricate URLs.
  - If you cannot provide a specific URL, use the main domain (e.g., "https://www.who.int") and describe the specific report/page in the source field.
  - sourceUrlEn should point to the English version of the source when available.

  ### 4. DIFFICULTY DISTRIBUTION
  Generate approximately:
  - Difficulty 1 (20%): Common knowledge, debunking everyday myths. Almost everyone can answer.
  - Difficulty 2 (25%): Interesting facts that surprise, easy to understand.
  - Difficulty 3 (30%): Requires general knowledge, moderately challenging.
  - Difficulty 4 (15%): Requires domain knowledge, challenging but explanation is simple.
  - Difficulty 5 (10%): Expert level, very surprising, but explanation remains accessible.

  ### 5. CATEGORY DISTRIBUTION
  Distribute roughly evenly across these categories (≈100 per category):
  - science (Наука / Science)
  - history (История / History)
  - geography (География / Geography)
  - nature (Природа / Nature)
  - technology (Технологии / Technology)
  - culture (Культура / Culture)
  - sports (Спорт / Sports)
  - health (Здоровье / Health)
  - space (Космос / Space)
  - food (Еда / Food)

  ### 6. QUALITY CHECKLIST
  For each statement, verify:
  - [ ] The answer is unambiguous (no "well, technically...")
  - [ ] The explanation would satisfy a curious person
  - [ ] The source is real and the URL exists
  - [ ] The statement is interesting enough that someone would want to share it
  - [ ] Both Russian and English versions convey the same meaning
  - [ ] The fake sounds plausible (not obviously absurd)
  - [ ] The fact is genuinely true (not outdated or disputed)
  - [ ] No trick questions or gotchas

  ### 7. VARIETY
  - Cover diverse topics within each category.
  - Avoid clustering similar facts together.
  - Mix well-known topics with obscure but fascinating ones.
  - Include facts from different cultures, time periods, and regions of the world.

  ## EXAMPLES OF GOOD STATEMENTS

  ### Good Fact:
  {
    "statement": "Осьминоги имеют три сердца",
    "statementEn": "Octopuses have three hearts",
    "isTrue": true,
    "explanation": "У осьминогов действительно три сердца: одно главное (системное) перекачивает кровь по всему телу, а два жаберных сердца проталкивают кровь через жабры для
  насыщения кислородом. Интересно, что главное сердце перестаёт биться, когда осьминог плывёт, поэтому они предпочитают ползать.",
    "explanationEn": "Octopuses indeed have three hearts: one systemic heart pumps blood through the body, while two branchial hearts push blood through the gills for
  oxygenation. Interestingly, the systemic heart stops beating when the octopus swims, which is why they prefer crawling.",
    "source": "Smithsonian Ocean",
    "sourceEn": "Smithsonian Ocean",
    "sourceUrl": "https://ocean.si.edu/ocean-life/invertebrates/octopuses",
    "sourceUrlEn": "https://ocean.si.edu/ocean-life/invertebrates/octopuses",
    "difficulty": 1,
    "categorySlug": "nature"
  }

  ### Good Fake:
  {
    "statement": "Великая Китайская стена видна из космоса невооружённым глазом",
    "statementEn": "The Great Wall of China is visible from space with the naked eye",
    "isTrue": false,
    "explanation": "Это один из самых распространённых мифов. Великая Китайская стена имеет ширину всего 5-8 метров, что делает её невидимой с орбиты невооружённым глазом. Это
  подтвердил китайский космонавт Ян Ливэй после своего полёта в 2003 году, а также астронавты NASA неоднократно опровергали этот миф.",
    "explanationEn": "This is one of the most common myths. The Great Wall of China is only 5-8 meters wide, making it invisible from orbit with the naked eye. This was confirmed
   by Chinese astronaut Yang Liwei after his 2003 flight, and NASA astronauts have repeatedly debunked this myth.",
    "source": "NASA",
    "sourceEn": "NASA",
    "sourceUrl": "https://www.nasa.gov/vision/space/workinginspace/great_wall.html",
    "sourceUrlEn": "https://www.nasa.gov/vision/space/workinginspace/great_wall.html",
    "difficulty": 1,
    "categorySlug": "geography"
  }

  Generate all 1000 statements now. Respond with ONLY the JSON array.

  ---
  Рекомендации по использованию:

  1. 1000 за раз не получится — ни одна модель не сгенерирует 1000 штук в одном запросе. Разбейте на батчи по 50-100 штук, указывая категорию и смещая difficulty:
  Generate 100 statements for category "science" ...
  Generate 100 statements for category "history" ...
  2. Постобработка — после генерации нужно будет заменить categorySlug на реальные categoryId из вашей БД и добавить поля status: "moderation" и language: "ru".
  3. Верификация URL — обязательно прогоните скриптом проверку sourceUrl / sourceUrlEn на доступность, т.к. модели часто галлюцинируют URL.
  4. Для импорта в БД финальный JSON-элемент должен выглядеть так (маппинг на вашу Prisma-схему):
  {
    "statement": "...",
    "statementEn": "...",
    "isTrue": true,
    "explanation": "...",
    "explanationEn": "...",
    "source": "...",
    "sourceEn": "...",
    "sourceUrl": "https://...",
    "sourceUrlEn": "https://...",
    "difficulty": 3,
    "categoryId": "<real category ID from DB>",
    "status": "moderation",
    "language": "ru"
  }