"use server";

import { analyzeCustomerWebsite } from "@/ai/flows/analyze-customer-website";
import { generateColdCallScript, type ScriptTurn, type ProspectResponseOption } from "@/ai/flows/generate-cold-call-script";
import { generateNextScriptTurn, type GenerateNextScriptTurnInput } from "@/ai/flows/generate-next-script-turn";
import type { GenerateScriptInput } from "@/lib/schemas";

interface CompletedScriptTurnForAction extends ScriptTurn {
  chosenProspectResponse: ProspectResponseOption;
}

export async function handleGenerateScriptAction(values: GenerateScriptInput): Promise<{ success: true, scriptTurn: ScriptTurn } | { success: false, error: string }> {
  try {
    let customerContext = "";
    let customerCompanyName: string | undefined = undefined;

    if (values.customerInfo.type === "url" && values.customerInfo.url) {
      const analysisResult = await analyzeCustomerWebsite({ url: values.customerInfo.url });
      customerContext = analysisResult.summary;
      // Attempt to extract company name from summary if possible.
      // A more robust solution would be for analyzeCustomerWebsite to return it explicitly.
      const companyNameMatch = analysisResult.summary.match(/Company Name:\s*([^,\n]+)/i);
      if (companyNameMatch && companyNameMatch[1]) {
        customerCompanyName = companyNameMatch[1].trim();
      }

    } else if (values.customerInfo.type === "text" && values.customerInfo.text) {
      customerContext = values.customerInfo.text;
      const companyMatch = values.customerInfo.text.match(/Company Name:\s*([^,\n]+)/i) || values.customerInfo.text.match(/Business:\s*([^,\n]+)/i);
      if (companyMatch && companyMatch[1]) {
        customerCompanyName = companyMatch[1].trim();
      }
    } else {
      // This case should ideally be caught by form validation, but as a fallback:
      customerContext = "No specific customer details provided beyond general business info.";
    }

    const scriptTurn = await generateColdCallScript({
      userName: values.businessInfo.userName,
      businessName: values.businessInfo.businessName,
      productService: values.businessInfo.productService,
      salesGoals: values.businessInfo.salesGoals,
      customerInfo: customerContext,
      customerCompanyName: customerCompanyName 
    });

    return { success: true, scriptTurn };
  } catch (error) {
    console.error("Error generating initial script turn:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while generating the script.";
    return { success: false, error: errorMessage };
  }
}

export async function handleGenerateNextTurnAction(
  baseInputs: GenerateScriptInput,
  scriptHistory: CompletedScriptTurnForAction[],
  lastProspectResponse: ProspectResponseOption
): Promise<{ success: true, nextScriptTurn: ScriptTurn } | { success: false, error: string }> {
  try {
    let customerContext = "";
    let customerCompanyName: string | undefined = undefined;

     if (baseInputs.customerInfo.type === "url" && baseInputs.customerInfo.url) {
      // For next turns, we might not need to re-scrape, but pass existing summary.
      // If scriptHistory is empty, it implies this might be an error or first call after initial.
      // Assuming customerContext was established initially.
      // For simplicity, let's assume the initial analysis is sufficient context.
      // If re-analysis or different context is needed per turn, this logic would expand.
      const analysisResult = await analyzeCustomerWebsite({ url: baseInputs.customerInfo.url });
      customerContext = analysisResult.summary;
      const companyNameMatch = analysisResult.summary.match(/Company Name:\s*([^,\n]+)/i);
      if (companyNameMatch && companyNameMatch[1]) {
        customerCompanyName = companyNameMatch[1].trim();
      }
    } else if (baseInputs.customerInfo.type === "text" && baseInputs.customerInfo.text) {
      customerContext = baseInputs.customerInfo.text;
      const companyMatch = baseInputs.customerInfo.text.match(/Company Name:\s*([^,\n]+)/i) || baseInputs.customerInfo.text.match(/Business:\s*([^,\n]+)/i);
      if (companyMatch && companyMatch[1]) {
        customerCompanyName = companyMatch[1].trim();
      }
    } else {
       customerContext = "No specific customer details provided beyond general business info.";
    }


    const nextTurnInput: GenerateNextScriptTurnInput = {
      userName: baseInputs.businessInfo.userName,
      businessName: baseInputs.businessInfo.businessName,
      productService: baseInputs.businessInfo.productService,
      salesGoals: baseInputs.businessInfo.salesGoals,
      customerInfo: customerContext, 
      customerCompanyName: customerCompanyName,
      scriptHistory: scriptHistory,
      lastProspectResponse: lastProspectResponse,
    };

    const nextScriptTurn = await generateNextScriptTurn(nextTurnInput);
    return { success: true, nextScriptTurn };

  } catch (error) {
    console.error("Error generating next script turn:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while generating the next script turn.";
    return { success: false, error: errorMessage };
  }
}
