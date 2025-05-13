"use client";

import { useState, useEffect } from "react";
import { Logo } from "@/components/icons/logo";
import { ScriptSwiftForm } from "@/components/script-swift-form";
import { ScriptDisplay } from "@/components/script-display";
import { Separator } from "@/components/ui/separator";

export default function ScriptSwiftPage() {
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [_isLoading, setIsLoading] = useState(false); // Renamed to avoid conflict if form has own loading
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    // Set current year on client-side after hydration
    setCurrentYear(new Date().getFullYear());
  }, []);


  const handleScriptGenerated = (script: string) => {
    setGeneratedScript(script);
    setIsLoading(false);
  };

  const handleGenerationStart = () => {
    setIsLoading(true);
    setGeneratedScript(null); // Clear previous script when starting new generation
  };
  
  const handleGenerationEnd = () => {
    setIsLoading(false);
  };

  const handleClearScript = () => {
    setGeneratedScript(null);
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <Logo className="justify-center" />
        <p className="mt-2 text-lg text-muted-foreground">
          Your AI-powered assistant for crafting compelling sales scripts.
        </p>
      </header>

      <main className="w-full max-w-3xl space-y-10">
        <ScriptSwiftForm 
          onScriptGenerated={handleScriptGenerated}
          onGenerationStart={handleGenerationStart}
          onGenerationEnd={handleGenerationEnd}
        />

        {generatedScript && (
          <>
            <Separator className="my-8" />
            <ScriptDisplay script={generatedScript} onClear={handleClearScript} />
          </>
        )}
      </main>

      <footer className="mt-16 text-center text-muted-foreground text-sm">
        {currentYear !== null ? (
          <p>&copy; {currentYear} ScriptSwift. All rights reserved.</p>
        ) : (
          // Fallback or placeholder during server render / before client-side effect
          <p>&copy; ScriptSwift. All rights reserved.</p>
        )}
        <p>Powered by AI magic.</p>
      </footer>
    </div>
  );
}
