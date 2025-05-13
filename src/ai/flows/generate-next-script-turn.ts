
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
import type { ScriptTurn, ProspectResponseOption } from './generate-cold-call-script'; // Keep type import from original source
import { ScriptTurnSchema, ProspectResponseOptionSchema } from '@/ai/schemas/script-schemas'; // Import schemas from new location

// Represents a completed turn in the script history
const CompletedScriptTurnSchema = ScriptTurnSchema.extend({
  chosenProspectResponse: ProspectResponseOptionSchema.describe("The specific response chosen by the prospect for this turn."),
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
export type GenerateNextScriptTurnOutput = ScriptTurn;

export async function generateNextScriptTurn(input: GenerateNextScriptTurnInput): Promise<GenerateNextScriptTurnOutput> {
  return generateNextScriptTurnFlow(input);
}

const generateNextScriptTurnPrompt = ai.definePrompt({
  name: 'generateNextScriptTurnPrompt',
  input: {schema: GenerateNextScriptTurnInputSchema},
  output: {schema: ScriptTurnSchema},
  prompt: `You are an expert sales coach guiding {{{userName}}} from {{{businessName}}} through a cold call.
They are selling: {{{productService}}}.
Their goal for this call is: {{{salesGoals}}}.
They are speaking with a representative from {{#if customerCompanyName}}{{customerCompanyName}}{{else}}a company matching this description: {{{customerInfo}}}{{/if}}.

Conversation History:
{{#each scriptHistory}}
{{{../userName}}}: {{this.salespersonUtterance}}
Prospect: {{this.chosenProspectResponse.responseText}} (Sentiment: {{this.chosenProspectResponse.responseType}})

{{/each}}
The prospect just said: "{{lastProspectResponse.responseText}}" (Sentiment: {{lastProspectResponse.responseType}})

Based on this, what should {{{userName}}} say next?
- The utterance should be concise, human-like, and conversational.
- If the prospect's last response was 'negative_objection', try to acknowledge and gently pivot or ask a clarifying question.
- If 'positive', build on the interest.
- If 'neutral', try to engage further or qualify.
- Directly reference the prospect's last response if natural.
- Keep the overall call objective ({{{salesGoals}}}) in mind.

Output Format Requirements:
The output MUST be a JSON object conforming to the ScriptTurn schema.
- \`salespersonUtterance\`: What {{{userName}}} should say next.
- \`prospectResponseOptions\`: An array of 2-4 distinct, plausible short responses the prospect might give. Each with \`responseText\` and \`responseType\` ("positive", "neutral", "negative_objection").

Generate the next script turn:
`,
});

const generateNextScriptTurnFlow = ai.defineFlow(
  {
    name: 'generateNextScriptTurnFlow',
    inputSchema: GenerateNextScriptTurnInputSchema,
    outputSchema: ScriptTurnSchema,
  },
  async (input) => {
    const {output} = await generateNextScriptTurnPrompt(input);
    if (!output) {
      throw new Error("The AI model did not return a valid next script turn.");
    }
    return output;
  }
);
