"use server";

import { analyzeCustomerWebsite, type AnalyzeCustomerWebsiteOutput } from "@/ai/flows/analyze-customer-website";
import { generateColdCallScript, type ScriptTurn, type ProspectResponseOption } from "@/ai/flows/generate-cold-call-script";
import { generateNextScriptTurn, type GenerateNextScriptTurnInput } from "@/ai/flows/generate-next-script-turn";
import type { GenerateScriptInput } from "@/lib/schemas";
import type { ProcessedScriptInputs } from "@/app/page"; // Import the type from page.tsx or a shared types file

interface CompletedScriptTurnForAction extends ScriptTurn {
  chosenProspectResponse: ProspectResponseOption;
}

export async function handleGenerateScriptAction(values: GenerateScriptInput): Promise<{ 
  success: true, 
  scriptTurn: ScriptTurn, 
  customerContext: string, 
  customerCompanyName?: string 
} | { 
  success: false, 
  error: string 
}> {
  try {
    let customerContext = "";
    let customerCompanyName: string | undefined = undefined;

    if (values.customerInfo.type === "url" && values.customerInfo.url) {
      const analysisResult: AnalyzeCustomerWebsiteOutput = await analyzeCustomerWebsite({ url: values.customerInfo.url });
      customerContext = analysisResult.summary;
      customerCompanyName = analysisResult.companyName;
    } else if (values.customerInfo.type === "text" && values.customerInfo.text) {
      customerContext = values.customerInfo.text;
      const companyMatch = values.customerInfo.text.match(/(?:Company Name|Business Name|Company|Business):\s*([^,\n;]+)/i);
      if (companyMatch && companyMatch[1]) {
        customerCompanyName = companyMatch[1].trim();
      } else {
        const lines = values.customerInfo.text.split('\n');
        if (lines.length > 0) {
            const firstLineCandidate = lines[0].trim();
            if (firstLineCandidate.length > 0 && firstLineCandidate.length < 70 && !firstLineCandidate.includes('.') && !firstLineCandidate.toLowerCase().startsWith('http') && !firstLineCandidate.toLowerCase().includes('services')) {
                customerCompanyName = firstLineCandidate;
            }
        }
      }
    } else {
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

    return { success: true, scriptTurn, customerContext, customerCompanyName };
  } catch (error) {
    console.error("Error generating initial script turn:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while generating the script.";
    return { success: false, error: errorMessage };
  }
}

export async function handleGenerateNextTurnAction(
  processedInputs: ProcessedScriptInputs, // Changed from GenerateScriptInput
  scriptHistory: CompletedScriptTurnForAction[],
  lastProspectResponse: ProspectResponseOption
): Promise<{ success: true, nextScriptTurn: ScriptTurn } | { success: false, error: string }> {
  try {
    // Use pre-processed customer context and company name
    const customerContext = processedInputs.customerContext;
    const customerCompanyName = processedInputs.customerCompanyName;

    const nextTurnInput: GenerateNextScriptTurnInput = {
      userName: processedInputs.businessInfo.userName,
      businessName: processedInputs.businessInfo.businessName,
      productService: processedInputs.businessInfo.productService,
      salesGoals: processedInputs.salesGoals,
      customerInfo: customerContext, 
      customerCompanyName: customerCompanyName,
      scriptHistory: scriptHistory.map(turn => ({ // Ensure history matches schema
        salespersonUtterance: turn.salespersonUtterance,
        // Ensure prospectResponseOptions is an empty array for history items as per CompletedScriptTurnSchema
        prospectResponseOptions: [], 
        chosenProspectResponse: turn.chosenProspectResponse,
      })),
      lastProspectResponse: lastProspectResponse,
    };

    const nextScriptTurn = await generateNextScriptTurn(nextTurnInput);
    return { success: true, nextScriptTurn };

  } catch (error)
 {
    console.error("Error generating next script turn:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while generating the next script turn.";
    return { success: false, error: errorMessage };
  }
}

