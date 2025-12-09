import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// ============================================================
// API Key Load Balancer - Round-robin across multiple keys
// ============================================================
let openaiKeyIndex = 0;
let perplexityKeyIndex = 0;

function getOpenAIKey(): string {
  const multiKey = process.env.OPENAI_API_KEYS;
  const singleKey = process.env.OPENAI_API_KEY;
  
  if (multiKey) {
    const keys = multiKey.split(',').map(k => k.trim()).filter(k => k.length > 0);
    if (keys.length === 0) {
      throw new Error('No valid keys found in OPENAI_API_KEYS');
    }
    const key = keys[openaiKeyIndex % keys.length];
    openaiKeyIndex++;
    console.log(`[LoadBalancer] Using OpenAI key ${(openaiKeyIndex % keys.length) + 1} of ${keys.length}`);
    return key;
  }
  
  if (singleKey) {
    return singleKey;
  }
  
  throw new Error('OPENAI_API_KEY or OPENAI_API_KEYS must be set');
}

function getPerplexityKey(): string | null {
  const multiKey = process.env.PERPLEXITY_API_KEYS;
  const singleKey = process.env.PERPLEXITY_API_KEY;
  
  if (multiKey) {
    const keys = multiKey.split(',').map(k => k.trim()).filter(k => k.length > 0);
    if (keys.length === 0) return null;
    const key = keys[perplexityKeyIndex % keys.length];
    perplexityKeyIndex++;
    console.log(`[LoadBalancer] Using Perplexity key ${(perplexityKeyIndex % keys.length) + 1} of ${keys.length}`);
    return key;
  }
  
  return singleKey || null;
}

