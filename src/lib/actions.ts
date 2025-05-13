"use server";

import { z } from "zod";
import { analyzeCustomerWebsite } from "@/ai/flows/analyze-customer-website";
import { generateColdCallScript } from "@/ai/flows/generate-cold-call-script";

const BusinessInfoSchema = z.object({
  businessName: z.string().min(1, "Business name is required."),
  productService: z.string().min(1, "Product/Service description is required."),
  salesGoals: z.string().min(1, "Sales goals are required."),
});

const CustomerInfoSchema = z.object({
  type: z.enum(["url", "text"]),
  url: z.string().url("Invalid URL format.").optional(),
  text: z.string().optional(),
}).refine(data => {
  if (data.type === "url") return !!data.url;
  if (data.type === "text") return !!data.text && data.text.length > 0;
  return false;
}, {
  message: "Please provide either a URL or a text summary for customer information.",
  path: ["customerInfo"], // General path, specific error can be shown in form
});

export const GenerateScriptFormSchema = z.object({
  businessInfo: BusinessInfoSchema,
  customerInfo: CustomerInfoSchema,
});

export type GenerateScriptInput = z.infer<typeof GenerateScriptFormSchema>;

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
