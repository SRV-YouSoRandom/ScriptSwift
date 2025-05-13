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

export default function ScriptSwiftPage() {
  const [scriptTurns, setScriptTurns] = useState<DisplayableTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [formInputs, setFormInputs] = useState<GenerateScriptInput | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleInitialScriptGenerated = (initialTurn: ScriptTurn, inputs: GenerateScriptInput) => {
    setScriptTurns([{
      salespersonUtterance: initialTurn.salespersonUtterance,
      prospectResponseOptions: initialTurn.prospectResponseOptions,
      // chosenProspectResponse will be set when user clicks a button
    }]);
    setFormInputs(inputs); // Save form inputs for subsequent calls
    setIsLoading(false);
  };

  const handleGenerationStart = () => {
    setIsLoading(true);
    setScriptTurns([]); 
    setFormInputs(null);
  };
  
  const handleGenerationEnd = () => { // This might be called after initial or next turn
    // setIsLoading(false); //isLoading is managed more granularly now
  };

  const handleClearScript = () => {
    setScriptTurns([]);
    setFormInputs(null);
  };

  const handleProspectResponseSelected = async (turnIndex: number, selectedResponse: ProspectResponseOption) => {
    if (!formInputs || scriptTurns.length === 0) {
      toast({ title: "Error", description: "Cannot proceed without initial script and form data.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    // Update the current turn with the chosen response
    const updatedTurns = scriptTurns.map((turn, index) => 
      index === turnIndex ? { ...turn, chosenProspectResponse: selectedResponse, prospectResponseOptions: [] } : turn // Clear options for past turn
    );
    setScriptTurns(updatedTurns);

    // Prepare history for the AI
    const historyForAI = updatedTurns
      .filter(turn => turn.chosenProspectResponse) // Only include turns where prospect has responded
      .map(turn => ({
        salespersonUtterance: turn.salespersonUtterance,
        prospectResponseOptions: turn.prospectResponseOptions || [], // Should be empty for history items if cleared above
        chosenProspectResponse: turn.chosenProspectResponse!, // Non-null assertion as we filtered
      }));
      

    try {
      const result = await handleGenerateNextTurnAction(formInputs, historyForAI, selectedResponse);
      if (result.success && result.nextScriptTurn) {
        setScriptTurns(prevTurns => [...prevTurns, {
            salespersonUtterance: result.nextScriptTurn.salespersonUtterance,
            prospectResponseOptions: result.nextScriptTurn.prospectResponseOptions,
        }]);
      } else {
        toast({ title: "Next Turn Generation Failed", description: result.error || "Could not generate the next part of the script.", variant: "destructive" });
        // Optionally revert the UI to allow re-trying or show an error message prominently
        // For now, we leave the chosen response and user has to clear or try again.
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
        {!formInputs && ( // Only show form if no script is active
           <ScriptSwiftForm 
            onScriptGenerated={handleInitialScriptGenerated}
            onGenerationStart={handleGenerationStart}
            onGenerationEnd={handleGenerationEnd} // May not be needed here if loading is granular
          />
        )}
       

        {scriptTurns.length > 0 && (
          <>
            <Separator className="my-8" />
            <ScriptDisplay 
              turns={scriptTurns} 
              onClear={handleClearScript}
              onProspectResponseSelected={handleProspectResponseSelected}
              isLoadingNextTurn={isLoading} // Pass loading state for next turn
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