// Fetch company insights using Perplexity API
async function fetchCompanyInsights(apiKey: string, companyName: string, jobTitle?: string) {
  try {
    const perplexity = new OpenAI({
      apiKey,
      baseURL: 'https://api.perplexity.ai'
    });

    const searchQuery = jobTitle 
      ? `${companyName} ${jobTitle} employee reviews and company culture`
      : `${companyName} employee reviews glassdoor company culture work environment`;

    const response = await perplexity.chat.completions.create({
      model: 'sonar',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that provides company insights and employee reviews. 
You must return ONLY a valid JSON object with no markdown formatting or code blocks.
Search for recent employee reviews and company information.`
        },
        {
          role: 'user',
          content: `Search for employee reviews and company information about "${companyName}"${jobTitle ? ` for the role of "${jobTitle}"` : ''}.

Return a JSON object with this exact structure:
{
  "companyName": "${companyName}",
  "companyRating": <number 1-5 based on average employee ratings, or null if not found>,
  "reviewSummary": "<2-3 sentence summary of what employees say about working here>",
  "prosHighlights": ["<pro 1>", "<pro 2>", "<pro 3>"],
  "consHighlights": ["<con 1>", "<con 2>", "<con 3>"],
  "sources": [{"title": "<source title>", "url": "<actual URL>"}],
  "searchQuery": "${searchQuery}"
}

IMPORTANT: Return ONLY the JSON object, no markdown or code blocks.`
        }
      ],
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    // Clean the response
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    return JSON.parse(cleanedContent);
  } catch (error) {
    console.error('Perplexity API error:', error);
    return null;
  }
}

// Extract company name from job link or description
function extractCompanyName(jobLink?: string, jobDescription?: string): string | null {
  if (jobLink) {
    const linkedinMatch = jobLink.match(/linkedin\.com\/jobs\/view\/[^/]+-at-([^/]+)/i);
    if (linkedinMatch) return linkedinMatch[1].replace(/-/g, ' ');
    
    const greenhouseMatch = jobLink.match(/boards\.greenhouse\.io\/([^/]+)/i);
    if (greenhouseMatch) return greenhouseMatch[1].replace(/-/g, ' ');
    
    const leverMatch = jobLink.match(/jobs\.lever\.co\/([^/]+)/i);
    if (leverMatch) return leverMatch[1].replace(/-/g, ' ');
    
    const workdayMatch = jobLink.match(/([^.]+)\.wd\d+\.myworkdayjobs\.com/i);
    if (workdayMatch) return workdayMatch[1].replace(/-/g, ' ');
  }
  
  if (jobDescription) {
    const lines = jobDescription.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      const atMatch = lines[0].match(/at\s+([A-Z][a-zA-Z0-9\s&]+)/);
      if (atMatch) return atMatch[1].trim();
    }
  }
  
  return null;
}

// Analyze resume with OpenAI
async function analyzeWithOpenAI(apiKey: string, state: any): Promise<any> {
  const openai = new OpenAI({ apiKey });

  const systemPrompt = `You are an expert career coach and resume optimization specialist.
Your task is to analyze a resume against a job description and provide actionable improvement suggestions.

ANALYSIS RULES:
1. Compare the resume content with the job requirements
2. Identify gaps in skills, keywords, and experience
3. Provide specific, actionable suggestions for improvement
4. Each suggestion should reference specific parts of the resume
5. Prioritize suggestions by impact (high/medium/low)
6. Estimate the probability of getting an interview and being accepted based on the match

CRITICAL - EXPERIENCE SUGGESTIONS:
- For each work experience entry in the resume, provide ONE experienceSuggestion object
- INCLUDE the company name and job title for each experience entry
- CONSOLIDATE all improvements for the same experience into ONE entry
- Each experienceSuggestion should include an "improvements" array with ALL the things to fix
- The refinedParagraph should have ALL improvements applied together
- DO NOT create multiple experienceSuggestion entries for the same experience

OUTPUT FORMAT:
You must respond with a valid JSON object with the following structure:
{
  "overallScore": <number 0-100>,
  "matchPercentage": <number 0-100>,
  "interviewProbability": <number 0-100 representing probability of getting an interview>,
  "acceptanceProbability": <number 0-100 representing probability of getting the job>,
  "targetCompanyName": "<company name from the job posting>",
  "targetJobTitle": "<job title from the job posting>",
  "suggestions": [
    {
      "id": "<unique string id>",
      "category": "<one of: skills, experience, education, summary, format, keywords>",
      "title": "<short title for the suggestion>",
      "suggestion": "<detailed explanation of what to improve and why>",
      "originalText": "<exact text from resume that needs improvement, if applicable>",
      "improvedText": "<suggested improved version of the text>",
      "priority": "<one of: high, medium, low>"
    }
  ],
  "missingKeywords": ["<keyword1>", "<keyword2>", ...],
  "strongPoints": ["<point1>", "<point2>", ...],
  "experienceSuggestions": [
    {
      "id": "<unique string id>",
      "companyName": "<company name where this experience was at>",
      "jobTitle": "<job title for this experience>",
      "originalExperience": "<the original job experience text/bullet points from the resume>",
      "suggestion": "<main thing to improve>",
      "refinedParagraph": "<the complete rewritten version with ALL improvements applied>",
      "priority": "<highest priority among all improvements: high, medium, low>",
      "improvements": [
        {
          "id": "<unique id>",
          "suggestion": "<specific improvement point 1>",
          "priority": "<high, medium, low>"
        },
        {
          "id": "<unique id>",
          "suggestion": "<specific improvement point 2>",
          "priority": "<high, medium, low>"
        }
      ]
    }
  ]
}

IMPORTANT:
- Return ONLY the JSON object, no markdown formatting or code blocks
- Ensure all strings are properly escaped
- Provide 5-10 specific suggestions in the "suggestions" array
- Be constructive and helpful in your feedback
- Focus on ATS optimization and keyword matching
- For experienceSuggestions: ONE entry per work experience with ALL improvements grouped
- ALWAYS include companyName and jobTitle for each experienceSuggestion
- The refinedParagraph should be a complete, polished rewrite with all improvements applied`;

  let userPrompt = `Please analyze the following resume against the job requirements and provide improvement suggestions.

JOB INFORMATION:
`;

  if (state.jobLink) {
    userPrompt += `Job Posting URL: ${state.jobLink}
Note: Please use any context you can infer from this URL about the company and position.
`;
  }

  if (state.jobDescription) {
    userPrompt += `
Job Description:
${state.jobDescription}
`;
  }

  userPrompt += `
RESUME CONTENT:
${state.resumeText}

Please analyze this resume and provide specific suggestions for improvement to better match the job requirements.
IMPORTANT: 
- Group all improvements for each work experience paragraph together - do not repeat the same paragraph multiple times
- Include the company name and job title for each experience suggestion`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.5,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content || "";
  
  let cleanedContent = content.trim();
  if (cleanedContent.startsWith('```json')) {
    cleanedContent = cleanedContent.slice(7);
  } else if (cleanedContent.startsWith('```')) {
    cleanedContent = cleanedContent.slice(3);
  }
  if (cleanedContent.endsWith('```')) {
    cleanedContent = cleanedContent.slice(0, -3);
  }
  cleanedContent = cleanedContent.trim();
  
  return JSON.parse(cleanedContent);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get API keys from the pool (load-balanced)
  let openaiKey: string;
  try {
    openaiKey = getOpenAIKey();
  } catch (error: any) {
    console.error('Failed to get OpenAI API key:', error.message);
    return res.status(500).json({ error: 'API Key is not configured' });
  }

  const perplexityKey = getPerplexityKey();

  try {
    const { state } = req.body;

    if (!state) {
      return res.status(400).json({ error: 'State is required' });
    }

    if (!state.resumeText && !state.resumeData) {
      return res.status(400).json({ error: 'Resume is required' });
    }

    if (!state.jobLink && !state.jobDescription) {
      return res.status(400).json({ error: 'Job link or description is required' });
    }

    // Try to extract company name early for parallel call
    const earlyCompanyName = extractCompanyName(state.jobLink, state.jobDescription);

    // ========================================
    // PARALLEL EXECUTION: Run OpenAI analysis and Perplexity insights concurrently
    // This reduces total latency from (OpenAI + Perplexity) to max(OpenAI, Perplexity)
    // ========================================
    
    const openaiPromise = analyzeWithOpenAI(openaiKey, state);
    
    // Start company insights fetch in parallel if we have a company name hint
    let speculativeInsightsPromise: Promise<any> | null = null;
    if (perplexityKey && earlyCompanyName) {
      speculativeInsightsPromise = fetchCompanyInsights(perplexityKey, earlyCompanyName);
    }

    // Wait for OpenAI result first
    let result;
    try {
      result = await openaiPromise;
    } catch (parseError: any) {
      console.error('Failed to parse OpenAI response:', parseError);
      return res.status(500).json({ 
        error: 'Failed to parse analysis results',
        details: parseError.message 
      });
    }

    // Determine final company name from OpenAI result
    const finalCompanyName = result.targetCompanyName || earlyCompanyName;
    const jobTitle = result.targetJobTitle;

    // Handle company insights
    if (perplexityKey && finalCompanyName) {
      if (earlyCompanyName && finalCompanyName.toLowerCase() === earlyCompanyName.toLowerCase() && speculativeInsightsPromise) {
        // Company name matched - use speculative result
        const companyInsights = await speculativeInsightsPromise;
        if (companyInsights) {
          result.companyInsights = companyInsights;
        }
      } else {
        // Company name different or no early name - fetch fresh
        const companyInsights = await fetchCompanyInsights(perplexityKey, finalCompanyName, jobTitle);
        if (companyInsights) {
          result.companyInsights = companyInsights;
        }
      }
    }

    return res.status(200).json(result);

  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Failed to analyze resume',
      details: error.message
    });
  }
}
