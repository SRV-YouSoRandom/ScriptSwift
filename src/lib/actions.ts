"use server";

import type { z } from "zod";
import { analyzeCustomerWebsite } from "@/ai/flows/analyze-customer-website";
import { generateColdCallScript, type GenerateColdCallScriptOutput } from "@/ai/flows/generate-cold-call-script";
import type { GenerateScriptInput } from "@/lib/schemas";

export async function handleGenerateScriptAction(values: GenerateScriptInput): Promise<{ success: true, script: GenerateColdCallScriptOutput } | { success: false, error: string }> {
  try {
    let customerContext = "";
    let customerCompanyName: string | undefined = undefined;

    if (values.customerInfo.type === "url" && values.customerInfo.url) {
      const analysisResult = await analyzeCustomerWebsite({ url: values.customerInfo.url });
      // Assuming analysisResult.summary also contains or implies company name.
      // For now, we'll rely on the user possibly entering it in the text summary if not via URL.
      // The prompt for website analysis could be enhanced to extract company name explicitly if needed.
      customerContext = analysisResult.summary;
      // Placeholder: if analysisResult could provide company name directly, assign it here.
      // e.g. customerCompanyName = analysisResult.companyName; 
    } else if (values.customerInfo.type === "text" && values.customerInfo.text) {
      customerContext = values.customerInfo.text;
      // Attempt to infer company name if text contains "Company: XYZ" or similar.
      // This is a simple heuristic and might need refinement.
      const companyMatch = values.customerInfo.text.match(/Company Name:\s*(.*)/i) || values.customerInfo.text.match(/Business:\s*(.*)/i);
      if (companyMatch && companyMatch[1]) {
        customerCompanyName = companyMatch[1].trim();
      }
    } else {
      throw new Error("Invalid customer information: Neither URL nor text summary provided.");
    }

    const scriptResult = await generateColdCallScript({
      userName: values.businessInfo.userName,
      businessName: values.businessInfo.businessName,
      productService: values.businessInfo.productService,
      salesGoals: values.businessInfo.salesGoals,
      customerInfo: customerContext,
      customerCompanyName: customerCompanyName // Pass it to the script generator
    });

    return { success: true, script: scriptResult };
  } catch (error) {
    console.error("Error generating script:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while generating the script.";
    return { success: false, error: errorMessage };
  }
}
