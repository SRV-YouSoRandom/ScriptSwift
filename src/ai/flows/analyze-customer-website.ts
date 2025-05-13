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
  summary: z.string().describe('A summary of the customer website content.'),
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
  input: {schema: AnalyzeCustomerWebsiteInputSchema},
  output: {schema: AnalyzeCustomerWebsiteOutputSchema},
  prompt: `You are an expert marketing analyst.

  Analyze the following website content and provide a summary of the customer's business, target audience, and key value propositions.

  Website content: {{{websiteContent}}}
  `,
});

const analyzeCustomerWebsiteFlow = ai.defineFlow(
  {
    name: 'analyzeCustomerWebsiteFlow',
    inputSchema: AnalyzeCustomerWebsiteInputSchema,
    outputSchema: AnalyzeCustomerWebsiteOutputSchema,
  },
  async input => {
    const websiteContent = await extractWebsiteContent(input.url);
    const {output} = await analyzeCustomerWebsitePrompt({
      ...input,
      websiteContent,
    });
    return output!;
  }
);
