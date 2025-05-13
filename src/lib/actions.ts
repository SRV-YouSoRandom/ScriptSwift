"use server";

import type { z } from "zod";
import { analyzeCustomerWebsite } from "@/ai/flows/analyze-customer-website";
import { generateColdCallScript } from "@/ai/flows/generate-cold-call-script";
import type { GenerateScriptInput } from "@/lib/schemas";

export async function handleGenerateScriptAction(values: GenerateScriptInput) {
  try {
    let customerContext = "";

    if (values.customerInfo.type === "url" && values.customerInfo.url) {
      const analysisResult = await analyzeCustomerWebsite({ url: values.customerInfo.url });
      customerContext = analysisResult.summary;
    } else if (values.customerInfo.type === "text" && values.customerInfo.text) {
      customerContext = values.customerInfo.text;
    } else {
      // This case should ideally be caught by Zod validation, but good to have a fallback.
      throw new Error("Invalid customer information: Neither URL nor text summary provided.");
    }

    const scriptResult = await generateColdCallScript({
      userName: values.businessInfo.userName,
      businessName: values.businessInfo.businessName,
      productService: values.businessInfo.productService,
      salesGoals: values.businessInfo.salesGoals,
      customerInfo: customerContext,
    });

    return { success: true, script: scriptResult.script };
  } catch (error) {
    console.error("Error generating script:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while generating the script.";
    return { success: false, error: errorMessage };
  }
}
