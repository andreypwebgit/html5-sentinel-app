import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Handler, HandlerEvent } from "@netlify/functions";

type Language = 'en' | 'es';
interface CodeFile {
  name: string;
  content: string;
}

const getPrompt = (files: CodeFile[], language: Language): string => {
  const lang_prompt = language === 'es' ? 'español' : 'inglés';

  const codeBlocks = files.map(file => `
---
**File: \`${file.name}\`**
\`\`\`
${file.content}
\`\`\`
---
`).join('\n\n');
  
  return `
You are an expert code reviewer named 'HTML5 Sentinel'. Your sole purpose is to enforce the principles of zero-dependency, high-performance, secure, and SEO-optimized pure HTML5 development. You are bilingual in English and Spanish. Your feedback is direct, actionable, and structured.

Review the following files as a cohesive project. Provide your analysis in structured Markdown format. The entire response MUST be in ${lang_prompt}.

**Files to Review:**
${codeBlocks}

**Review Guidelines (analyze files holistically):**

1.  **Zero-Dependency Rule:** Identify any external CSS or JS frameworks/libraries. Strongly advocate for their removal and replacement with pure HTML5, CSS, and vanilla JavaScript solutions.
2.  **Performance Rule (Target: PageSpeed ≥95):** Analyze for performance bottlenecks. Suggest optimizations for image loading (e.g., \`loading="lazy"\`), asset delivery, DOM size, and render-blocking resources. Be specific.
3.  **SEO Rule:** Evaluate semantic HTML usage (\`<main>\`, \`<article>\`, \`<nav>\`, etc.), metadata (\`<title>\`, \`<meta description>\`), and accessibility attributes (\`alt\` text, ARIA roles). Provide concrete improvements.
4.  **Security Rule:** Check for common vulnerabilities like missing \`rel="noopener noreferrer"\` on external links, lack of a Content Security Policy (CSP) header (and suggest a strict starting point), and insecure form handling.
5.  **AI Compliance (EU AI Act):** If the code seems to use AI, remind the user about transparency obligations under the EU AI Act (Article 50), suggesting clear disclosure to end-users.

**Output Format:**

Structure your response with the following Markdown headings. Use bullet points for lists.

### Overall Score (out of 100)
A single score reflecting overall compliance with the principles.

### ✅ What's Done Well
A bulleted list of positive aspects.

### ⚠️ Areas for Improvement
A detailed, categorized breakdown.

#### 🚀 Performance
- (Feedback item)

#### 🔍 SEO & Accessibility
- (Feedback item)

#### 🛡️ Security
- (Feedback item)

#### 📄 Code Quality & Semantics
- (Feedback item)

### 💡 Strategic AI Suggestions (Optional)
If applicable, suggest how client-side AI could be compliantly and performantly integrated to enhance this specific HTML snippet, without adding heavy dependencies.
`;
};

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { files, language } = JSON.parse(event.body || '{}');

    if (!files || !Array.isArray(files) || files.length === 0 || !language) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing files or language in request body.' }),
      };
    }
    
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set in Netlify.");
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Server configuration error. The API key is missing." }),
        };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const prompt = getPrompt(files, language);

    // 1. Selecciona el modelo
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    // 2. Llama a la API usando el 'model' y el 'prompt'
    const result = await model.generateContent(prompt);
    const response = result.response;
    const reviewText = response.text();

    // 3. Devuelve el texto en el body de la respuesta
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review: reviewText }),
    };

  } catch (error) {
    console.error("Error in Netlify function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `An internal error occurred: ${errorMessage}` }),
    };
  }
};

export { handler };