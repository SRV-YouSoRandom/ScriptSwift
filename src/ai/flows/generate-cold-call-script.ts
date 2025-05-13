'use server';
/**
 * @fileOverview Generates a cold call script based on business and customer information.
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
  script: z.string().describe('The generated cold call script, formatted as plain text with appropriate paragraph breaks.'),
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
Your task is to craft a highly effective, personalized, and engaging cold call script for {{{userName}}} from {{{businessName}}}.

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

1.  **Opening (Approx. 10-15 seconds):**
    *   Greet the prospect professionally and warmly. Use {{#if customerCompanyName}}the representative at {{customerCompanyName}}{{else}}the prospect{{/if}}. Example: "Good morning/afternoon {{#if customerCompanyName}}representative at {{customerCompanyName}}{{else}}[Prospect Name/Generic Greeting]{{/if}},".
    *   Clearly introduce yourself: "this is {{{userName}}} calling from {{{businessName}}}."
    *   Briefly state the reason for your call, immediately connecting to something relevant from customerInfo {{#if customerCompanyName}}about {{customerCompanyName}}{{/if}}. This shows you've done research.
        *   Example if customerInfo mentions "expansion into new markets" {{#if customerCompanyName}}for {{customerCompanyName}}{{/if}}: "I was reviewing {{#if customerCompanyName}}{{customerCompanyName}}'s{{else}}their company's{{/if}} recent announcement about expanding into new markets, and it prompted me to reach out..."
        *   Example if customerInfo mentions "struggling with X" {{#if customerCompanyName}}for {{customerCompanyName}}{{/if}}: "I understand from some industry insights that companies like {{#if customerCompanyName}}{{customerCompanyName}}{{else}}yours{{/if}} are often looking for ways to improve [area related to X], which is why I'm calling..."
        *   If customerInfo is more general, tailor it: "I've been researching companies in the [customer's industry, if known from customerInfo] and {{{businessName}}} specializes in helping businesses like yours to..."

2.  **Value Proposition (Approx. 20-30 seconds):**
    *   Concise and benefit-driven. How does your {{{productService}}} specifically help {{#if customerCompanyName}}{{customerCompanyName}}{{else}}businesses like theirs{{/if}} (based on customerInfo)?
    *   Focus on solving a potential problem or achieving a desirable outcome for the customer, based on customerInfo and general business challenges your product addresses.
    *   Example: "We help businesses like {{#if customerCompanyName}}{{customerCompanyName}}{{else}}yours{{/if}} to [achieve specific benefit 1, e.g., 'streamline their X process by Y%'] and [achieve specific benefit 2, e.g., 'reduce costs associated with Z'], which seems particularly relevant given [mention something specific from customerInfo about {{#if customerCompanyName}}{{customerCompanyName}}{{else}}their company{{/if}} if possible, otherwise a general industry trend]."

3.  **Engagement Question (Leads to conversation):**
    *   Ask an open-ended, insightful question that encourages them to talk about their current situation, challenges, or goals related to what you offer{{#if customerCompanyName}}, specifically for {{customerCompanyName}}{{/if}}.
    *   This should flow naturally from your value proposition.
    *   Example: "How are you currently approaching [the challenge your product solves]{{#if customerCompanyName}} at {{customerCompanyName}}{{/if}}?" or "What are your thoughts on optimizing [the area your product improves]{{#if customerCompanyName}} in the coming months at {{customerCompanyName}}{{/if}}?"

4.  **Call to Action (Clear and Low-Commitment):**
    *   Based on your {{{salesGoals}}}, propose a clear next step. Make it easy for them to say yes.
    *   Example for "schedule a demo": "If this sounds like it could be beneficial for {{#if customerCompanyName}}{{customerCompanyName}}{{else}}your business{{/if}}, I'd be happy to schedule a brief 15-minute demo next week to show you exactly how it works. Would Tuesday or Thursday afternoon work for you?"
    *   Example for "qualify lead": "To see if this is even a good fit for {{#if customerCompanyName}}{{customerCompanyName}}{{else}}your company{{/if}}, would you be open to a quick 5-10 minute chat to discuss your current [relevant process/system]?"

5.  **Tone:**
    *   Confident, empathetic, and respectful of their time.
    *   Conversational and natural, not robotic.
    *   Enthusiastic but not overly aggressive or pushy.

6.  **Formatting Requirements (Very Important):**
    *   The output script MUST be **plain text**.
    *   Use **double line breaks** to separate distinct paragraphs or sections of the script (e.g., separate the Opening from the Value Proposition).
    *   Use single line breaks for readability within a paragraph if a thought continues but needs a slight pause.
    *   **DO NOT use any markdown syntax** (like #, ##, *, -, 1., etc.) or HTML tags. The script will be displayed directly and markdown will not be rendered.
    *   Structure the script logically.

---
Now, generate the cold call script:
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
    return output!;
  }
);