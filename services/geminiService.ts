import { GoogleGenAI } from "@google/genai";
import { CoverLetterState, GeneratedResult } from "../types";

const getSystemInstruction = (state: CoverLetterState) => `
You are an expert career coach and professional writer.
Your task is to write a flawless, human-sounding cover letter.
The letter should be written in ${state.language}.
The tone should be ${state.tone}.
The length should be approximately ${state.length}.

EXTRACTION AND RESEARCH RULES:
1. **Resume Analysis**: Analyze the attached resume/text. If the user's name is not expressly provided in the prompt, EXTRACT the candidate's full name from the resume.
2. **Job Context**: If a Job Posting URL is provided, use Google Search to analyze it. If the Target Company or Target Position are not expressly provided, IDENTIFY them from the URL content.
3. **Company Research**: Research the company (using the name provided or identified) to understand their values, recent news, and mission. Incorporate 1-2 specific details.

FORMATTING RULES (Strictly Follow):
1. **Format**: Use a standard professional business letter format.
2. **Header**: Include the Candidate's Name (Extracted) and Contact Info (email/phone extracted from resume) at the top.
3. **Date**: Include today's date.
4. **Recipient**: Use "Dear Hiring Manager," or a specific name if found in the job link.
5. **Body**: 
   - **Hook**: Start with a strong opening that connects the candidate's passion to the company's mission. Avoid "I am writing to apply".
   - **Content**: Highlight relevant skills from the resume that match the job description.
6. **Closing**: YOU MUST use a proper formal closing. 
   - Use "Sincerely,"
   - Followed by a blank line for signature
   - Followed by the Candidate's Full Name (Extracted from resume or provided input).
   - Do NOT use placeholders like "[Your Name]" if you can find the name in the resume.

STYLE RULES:
1. Ensure the text flows naturally and does not sound robotic.
2. If the user provided additional instructions: "${state.additionalInstructions}", strictly follow them.
`;

export const generateCoverLetter = async (state: CoverLetterState): Promise<GeneratedResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let textPrompt = `
    INPUT DATA:
    My Name: ${state.fullName ? state.fullName : "(Not provided - Please EXTRACT from Resume)"}
    Target Company: ${state.companyName ? state.companyName : "(Not provided - Please EXTRACT from Job Link)"}
    Target Position: ${state.jobTitle ? state.jobTitle : "(Not provided - Please EXTRACT from Job Link)"}
  `;

  if (state.jobLink) {
    textPrompt += `\n\nJob Posting URL: ${state.jobLink}. \nPlease access this link to extract company details, job requirements, and the position title if missing above.`;
  }
  
  const parts: any[] = [];

  if (state.resumeData) {
    textPrompt += `\n\nPlease find my resume attached as a PDF. Use this resume to extract my name, contact info, and analyze my experience.`;
    parts.push({ text: textPrompt });
    parts.push({ 
      inlineData: { 
        mimeType: state.resumeMimeType || 'application/pdf', 
        data: state.resumeData 
      } 
    });
  } else {
    textPrompt += `\n\nMy Resume Content:\n${state.resumeText}`;
    textPrompt += `\n\nPlease write the cover letter now based on the instructions.`;
    parts.push({ text: textPrompt });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        systemInstruction: getSystemInstruction(state),
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    // Extract text
    const text = response.text || "Failed to generate content.";

    // Extract grounding metadata (sources)
    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return { text, sources };

  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
  }
};