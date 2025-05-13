
"use server";

import { analyzeCustomerWebsite, type AnalyzeCustomerWebsiteOutput } from "@/ai/flows/analyze-customer-website";
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
      const analysisResult: AnalyzeCustomerWebsiteOutput = await analyzeCustomerWebsite({ url: values.customerInfo.url });
      customerContext = analysisResult.summary;
      customerCompanyName = analysisResult.companyName; // Directly use from the structured output
    } else if (values.customerInfo.type === "text" && values.customerInfo.text) {
      customerContext = values.customerInfo.text;
      // Try to extract company name from text if provided this way
      const companyMatch = values.customerInfo.text.match(/(?:Company Name|Business Name|Company|Business):\s*([^,\n;]+)/i);
      if (companyMatch && companyMatch[1]) {
        customerCompanyName = companyMatch[1].trim();
      } else {
        // Attempt a more general match if no explicit "Company Name:" prefix
        const lines = values.customerInfo.text.split('\n');
        if (lines.length > 0) {
            const firstLineCandidate = lines[0].trim();
            // Heuristic: assume first line is company name if it's short, not a full sentence, and not clearly something else.
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
      // Re-analyze or fetch stored analysis. For simplicity, let's re-analyze.
      // In a more complex app, you might store the initial analysis result.
      const analysisResult: AnalyzeCustomerWebsiteOutput = await analyzeCustomerWebsite({ url: baseInputs.customerInfo.url });
      customerContext = analysisResult.summary;
      customerCompanyName = analysisResult.companyName;
    } else if (baseInputs.customerInfo.type === "text" && baseInputs.customerInfo.text) {
      customerContext = baseInputs.customerInfo.text;
      const companyMatch = baseInputs.customerInfo.text.match(/(?:Company Name|Business Name|Company|Business):\s*([^,\n;]+)/i);
      if (companyMatch && companyMatch[1]) {
        customerCompanyName = companyMatch[1].trim();
      } else {
        const lines = baseInputs.customerInfo.text.split('\n');
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
