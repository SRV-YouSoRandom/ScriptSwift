"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCopy, Download } from "lucide-react";
import type { GenerateColdCallScriptOutput } from "@/ai/flows/generate-cold-call-script";

interface ScriptDisplayProps {
  script: GenerateColdCallScriptOutput;
  onClear?: () => void;
}

function formatScriptForDisplay(script: GenerateColdCallScriptOutput): string {
  let formatted = `## Opening\n${script.opening}\n\n`;
  formatted += `## Value Proposition\n${script.valueProposition}\n\n`;
  formatted += `## Engagement Question\n${script.engagementQuestion}\n\n`;
  formatted += `## Call to Action\n${script.callToAction}\n\n`;

  if (script.adaptivePhrases) {
    formatted += `## Adaptive Phrases\n`;
    formatted += `### If Prospect is Positive:\n${script.adaptivePhrases.positiveCueResponse}\n\n`;
    formatted += `### If Prospect is Neutral/Busy:\n${script.adaptivePhrases.neutralOrBusyResponse}\n\n`;
  }

  if (script.objectionHandlingTips && script.objectionHandlingTips.length > 0) {
    formatted += `## Objection Handling Tips\n`;
    script.objectionHandlingTips.forEach(tip => {
      formatted += `### Objection: ${tip.objection}\nResponse: ${tip.response}\n\n`;
    });
  }
  return formatted.trim();
}


export const ScriptDisplay: FC<ScriptDisplayProps> = ({ script, onClear }) => {
  const { toast } = useToast();
  const [displayableScript, setDisplayableScript] = useState("");

  useEffect(() => {
    if (script) {
      setDisplayableScript(formatScriptForDisplay(script));
    }
  }, [script]);

  const handleCopy = () => {
    navigator.clipboard.writeText(displayableScript)
      .then(() => {
        toast({
          title: "Copied to clipboard!",
          description: "The script has been copied successfully.",
        });
      })
      .catch(err => {
        console.error("Failed to copy script: ", err);
        toast({
          title: "Copy failed",
          description: "Could not copy script to clipboard.",
          variant: "destructive",
        });
      });
  };

  const handleDownload = () => {
    const blob = new Blob([displayableScript], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sales_script.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({
      title: "Download started",
      description: "The script is being downloaded as sales_script.txt.",
    });
  };
  
  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Generated Sales Script</CardTitle>
        {/* Edit button removed for simplicity with structured script */}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] md:h-[400px] rounded-md border p-4 bg-secondary/30">
          <pre className="whitespace-pre-wrap text-sm md:text-base leading-relaxed font-sans">
            {displayableScript.split('\n').map((line, index) => {
              if (line.startsWith('## ') && !line.startsWith('### ')) {
                return <strong key={index} className="block mt-3 mb-1 text-lg text-primary">{line.substring(3)}</strong>;
              }
              if (line.startsWith('### ')) {
                return <strong key={index} className="block mt-2 mb-0.5 text-md text-foreground/80">{line.substring(4)}</strong>;
              }
              return <span key={index} className="block">{line}</span>;
            })}
          </pre>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
        {onClear && (
          <Button variant="outline" onClick={onClear} className="w-full sm:w-auto">
            Clear & New
          </Button>
        )}
        <Button onClick={handleCopy} className="w-full sm:w-auto">
          <ClipboardCopy className="mr-2 h-4 w-4" /> Copy Script
        </Button>
        <Button onClick={handleDownload} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" /> Download Script
        </Button>
      </CardFooter>
    </Card>
  );
};
