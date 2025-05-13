"use client";

import { useState, useEffect } from "react";
import { Logo } from "@/components/icons/logo";
import { ScriptSwiftForm } from "@/components/script-swift-form";
import { ScriptDisplay, type DisplayableTurn } from "@/components/script-display";
import { Separator } from "@/components/ui/separator";
import type { ScriptTurn, ProspectResponseOption } from "@/ai/flows/generate-cold-call-script";
import type { GenerateScriptInput } from "@/lib/schemas";
import { handleGenerateNextTurnAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

// Define a type for the processed inputs that will be stored
export interface ProcessedScriptInputs {
  businessInfo: GenerateScriptInput['businessInfo'];
  salesGoals: string; 
  customerContext: string;
  customerCompanyName?: string;
  originalCustomerInputType: 'url' | 'text';
  originalCustomerInputValue: string; 
}


export default function ScriptSwiftPage() {
  const [scriptTurns, setScriptTurns] = useState<DisplayableTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  // Changed formInputs to processedScriptInputs to store the processed context
  const [processedScriptInputs, setProcessedScriptInputs] = useState<ProcessedScriptInputs | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  // Updated signature to accept processed context and company name
  const handleInitialScriptGenerated = (
    initialTurn: ScriptTurn, 
    originalInputs: GenerateScriptInput,
    processedContext: string,
    processedCompanyName?: string
  ) => {
    setScriptTurns([{
      salespersonUtterance: initialTurn.salespersonUtterance,
      prospectResponseOptions: initialTurn.prospectResponseOptions,
    }]);
    // Store the processed information along with original inputs
    setProcessedScriptInputs({
      businessInfo: originalInputs.businessInfo,
      salesGoals: originalInputs.businessInfo.salesGoals,
      customerContext: processedContext,
      customerCompanyName: processedCompanyName,
      originalCustomerInputType: originalInputs.customerInfo.type,
      originalCustomerInputValue: originalInputs.customerInfo.type === 'url' ? originalInputs.customerInfo.url! : originalInputs.customerInfo.text!,
    });
    setIsLoading(false);
  };

  const handleGenerationStart = () => {
    setIsLoading(true);
    setScriptTurns([]); 
    setProcessedScriptInputs(null); // Clear processed inputs
  };
  
  const handleGenerationEnd = () => {
    // setIsLoading(false); // isLoading is managed more granularly
  };

  const handleClearScript = () => {
    setScriptTurns([]);
    setProcessedScriptInputs(null); // Clear processed inputs
  };

  const handleProspectResponseSelected = async (turnIndex: number, selectedResponse: ProspectResponseOption) => {
    // Check against processedScriptInputs
    if (!processedScriptInputs || scriptTurns.length === 0) {
      toast({ title: "Error", description: "Cannot proceed without initial script and form data.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const updatedTurns = scriptTurns.map((turn, index) => 
      index === turnIndex ? { ...turn, chosenProspectResponse: selectedResponse, prospectResponseOptions: [] } : turn
    );
    setScriptTurns(updatedTurns);

    const historyForAI = updatedTurns
      .filter(turn => turn.chosenProspectResponse) 
      .map(turn => ({
        salespersonUtterance: turn.salespersonUtterance,
        prospectResponseOptions: [], // Per schema for completed turns
        chosenProspectResponse: turn.chosenProspectResponse!, 
      }));
      

    try {
      // Pass processedScriptInputs to the action
      const result = await handleGenerateNextTurnAction(processedScriptInputs, historyForAI, selectedResponse);
      if (result.success && result.nextScriptTurn) {
        setScriptTurns(prevTurns => [...prevTurns, {
            salespersonUtterance: result.nextScriptTurn.salespersonUtterance,
            prospectResponseOptions: result.nextScriptTurn.prospectResponseOptions,
        }]);
      } else {
        toast({ title: "Next Turn Generation Failed", description: result.error || "Could not generate the next part of the script.", variant: "destructive" });
      }
    } catch (e) {
      const errMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      toast({ title: "Error", description: errMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <Logo className="justify-center" />
        <p className="mt-2 text-lg text-muted-foreground">
          Your AI-powered assistant for crafting compelling sales scripts, turn by turn.
        </p>
      </header>

      <main className="w-full max-w-3xl space-y-10">
        {/* Show form if no processed inputs (meaning no active script) */}
        {!processedScriptInputs && (
           <ScriptSwiftForm 
            onScriptGenerated={handleInitialScriptGenerated}
            onGenerationStart={handleGenerationStart}
            onGenerationEnd={handleGenerationEnd}
          />
        )}
       

        {scriptTurns.length > 0 && (
          <>
            <Separator className="my-8" />
            <ScriptDisplay 
              turns={scriptTurns} 
              onClear={handleClearScript}
              onProspectResponseSelected={handleProspectResponseSelected}
              isLoadingNextTurn={isLoading} 
            />
          </>
        )}
      </main>

      <footer className="mt-16 text-center text-muted-foreground text-sm">
        {currentYear !== null ? (
          <p>&copy; {currentYear} ScriptSwift. All rights reserved.</p>
        ) : (
          <p>&copy; ScriptSwift. All rights reserved.</p>
        )}
        <p>Powered by AI magic.</p>
      </footer>
    </div>
  );
}

