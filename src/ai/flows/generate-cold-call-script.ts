
'use server';
/**
 * @fileOverview Generates the initial turn of a structured and adaptive cold call script.
 *
 * - generateColdCallScript - A function that generates the first turn of a cold call script.
 * - GenerateColdCallScriptInput - The input type for the generateColdCallScript function.
 * - ScriptTurn - The type for a single turn in the script.
 * - ProspectResponseOption - The type for a prospect's response option.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { ProspectResponseOptionSchema, ScriptTurnSchema } from '@/ai/schemas/script-schemas';

// Types derived from imported schemas
export type ProspectResponseOption = z.infer<typeof ProspectResponseOptionSchema>;
export type ScriptTurn = z.infer<typeof ScriptTurnSchema>;


const GenerateColdCallScriptInputSchema = z.object({
  userName: z.string().describe('The name of the salesperson making the call.'),
  businessName: z.string().describe("The salesperson's company name."),
  productService: z.string().describe('A description of the product or service being offered.'),
  salesGoals: z.string().describe('The primary objective of this cold call (e.g., schedule a demo, qualify lead).'),
  customerInfo: z.string().describe('A summary of information about the target customer, potentially including their company name, industry, or needs. This info is derived from either a website analysis or a user-provided text summary.'),
  customerCompanyName: z.string().optional().describe('The name of the customer company, if identified from URL or text summary.'),
});
export type GenerateColdCallScriptInput = z.infer<typeof GenerateColdCallScriptInputSchema>;

// The output is now the first ScriptTurn
export type GenerateColdCallScriptOutput = ScriptTurn;


export async function generateColdCallScript(input: GenerateColdCallScriptInput): Promise<GenerateColdCallScriptOutput> {
  return generateInitialScriptTurnFlow(input);
}

const generateInitialScriptTurnPrompt = ai.definePrompt({
  name: 'generateInitialScriptTurnPrompt',
  input: {schema: GenerateColdCallScriptInputSchema},
  output: {schema: ScriptTurnSchema}, // Output is a single ScriptTurn
  prompt: `You are an expert sales scriptwriter, creating the **opening** of a cold call.
Your task is to craft an **ultra-concise (5-7 seconds, 1-2 short sentences)** opening statement for {{{userName}}} from {{{businessName}}}.
The primary goal of this opening is to **immediately capture attention and earn a few more seconds**.

Salesperson Details:
- Name: {{{userName}}}
- Company: {{{businessName}}}
- Product/Service: {{{productService}}}
- Call Objective: {{{salesGoals}}}

Target Customer Information (use this to find a compelling, specific hook):
- Customer Company Name (if identified): {{#if customerCompanyName}}{{customerCompanyName}}{{else}}The prospect's company{{/if}}
- Insights about their business/website/activities: {{{customerInfo}}}
  (Note: This 'customerInfo' may contain "Not clearly specified" for some fields. Use any available positive details for the hook. If many details are "Not clearly specified", pivot to a more general hook based on their likely industry or a general benefit of your product/service.)

Instructions for the Opening Statement:
- It MUST be ultra-concise (1-2 short sentences, aiming for 5-7 seconds).
- It must grab attention immediately.
- Create a hook by referencing a *specific, positive, or noteworthy insight* from the 'Insights' section regarding {{#if customerCompanyName}}{{customerCompanyName}}{{else}}their company{{/if}}.
- **Crucially, if \`customerInfo\` contains phrases like "Not clearly specified" or "Placeholder content" for key details (like products/services or value propositions), DO NOT repeat these negative phrases in your script.**
- Instead, if specific positive insights are scarce from \`customerInfo\`:
    1. Try to infer their industry from \`customerCompanyName\` or any fragment of \`customerInfo\`.
    2. Craft a hook based on a general benefit of your \`{{{productService}}}\` that would appeal to companies in that inferred industry.
    3. If industry is also unclear, make a very general but intriguing statement related to a common business challenge your \`{{{productService}}}\` addresses.
- Your utterance should sound natural, human, and engaging. Avoid overly formal or robotic language.

Example structure for a specific hook:
"Hi [Prospect at {{#if customerCompanyName}}{{customerCompanyName}}{{else}}the company{{/if}}], this is {{{userName}}} from {{{businessName}}}. I noticed {{#if customerCompanyName}}{{customerCompanyName}}'s{{else}}your company's{{/if}} [mention a *specific positive detail* found in customerInfo, e.g., 'recent work in X' or 'focus on Y'], and it sparked a quick idea related to how we help with [brief connection to {{{productService}}}] that I thought you'd find interesting."

Example if specific insights are lacking (e.g., customerInfo is mostly "Not clearly specified"):
"Hi [Prospect at {{#if customerCompanyName}}{{customerCompanyName}}{{else}}the company{{/if}}], this is {{{userName}}} from {{{businessName}}}. We're currently helping businesses like yours in the [their likely industry, or 'your sector'] to [achieve a key benefit related to {{{productService}}}, e.g., 'streamline their operations' or 'enhance customer engagement'], and I had a brief thought for {{#if customerCompanyName}}{{customerCompanyName}}{{else}}you{{/if}}."

Output Format Requirements for ScriptTurn (JSON object):
- \`salespersonUtterance\`: The crafted opening statement.
- \`prospectResponseOptions\`: An array of 2-4 plausible, distinct short responses the prospect might give to this opening. Each option should have \`responseText\` (e.g., "Okay, what is it?", "I'm busy right now.", "Not interested.") and \`responseType\` ("positive", "neutral", "negative_objection").

Tone: Confident, empathetic, respectful, and human.
Ensure all text is plain text. No markdown.

Generate the initial script turn:
`,
});

const generateInitialScriptTurnFlow = ai.defineFlow(
  {
    name: 'generateInitialScriptTurnFlow',
    inputSchema: GenerateColdCallScriptInputSchema,
    outputSchema: ScriptTurnSchema},
  async input => {
    const {output} = await generateInitialScriptTurnPrompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid initial script turn.");
    }
    return output;
  }
);
