'use server';
/**
 * @fileOverview Generates the next turn of a cold call script based on conversation history.
 *
 * - generateNextScriptTurn - A function that generates the next turn of a cold call script.
 * - GenerateNextScriptTurnInput - The input type for the generateNextScriptTurn function.
 * - ScriptTurn - Imported type for consistency.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ScriptTurn as OriginalScriptTurnType } from './generate-cold-call-script'; // Keep type import from original source for reference if needed
import { ScriptTurnSchema, ProspectResponseOptionSchema } from '@/ai/schemas/script-schemas'; // Import schemas from new location

// Represents a completed turn in the script history
// This schema is for items within the scriptHistory array.
// It explicitly defines how a completed turn should look.
const CompletedScriptTurnSchema = z.object({
  salespersonUtterance: ScriptTurnSchema.shape.salespersonUtterance, // Inherit from ScriptTurnSchema
  prospectResponseOptions: z.array(ProspectResponseOptionSchema).max(0).describe("For a completed turn in history, this should be an empty array as a response has already been chosen and options are no longer relevant."), // Override: completed turns have no further options
  chosenProspectResponse: ProspectResponseOptionSchema.describe("The specific response chosen by the prospect for this turn."), // Added for completed turns
});
type CompletedScriptTurn = z.infer<typeof CompletedScriptTurnSchema>;


const GenerateNextScriptTurnInputSchema = z.object({
  userName: z.string().describe('The name of the salesperson making the call.'),
  businessName: z.string().describe("The salesperson's company name."),
  productService: z.string().describe('A description of the product or service being offered.'),
  salesGoals: z.string().describe('The primary objective of this cold call (e.g., schedule a demo, qualify lead).'),
  customerInfo: z.string().describe('A summary of information about the target customer.'),
  customerCompanyName: z.string().optional().describe('The name of the customer company.'),
  scriptHistory: z.array(CompletedScriptTurnSchema).describe("The history of the conversation so far, with each turn including the salesperson's utterance and the prospect's chosen response."),
  lastProspectResponse: ProspectResponseOptionSchema.describe("The prospect's most recent response, which the next salesperson utterance should address or follow up on."),
});

export type GenerateNextScriptTurnInput = z.infer<typeof GenerateNextScriptTurnInputSchema>;
// The output for the next turn is a standard ScriptTurn, which will have new prospectResponseOptions
export type GenerateNextScriptTurnOutput = z.infer<typeof ScriptTurnSchema>; 

export async function generateNextScriptTurn(input: GenerateNextScriptTurnInput): Promise<GenerateNextScriptTurnOutput> {
  return generateNextScriptTurnFlow(input);
}

const generateNextScriptTurnPrompt = ai.definePrompt({
  name: 'generateNextScriptTurnPrompt',
  input: {schema: GenerateNextScriptTurnInputSchema},
  output: {schema: ScriptTurnSchema}, // Output is a new ScriptTurn with options
  prompt: `You are an expert sales coach guiding {{{userName}}} from {{{businessName}}} through a cold call.
They are selling: {{{productService}}}.
Their goal for this call is: {{{salesGoals}}}.

Target Customer Context:
- Customer Company Name (if identified): {{#if customerCompanyName}}{{customerCompanyName}}{{else}}the prospect's company{{/if}}
- Relevant background on the prospect (use this for context; DO NOT quote directly if it contains "Not clearly specified", "Placeholder content" or similar unhelpful phrases. Focus on actionable insights if any.): {{{customerInfo}}}

Conversation History:
{{#each scriptHistory}}
{{{../userName}}}: {{this.salespersonUtterance}}
Prospect: {{this.chosenProspectResponse.responseText}} (Sentiment: {{this.chosenProspectResponse.responseType}})

{{/each}}
The prospect just said: "{{lastProspectResponse.responseText}}" (Sentiment: {{lastProspectResponse.responseType}})

Based on this, what should {{{userName}}} say next?
- The utterance should be concise, human-like, and conversational.
- If the \`customerInfo\` primarily contains "Not clearly specified" or is unhelpful, rely more on the general sales goal, product benefits, and conversation flow to guide the response.
- If the prospect's last response was 'negative_objection', try to acknowledge and gently pivot or ask a clarifying question. Avoid being pushy.
- If 'positive', build on the interest. Progress towards the \`{{{salesGoals}}}\`.
- If 'neutral', try to engage further, clarify their position, or qualify their potential interest.
- Directly reference the prospect's last response if it feels natural and constructive to do so.
- Keep the overall call objective ({{{salesGoals}}}) in mind for every turn.
- Aim for a natural, flowing conversation, not a rigid Q&A.
- Each salesperson utterance should be very short, ideally 1-2 sentences, max 10-15 seconds to speak.

Output Format Requirements:
The output MUST be a JSON object conforming to the ScriptTurn schema.
- \`salespersonUtterance\`: What {{{userName}}} should say next. Make it sound natural.
- \`prospectResponseOptions\`: An array of 2-4 distinct, plausible short responses the prospect might give. Each with \`responseText\` and \`responseType\` ("positive", "neutral", "negative_objection").

Generate the next script turn:
`,
});

const generateNextScriptTurnFlow = ai.defineFlow(
  {
    name: 'generateNextScriptTurnFlow',
    inputSchema: GenerateNextScriptTurnInputSchema,
    outputSchema: ScriptTurnSchema, // Output is a regular ScriptTurn for the next step
  },
  async (input) => {
    const {output} = await generateNextScriptTurnPrompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid next script turn.");
    }
    return output;
  }
);

// Export type for ScriptTurn for other modules if they need the structure of a single turn (like the page)
export type { OriginalScriptTurnType as ScriptTurn };
