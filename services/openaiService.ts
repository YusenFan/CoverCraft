import OpenAI from "openai";
import { CoverLetterState, GeneratedResult } from "../types";

const getSystemInstruction = (state: CoverLetterState) => `
You are an expert career coach and professional writer.
Your task is to write a flawless, human-sounding cover letter.
The letter should be written in ${state.language}.
The tone should be ${state.tone}.
The length should be approximately ${state.length}.

EXTRACTION AND RESEARCH RULES:
1. **Resume Analysis**: Analyze the attached resume/text. If the user's name is not expressly provided in the prompt, EXTRACT the candidate's full name from the resume.
2. **Job Context**: If a Job Posting URL is provided, try to infer what you can about the company and position from the URL itself. If the Target Company or Target Position are not expressly provided, do your best to IDENTIFY them.
3. **Company Research**: Use your knowledge about the company (if you know it) to understand their values and mission. Incorporate relevant details when appropriate.

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

  const openai = new OpenAI({
    apiKey: process.env.API_KEY,
    dangerouslyAllowBrowser: true // Required for client-side usage
  });

  let textPrompt = `
    INPUT DATA:
    My Name: ${state.fullName ? state.fullName : "(Not provided - Please EXTRACT from Resume)"}
    Target Company: ${state.companyName ? state.companyName : "(Not provided - Please EXTRACT from Job Link if possible)"}
    Target Position: ${state.jobTitle ? state.jobTitle : "(Not provided - Please EXTRACT from Job Link if possible)"}
  `;

  if (state.jobLink) {
    textPrompt += `\n\nJob Posting URL: ${state.jobLink}.\nNote: You don't have direct access to browse this URL, but please use the URL to infer company name and position if not provided above, and use any knowledge you have about this company.`;
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (state.resumeData) {
    // OpenAI supports vision/document analysis with base64
    textPrompt += `\n\nPlease find my resume attached. Use this resume to extract my name, contact info, and analyze my experience.`;

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
    textPrompt += `\n\nMy Resume Content:\n${state.resumeText}`;
    textPrompt += `\n\nPlease write the cover letter now based on the instructions.`;

    messages.push({
      role: "user",
      content: textPrompt
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Using gpt-4o for multimodal support
      messages: [
        { role: "system", content: getSystemInstruction(state) },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const text = response.choices[0]?.message?.content || "Failed to generate content.";

    // OpenAI doesn't provide grounding metadata like Gemini
    // We'll return an empty sources array
    const sources: { title: string; uri: string }[] = [];

    return { text, sources };

  } catch (error) {
    console.error("OpenAI generation error:", error);
    throw error;
  }
};
