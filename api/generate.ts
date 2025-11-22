import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
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

  try {
    const { state } = req.body;

    if (!state) {
      return res.status(400).json({ error: 'State is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set');
      return res.status(500).json({ error: 'API Key is not configured' });
    }

    const openai = new OpenAI({ apiKey });

    // Determine if this is from the extension (has pageContent) or web app
    const isExtensionRequest = !!state.pageContent;

    const getSystemInstruction = (state: any) => {
      const baseInstruction = `
You are an expert career coach and professional writer.
Your task is to write a flawless, human-sounding cover letter.
The letter should be written in ${state.language || 'English'}.
The tone should be ${state.tone || 'Professional'}.
The length should be approximately ${state.length || 'Standard (350 words)'}.

EXTRACTION AND RESEARCH RULES:
1. **Resume Analysis**: Analyze the resume text provided. EXTRACT the candidate's full name and contact information from the resume.
2. **Job Context**: ${isExtensionRequest ? 'Analyze the PAGE CONTENT provided to identify the job position, company name, job requirements, and company culture.' : 'If a Job Posting URL is provided, infer what you can about the company and position.'}
3. **Company Research**: Use your knowledge about the company to understand their values and mission. Incorporate relevant details when appropriate.

FORMATTING RULES (Strictly Follow):
1. **Format**: Use a standard professional business letter format.
2. **Header**: Include the Candidate's Name (Extracted) and Contact Info (email/phone extracted from resume) at the top.
3. **Date**: Include today's date.
4. **Recipient**: Use "Dear Hiring Manager," or a specific name if found.
5. **Body**:
   - **Hook**: Start with a strong opening that connects the candidate's passion to the company's mission. Avoid "I am writing to apply".
   - **Content**: Highlight relevant skills from the resume that match the job description.
6. **Closing**: YOU MUST use a proper formal closing.
   - Use "Sincerely,"
   - Followed by a blank line for signature
   - Followed by the Candidate's Full Name (Extracted from resume).
   - Do NOT use placeholders like "[Your Name]".

STYLE RULES:
1. Ensure the text flows naturally and does not sound robotic.
2. If additional instructions are provided, strictly follow them.
`;
      return baseInstruction;
    };

    let textPrompt = '';

    if (isExtensionRequest) {
      // Extension mode: Use pageContent for job extraction
      textPrompt = `
TASK: Analyze the web page content below to extract job details, then write a tailored cover letter.

PAGE URL: ${state.pageUrl || 'Not provided'}
PAGE TITLE: ${state.pageTitle || 'Not provided'}

PAGE CONTENT (scraped from job posting page):
${state.pageContent.substring(0, 12000)}

---

CANDIDATE'S RESUME:
${state.resumeText}

---

INSTRUCTIONS:
1. First, analyze the PAGE CONTENT to identify:
   - Company Name
   - Job Title/Position
   - Key requirements and qualifications
   - Company values/culture (if mentioned)

2. Then, write a professional cover letter that:
   - Addresses the specific job requirements found in the page content
   - Highlights relevant experience from the resume
   - Shows enthusiasm for the specific company and role
   - Is written in ${state.language || 'English'}

Please write the cover letter now.
`;
    } else {
      // Web app mode: Traditional approach
      textPrompt = `
INPUT DATA:
My Name: ${state.fullName ? state.fullName : "(Please EXTRACT from Resume)"}
Target Company: ${state.companyName ? state.companyName : "(Please EXTRACT from Job Description if possible)"}
Target Position: ${state.jobTitle ? state.jobTitle : "(Please EXTRACT from Job Description if possible)"}
`;

      if (state.jobLink) {
        textPrompt += `\n\nJob Posting URL: ${state.jobLink}`;
      }

      if (state.jobDescription) {
        textPrompt += `\n\nJOB DESCRIPTION:\n${state.jobDescription.substring(0, 8000)}`;
        textPrompt += `\n\nIMPORTANT: Use the job description above to understand the role requirements. Match the candidate's experience to these specific requirements.`;
      } else if (state.jobLink) {
        textPrompt += `\nNote: Please use the URL to infer company name and position, and use any knowledge you have about this company.`;
      }

      textPrompt += `\n\nMy Resume Content:\n${state.resumeText}`;

      if (state.additionalInstructions) {
        textPrompt += `\n\nAdditional Instructions: ${state.additionalInstructions}`;
      }

      textPrompt += `\n\nPlease write the cover letter now based on the instructions.`;
    }

    const messages: any[] = [];

    if (state.resumeData) {
      // Handle image/PDF resume attachment (web app mode)
      const mimeType = state.resumeMimeType || 'application/pdf';
      const imageUrl = `data:${mimeType};base64,${state.resumeData}`;

      messages.push({
        role: "user",
        content: [
          { type: "text", text: textPrompt },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high"
            }
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: textPrompt
      });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: "system", content: getSystemInstruction(state) },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const text = response.choices[0]?.message?.content || "Failed to generate content.";
    const sources: { title: string; uri: string }[] = [];

    return res.status(200).json({ text, sources });

  } catch (error: any) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({
      error: 'Failed to generate cover letter',
      details: error.message
    });
  }
}
