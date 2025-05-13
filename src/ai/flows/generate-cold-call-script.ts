
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
The primary goal of this opening is to **immediately capture attention and earn a few more seconds**. It MUST include a hook directly referencing a highly specific insight from customerInfo about {{#if customerCompanyName}}{{customerCompanyName}}{{else}}their company{{/if}}.

Salesperson Details:
- Name: {{{userName}}}
- Company: {{{businessName}}}
- Product/Service: {{{productService}}}
- Call Objective: {{{salesGoals}}}

Target Customer Information:
- Customer Company Name (if available): {{#if customerCompanyName}}{{customerCompanyName}}{{else}}Not specified{{/if}}
- Detailed Customer Insights: {{{customerInfo}}} (Analyze this carefully for a specific hook!)

Output Format Requirements:
The output MUST be a JSON object conforming to the ScriptTurn schema.
- \`salespersonUtterance\`: The opening statement. Make it sound natural, human, and engaging.
    - Example structure: "Hi [Prospect Contact at {{#if customerCompanyName}}{{customerCompanyName}}{{else}}Company{{/if}}], this is {{{userName}}} from {{{businessName}}}. I saw [specific insight from customerInfo, e.g., 'your recent article on X' or 'that {{#if customerCompanyName}}{{customerCompanyName}}{{else}}you're{{/if}} focusing on Y'], and had a quick thought related to how we help with [brief connection to productService]."
    - Be creative and ensure the hook is strong and specific.
- \`prospectResponseOptions\`: An array of 2-4 plausible, distinct short responses the prospect might give to this opening.
    - Each option should have \`responseText\` (e.g., "Okay, what is it?", "I'm busy right now.", "Not interested.")
    - And \`responseType\` ("positive", "neutral", "negative_objection").

Example of a good specific hook from customerInfo like "XYZ Corp recently launched a new AI initiative":
"Hi, this is {{{userName}}} from {{{businessName}}}. I noticed {{#if customerCompanyName}}{{customerCompanyName}}'s{{else}}your company's{{/if}} exciting new AI initiative, and it reminded me of how we help businesses quickly integrate [relevant aspect of {{{productService}}}] into such projects."

Tone: Confident, empathetic, respectful, and human. NOT robotic or overly formal.
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
