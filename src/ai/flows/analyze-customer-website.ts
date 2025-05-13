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
  summary: z.string().describe('A concise summary of the customer website, including company name, products/services, target audience, and key value propositions. This summary will be used to personalize a sales script.'),
});
export type AnalyzeCustomerWebsiteOutput = z.infer<
  typeof AnalyzeCustomerWebsiteOutputSchema
>;

export async function analyzeCustomerWebsite(
  input: AnalyzeCustomerWebsiteInput
): Promise<AnalyzeCustomerWebsiteOutput> {
  return analyzeCustomerWebsiteFlow(input);
}

const analyzeCustomerWebsitePrompt = ai.definePrompt({
  name: 'analyzeCustomerWebsitePrompt',
  input: {schema: AnalyzeCustomerWebsiteInputSchema}, // Input here is just URL, websiteContent is added in the flow
  output: {schema: AnalyzeCustomerWebsiteOutputSchema},
  prompt: `You are an expert marketing analyst. Your task is to analyze website content and extract key information for sales script personalization.

  From the provided website content, generate a concise summary covering these points:
  1.  **Company Name:** Identify the primary name of the business or organization.
  2.  **Core Products/Services:** What do they primarily offer?
  3.  **Target Audience:** Who are their typical customers or users?
  4.  **Key Value Propositions/Unique Selling Points:** What makes them stand out? What problems do they solve?
  5.  **Recent News/Notable Mentions (Optional):** If anything stands out (e.g., new product launch, award, major event), briefly note it.

  The summary should be factual and directly derived from the content. This summary will be passed to another AI to generate a sales script, so clarity and relevance are crucial.

  Website content:
  {{{websiteContent}}}
  `,
});

const analyzeCustomerWebsiteFlow = ai.defineFlow(
  {
    name: 'analyzeCustomerWebsiteFlow',
    inputSchema: AnalyzeCustomerWebsiteInputSchema, // Flow input schema
    outputSchema: AnalyzeCustomerWebsiteOutputSchema,
  },
  async input => {
    const websiteContent = await extractWebsiteContent(input.url);
    // The prompt input now requires 'websiteContent', which we provide here.
    // The prompt's input schema definition is for type checking the variables available *within* the prompt template itself.
    const {output} = await analyzeCustomerWebsitePrompt({
      url: input.url, // Pass original URL if needed by prompt, though current prompt doesn't use it directly
      websiteContent: websiteContent, 
    });
    return output!;
  }
);
