"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCopy, Download, MessageSquare, User, CornerDownRight, Loader2 } from "lucide-react";
import type { ScriptTurn, ProspectResponseOption } from "@/ai/flows/generate-cold-call-script";

export interface DisplayableTurn extends Partial<ScriptTurn> {
  salespersonUtterance: string;
  prospectResponseOptions?: ProspectResponseOption[];
  chosenProspectResponse?: ProspectResponseOption;
}

interface ScriptDisplayProps {
  turns: DisplayableTurn[];
  onClear?: () => void;
  onProspectResponseSelected: (turnIndex: number, selectedResponse: ProspectResponseOption) => void;
  isLoadingNextTurn: boolean;
}

function formatConversationForText(turns: DisplayableTurn[]): string {
  let formatted = "Sales Script Conversation:\n\n";
  turns.forEach((turn, index) => {
    formatted += `Salesperson (Turn ${index + 1}):\n${turn.salespersonUtterance}\n\n`;
    if (turn.chosenProspectResponse) {
      formatted += `Prospect Responded:\n${turn.chosenProspectResponse.responseText} (Type: ${turn.chosenProspectResponse.responseType})\n\n`;
    } else if (index === turns.length - 1 && turn.prospectResponseOptions && turn.prospectResponseOptions.length > 0) {
      formatted += `Waiting for prospect response (options were: ${turn.prospectResponseOptions.map(o => o.responseText).join(', ')})...\n\n`;
    }
  });
  return formatted.trim();
}


export const ScriptDisplay: FC<ScriptDisplayProps> = ({ turns, onClear, onProspectResponseSelected, isLoadingNextTurn }) => {
  const { toast } = useToast();
  const [conversationText, setConversationText] = useState("");

  useEffect(() => {
    if (turns) {
      setConversationText(formatConversationForText(turns));
    }
  }, [turns]);

  const handleCopy = () => {
    navigator.clipboard.writeText(conversationText)
      .then(() => {
        toast({
          title: "Copied to clipboard!",
          description: "The conversation script has been copied.",
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
    const blob = new Blob([conversationText], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sales_script_conversation.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({
      title: "Download started",
      description: "The script is being downloaded as sales_script_conversation.txt.",
    });
  };
  
  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Sales Conversation</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] md:h-[400px] rounded-md border p-4 bg-secondary/30 space-y-4">
          {turns.map((turn, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-start gap-2">
                <User className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div className="bg-card p-3 rounded-lg shadow">
                  <p className="font-semibold text-sm text-primary-foreground bg-primary px-2 py-0.5 rounded-full inline-block mb-1">Salesperson</p>
                  <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">
                    {turn.salespersonUtterance}
                  </p>
                </div>
              </div>

              {turn.chosenProspectResponse && (
                <div className="flex items-start gap-2 pl-8">
                   <MessageSquare className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                   <div className="bg-accent/10 p-3 rounded-lg shadow">
                     <p className="font-semibold text-sm text-accent px-2 py-0.5 rounded-full inline-block mb-1">Prospect</p>
                     <p className="whitespace-pre-wrap text-sm md:text-base italic">
                        {turn.chosenProspectResponse.responseText}
                     </p>
                   </div>
                </div>
              )}

              {index === turns.length - 1 && !turn.chosenProspectResponse && turn.prospectResponseOptions && turn.prospectResponseOptions.length > 0 && (
                <div className="pl-8 mt-3 space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">How might the prospect respond?</p>
                  <div className="flex flex-wrap gap-2">
                    {turn.prospectResponseOptions.map((option, optionIndex) => (
                      <Button
                        key={optionIndex}
                        variant={
                          option.responseType === "positive" ? "default" : 
                          option.responseType === "negative_objection" ? "destructive" : "secondary"
                        }
                        size="sm"
                        onClick={() => onProspectResponseSelected(index, option)}
                        disabled={isLoadingNextTurn}
                        className="shadow-md"
                      >
                        {isLoadingNextTurn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <CornerDownRight className="mr-1 h-4 w-4" />
                        {option.responseText}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
               {index === turns.length - 1 && isLoadingNextTurn && (!turn.prospectResponseOptions || turn.prospectResponseOptions.length === 0) && (
                 <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Generating next part of script...</p>
                 </div>
               )}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
        {onClear && (
          <Button variant="outline" onClick={onClear} className="w-full sm:w-auto">
            Clear & New Script
          </Button>
        )}
        <Button onClick={handleCopy} className="w-full sm:w-auto" disabled={turns.length === 0}>
          <ClipboardCopy className="mr-2 h-4 w-4" /> Copy Conversation
        </Button>
        <Button onClick={handleDownload} className="w-full sm:w-auto" disabled={turns.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Download Conversation
        </Button>
      </CardFooter>
    </Card>
  );
};
