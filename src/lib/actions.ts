"use server";

import type { z } from "zod";
import { analyzeCustomerWebsite } from "@/ai/flows/analyze-customer-website";
import { generateColdCallScript } from "@/ai/flows/generate-cold-call-script";
import type { GenerateScriptInput } from "@/lib/schemas"; // Import type from new schemas file

export async function handleGenerateScriptAction(values: GenerateScriptInput) {
  try {
    let customerContext = "";

    if (values.customerInfo.type === "url" && values.customerInfo.url) {
      const analysisResult = await analyzeCustomerWebsite({ url: values.customerInfo.url });
      customerContext = analysisResult.summary;
    } else if (values.customerInfo.type === "text" && values.customerInfo.text) {
      customerContext = values.customerInfo.text;
    } else {
      throw new Error("Invalid customer information provided.");
    }

    const businessContext = `Business Name: ${values.businessInfo.businessName}\nProduct/Service: ${values.businessInfo.productService}\nSales Goals: ${values.businessInfo.salesGoals}`;

    const scriptResult = await generateColdCallScript({
      businessInfo: businessContext,
      customerInfo: customerContext,
    });

    return { success: true, script: scriptResult.script };
  } catch (error) {
    console.error("Error generating script:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while generating the script.";
    return { success: false, error: errorMessage };
  }
}
