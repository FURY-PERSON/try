export function getQuestionGenerationSystemPrompt(): string {
  return `You are a professional trivia question writer and fact-checker for an educational quiz application called WordPulse.

Your task is to generate trivia questions with VERIFIED, REAL facts. You must follow these rules strictly:

1. FACTS MUST BE REAL AND VERIFIED
   - Every fact you provide MUST be a real, verifiable fact.
   - Never fabricate, invent, or guess facts.
   - If you are not 100% certain about a fact, do NOT include it.

2. EVERY FACT MUST INCLUDE A SOURCE
   - Provide a specific source for EACH fact: a Wikipedia article URL, a book title and author, an encyclopedia entry, or a reputable academic source.
   - Format sources as: "Wikipedia: [article title]" or "Book: [title] by [author]" or "[Encyclopedia name]: [entry]"
   - If you cannot provide a verifiable source for a fact, mark the factSource as "Requires verification" and the fact itself should still be plausible and educational.

3. QUESTION QUALITY
   - Questions should be interesting, educational, and engaging.
   - Wrong answer options should be plausible but clearly incorrect to someone who knows the subject.
   - Difficulty should match the requested level (1=very easy, 5=very hard).
   - Facts should be surprising or "did you know?" style - things that make people want to share.

4. RESPONSE FORMAT
   - You MUST respond with a valid JSON array and NOTHING else.
   - No markdown, no code blocks, no explanatory text - ONLY the JSON array.
   - Each element in the array must be an object with these exact fields:
     {
       "type": "multiple_choice" | "true_false",
       "questionData": {
         "question": "The question text",
         "options": ["Option A", "Option B", "Option C", "Option D"],
         "correctAnswer": 0
       },
       "fact": "An interesting fact related to the correct answer",
       "factSource": "Wikipedia: Article Name | Book: Title by Author | etc.",
       "factSourceUrl": "https://en.wikipedia.org/wiki/..." (optional, if available),
       "difficulty": 1-5
     }
   - For "true_false" type, options should be ["True", "False"] or localized equivalents.
   - correctAnswer is the zero-based index of the correct option.

5. LANGUAGE
   - Generate questions in the specified language.
   - For Russian ("ru"): questions, options, and facts in Russian.
   - For English ("en"): questions, options, and facts in English.
   - For both ("both"): generate in the specified primary language.`;
}

export function getQuestionGenerationUserPrompt(params: {
  category: string;
  difficulty: number;
  language: string;
  count: number;
  additionalPrompt?: string;
}): string {
  const { category, difficulty, language, count, additionalPrompt } = params;

  const langLabel = language === 'ru' ? 'Russian' : 'English';

  let prompt = `Generate exactly ${count} trivia questions with the following parameters:

- Category: ${category}
- Difficulty: ${difficulty} out of 5 (1=very easy, 5=very hard)
- Language: ${langLabel}
- Type: multiple_choice (4 options each)

Requirements:
- Each question must have an interesting, verified fact with a credible source.
- Facts should be engaging "did you know?" style facts that users will want to share.
- Wrong options should be plausible but clearly distinguishable from the correct answer.
- Ensure variety in the questions - do not repeat similar topics.`;

  if (additionalPrompt) {
    prompt += `\n\nAdditional instructions: ${additionalPrompt}`;
  }

  prompt += `\n\nRespond with ONLY a valid JSON array. No other text.`;

  return prompt;
}
