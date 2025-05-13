'use server';
/**
 * @fileOverview Generates a structured and adaptive cold call script.
 *
 * - generateColdCallScript - A function that generates a cold call script.
 * - GenerateColdCallScriptInput - The input type for the generateColdCallScript function.
 * - GenerateColdCallScriptOutput - The return type for the generateColdCallScript function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateColdCallScriptInputSchema = z.object({
  userName: z.string().describe('The name of the salesperson making the call.'),
  businessName: z.string().describe("The salesperson's company name."),
  productService: z.string().describe('A description of the product or service being offered.'),
  salesGoals: z.string().describe('The primary objective of this cold call (e.g., schedule a demo, qualify lead).'),
  customerInfo: z.string().describe('A summary of information about the target customer, potentially including their company name, industry, or needs. This info is derived from either a website analysis or a user-provided text summary.'),
  customerCompanyName: z.string().optional().describe('The name of the customer company, if identified from URL or text summary.'),
});
export type GenerateColdCallScriptInput = z.infer<typeof GenerateColdCallScriptInputSchema>;

const GenerateColdCallScriptOutputSchema = z.object({
  opening: z.string().describe('The initial part of the script: greeting, introduction, and reason for calling, personalized using customer information. Should be concise and include a hook.'),
  valueProposition: z.string().describe('Clearly states the benefits of the product/service, tailored to the customer. Concise and benefit-driven.'),
  engagementQuestion: z.string().describe('An open-ended question to encourage dialogue and uncover needs. Should naturally follow the value proposition.'),
  callToAction: z.string().describe('The desired next step (e.g., schedule demo, qualify lead). Clear and low-commitment.'),
  objectionHandlingTips: z.array(z.object({
      objection: z.string().describe('A common objection the salesperson might hear.'),
      response: z.string().describe('A suggested response to the objection, aiming to keep the conversation going or address the concern.'),
    })).min(2).max(3).describe('Tips for handling 2-3 common objections, with concise responses. These should be general and adaptable.'),
  adaptivePhrases: z.object({
    positiveCueResponse: z.string().describe("A short phrase or question to use if the prospect shows positive interest (e.g., 'Great! To give you a more tailored idea...')."),
    neutralOrBusyResponse: z.string().describe("A polite way to handle a prospect who is busy or gives a neutral, non-committal response (e.g., 'I understand. When would be a better time for a quick 2-minute chat?')."),
  }).describe('Short phrases for adapting to common prospect reactions.')
});
export type GenerateColdCallScriptOutput = z.infer<typeof GenerateColdCallScriptOutputSchema>;

export async function generateColdCallScript(input: GenerateColdCallScriptInput): Promise<GenerateColdCallScriptOutput> {
  return generateColdCallScriptFlow(input);
}

const generateColdCallScriptPrompt = ai.definePrompt({
  name: 'generateColdCallScriptPrompt',
  input: {schema: GenerateColdCallScriptInputSchema},
  output: {schema: GenerateColdCallScriptOutputSchema},
  prompt: `You are an expert sales scriptwriter.
Your task is to craft a highly effective, personalized, concise, and adaptive cold call script for {{{userName}}} from {{{businessName}}}.

Here's the information you'll use:

Your Business Details:
- Salesperson Name: {{{userName}}}
- Your Company: {{{businessName}}}
- Product/Service you are offering: {{{productService}}}
- Objective for this call: {{{salesGoals}}}

Target Customer Information:
- Customer Company Name (if available): {{#if customerCompanyName}}{{customerCompanyName}}{{else}}Not specified{{/if}}
- Detailed Customer Insights: {{{customerInfo}}}
(This information was gathered from their website or a provided summary. Analyze it carefully. Use the Customer Company Name if provided. Identify key aspects of their business, pain points, or recent activities to make the script highly relevant.)

---
SCRIPT GENERATION GUIDELINES:

The script should be structured into the following distinct parts. Ensure all text is plain text, using double line breaks for paragraph separation and single line breaks for readability within paragraphs. NO MARKDOWN. Craft concise sentences. Avoid overly long or complex phrasing. Keep sentences and paragraphs short and to the point.

1.  **Opening (Output as \`opening\` field):**
    *   Greet the prospect professionally and warmly. Use {{#if customerCompanyName}}"the representative at {{customerCompanyName}}"{{else}}"[Prospect Name/Generic Greeting]"{{/if}}. Example: "Good morning/afternoon {{#if customerCompanyName}}representative at {{customerCompanyName}}{{else}}[Prospect's Title/Name]{{/if}},".
    *   Clearly introduce yourself: "this is {{{userName}}} calling from {{{businessName}}}."
    *   Briefly state the reason for your call, immediately connecting to something relevant from customerInfo{{#if customerCompanyName}} about {{customerCompanyName}}{{/if}}. This shows you've done research and grabs attention.
        *   Example if customerInfo mentions "expansion into new markets" for {{#if customerCompanyName}}{{customerCompanyName}}{{else}}their company{{/if}}: "I was reviewing {{#if customerCompanyName}}{{customerCompanyName}}'s{{else}}your company's{{/if}} recent announcement about expanding into new markets, and it prompted me to reach out..."
        *   Example if customerInfo mentions "struggling with X" for {{#if customerCompanyName}}{{customerCompanyName}}{{else}}their company{{/if}}: "I understand from industry insights that companies like {{#if customerCompanyName}}{{customerCompanyName}}{{else}}yours{{/if}} are often looking for ways to improve [area related to X], which is why I'm calling..."
    *   Must be concise (target 10-15 seconds).

2.  **Value Proposition (Output as \`valueProposition\` field):**
    *   Concise and benefit-driven. How does your {{{productService}}} specifically help {{#if customerCompanyName}}{{customerCompanyName}}{{else}}businesses like theirs{{/if}} (based on customerInfo)?
    *   Focus on solving a potential problem or achieving a desirable outcome for the customer, directly linking to customerInfo and general business challenges your product addresses.
    *   Example: "We help businesses like {{#if customerCompanyName}}{{customerCompanyName}}{{else}}yours{{/if}} to [achieve specific benefit 1, e.g., 'streamline their X process by Y%'] and [achieve specific benefit 2, e.g., 'reduce costs associated with Z'], which seems particularly relevant given [mention something specific from customerInfo about {{#if customerCompanyName}}{{customerCompanyName}}{{else}}their company{{/if}} if possible, otherwise a general industry trend]."
    *   Concise and impactful (target 20-30 seconds).

3.  **Engagement Question (Output as \`engagementQuestion\` field):**
    *   Ask an open-ended, insightful question that encourages them to talk about their current situation, challenges, or goals related to what you offer{{#if customerCompanyName}}, specifically for {{customerCompanyName}}{{/if}}.
    *   This should flow naturally from your value proposition.
    *   Example: "How are you currently approaching [the challenge your product solves]{{#if customerCompanyName}} at {{customerCompanyName}}{{/if}}?" or "What are your thoughts on optimizing [the area your product improves]{{#if customerCompanyName}} in the coming months at {{customerCompanyName}}{{/if}}?"

4.  **Call to Action (Output as \`callToAction\` field):**
    *   Based on your {{{salesGoals}}}, propose a clear, low-commitment next step. Make it easy for them to say yes.
    *   Example for "schedule a demo": "If this sounds like it could be beneficial for {{#if customerCompanyName}}{{customerCompanyName}}{{else}}your business{{/if}}, I'd be happy to schedule a brief 15-minute demo next week to show you exactly how it works. Would Tuesday or Thursday afternoon work for you?"
    *   Example for "qualify lead": "To see if this is even a good fit for {{#if customerCompanyName}}{{customerCompanyName}}{{else}}your company{{/if}}, would you be open to a quick 5-10 minute chat to discuss your current [relevant process/system]?"

5.  **Objection Handling Tips (Output as \`objectionHandlingTips\` array, with 2-3 objects each having \`objection\` and \`response\` fields):**
    *   Provide 2-3 common objections a salesperson might face for this type of product/service and customer.
    *   For each objection, provide a brief, effective response designed to keep the conversation open or pivot.
    *   Example Objection: "I'm not interested." Response: "I understand. Many people I speak with initially feel that way. Often, it's because they're not yet clear on how [product/service] specifically addresses [key pain point from customerInfo or general problem]. Could I ask what your current approach to [relevant area] is?"
    *   Example Objection: "We already use [Competitor/Solution Type]." Response: "That's great you're already proactive in that area. We find that many businesses using solutions like that turn to us when they need to [mention a key differentiator or benefit of your productService, e.g., 'achieve X more efficiently' or 'integrate Y seamlessly']. Would you be open to a quick comparison if it could offer [specific advantage]?"
    *   Example Objection: "Just send me an email." Response: "Happy to. To make sure I send the most relevant information for {{#if customerCompanyName}}{{customerCompanyName}}{{else}}your needs{{/if}}, could you quickly tell me what your main challenge is with [relevant area] right now?"

6.  **Adaptive Phrases (Output as \`adaptivePhrases\` object with \`positiveCueResponse\` and \`neutralOrBusyResponse\` fields):**
    *   \`positiveCueResponse\`: A short phrase/question to use if the prospect shows positive interest. Example: "That's great to hear! To give you a more tailored idea of how {{{productService}}} can specifically help {{#if customerCompanyName}}{{customerCompanyName}}{{else}}your team{{/if}}, would you have 10 minutes for a brief call next week?"
    *   \`neutralOrBusyResponse\`: A polite way to handle a prospect who is busy or gives a neutral, non-committal response. Example: "I completely understand you're busy. My aim was just to briefly introduce how {{{businessName}}} helps companies like {{#if customerCompanyName}}{{customerCompanyName}}{{else}}yours{{/if}} with [core benefit related to salesGoals]. Would there be a better time for a quick 2-minute chat, perhaps later this week?"

---
Tone:
    *   Confident, empathetic, and respectful of their time.
    *   Conversational and natural, not robotic.
    *   Enthusiastic but not overly aggressive or pushy.

Formatting Requirements (Very Important):
    *   The output MUST be a JSON object conforming to the \`GenerateColdCallScriptOutputSchema\`.
    *   All text content within the JSON fields MUST be **plain text**.
    *   Use **double line breaks** to separate distinct paragraphs or sections of the script within each text field (e.g., separate parts of the Opening).
    *   Use single line breaks for readability within a paragraph if a thought continues but needs a slight pause.
    *   **DO NOT use any markdown syntax** (like #, ##, *, -, 1., etc.) or HTML tags in the text content. The script will be displayed directly and markdown will not be rendered.
    *   Structure the script logically within each field.

---
Now, generate the structured cold call script:
`,
});

const generateColdCallScriptFlow = ai.defineFlow(
  {
    name: 'generateColdCallScriptFlow',
    inputSchema: GenerateColdCallScriptInputSchema,
    outputSchema: GenerateColdCallScriptOutputSchema,
  },
  async input => {
    const {output} = await generateColdCallScriptPrompt(input);
    // The output from the prompt should already be in the correct schema structure.
    // If the LLM fails to produce valid JSON or the correct structure, an error will likely occur here or be caught by Zod.
    // Genkit handles the parsing of the LLM's response into the output schema.
    if (!output) {
      throw new Error("The AI model did not return a valid script structure.");
    }
    return output;
  }
);
