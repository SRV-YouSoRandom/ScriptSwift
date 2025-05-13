'use server';

/**
 * @fileOverview This file defines a Genkit flow to analyze a customer's website and extract relevant information.
 *
 * - analyzeCustomerWebsite - Analyzes the content of a customer's website.
 * - AnalyzeCustomerWebsiteInput - The input type for the analyzeCustomerWebsite function.
 * - AnalyzeCustomerWebsiteOutput - The return type for the analyzeCustomerWebsite function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {extractWebsiteContent} from '@/services/web-scrape';

const AnalyzeCustomerWebsiteInputSchema = z.object({
  url: z.string().url().describe('The URL of the customer website to analyze.'),
});
export type AnalyzeCustomerWebsiteInput = z.infer<
  typeof AnalyzeCustomerWebsiteInputSchema
>;

const AnalyzeCustomerWebsiteOutputSchema = z.object({
  companyName: z.string().optional().describe('The identified name of the customer company. Omit if not found or not clearly identifiable.'),
  summary: z.string().describe('A concise summary of the customer website, including products/services, target audience, and key value propositions. This summary will be used to personalize a sales script.'),
});
export type AnalyzeCustomerWebsiteOutput = z.infer<
  typeof AnalyzeCustomerWebsiteOutputSchema
>;

// Schema for the data actually passed to the prompt function
const AnalyzeCustomerWebsitePromptRuntimeInputSchema = z.object({
  url: z.string().url().describe('The URL of the customer website that was analyzed.'),
  websiteContent: z.string().describe('The raw text content extracted from the website.'),
});
type AnalyzeCustomerWebsitePromptRuntimeInput = z.infer<typeof AnalyzeCustomerWebsitePromptRuntimeInputSchema>;


export async function analyzeCustomerWebsite(
  input: AnalyzeCustomerWebsiteInput
): Promise<AnalyzeCustomerWebsiteOutput> {
  return analyzeCustomerWebsiteFlow(input);
}

const analyzeCustomerWebsitePrompt = ai.definePrompt({
  name: 'analyzeCustomerWebsitePrompt',
  input: {schema: AnalyzeCustomerWebsitePromptRuntimeInputSchema}, 
  output: {schema: AnalyzeCustomerWebsiteOutputSchema},
  prompt: `You are an expert marketing analyst. Your task is to analyze website content and extract key information for sales script personalization.

  From the provided website content (under "Website content:" below), identify the company name and generate a concise summary.
  
  Output Requirements (JSON object adhering to the output schema):
  1.  \`companyName\`: Extract the primary name of the business or organization. If not clearly identifiable, this field can be omitted or an empty string.
  2.  \`summary\`: Generate a summary covering these points:
      *   **Core Products/Services:** What do they primarily offer? (If not clear, state "Not clearly specified")
      *   **Target Audience:** Who are their typical customers or users? (If not clear, state "Not clearly specified")
      *   **Key Value Propositions/Unique Selling Points:** What makes them stand out? What problems do they solve? (If not clear, state "Not clearly specified")
      *   **Recent News/Notable Mentions (Optional):** If anything stands out (e.g., new product launch, award, major event), briefly note it.

  The summary should be factual and directly derived from the content. This summary will be passed to another AI to generate a sales script, so clarity and relevance are crucial.
  If some information for the summary is not available in the content, explicitly state "Not clearly specified" for that point rather than making assumptions. Do not include the company name in the summary field itself, as it's a separate field.

  Website content:
  {{{websiteContent}}}
  `,
});

const analyzeCustomerWebsiteFlow = ai.defineFlow(
  {
    name: 'analyzeCustomerWebsiteFlow',
    inputSchema: AnalyzeCustomerWebsiteInputSchema, // Input to the flow is just the URL
    outputSchema: AnalyzeCustomerWebsiteOutputSchema,
  },
  async (flowInput: AnalyzeCustomerWebsiteInput) : Promise<AnalyzeCustomerWebsiteOutput> => {
    const websiteContent = await extractWebsiteContent(flowInput.url);
    
    // Prepare the input for the prompt, matching AnalyzeCustomerWebsitePromptRuntimeInputSchema
    const promptInput: AnalyzeCustomerWebsitePromptRuntimeInput = {
      url: flowInput.url,
      websiteContent: websiteContent,
    };
    const {output} = await analyzeCustomerWebsitePrompt(promptInput);
    
    if (!output) {
        throw new Error("AI model did not return expected output for website analysis.");
    }
    return output;
  }
);
