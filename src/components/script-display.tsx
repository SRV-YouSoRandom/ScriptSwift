"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCopy, Download, Edit3, Check } from "lucide-react";

interface ScriptDisplayProps {
  script: string;
  onClear?: () => void;
}

export const ScriptDisplay: FC<ScriptDisplayProps> = ({ script, onClear }) => {
  const { toast } = useToast();
  const [editedScript, setEditedScript] = useState(script);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditedScript(script);
    setIsEditing(false); // Reset editing state when new script is passed
  }, [script]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedScript)
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
    const blob = new Blob([editedScript], { type: "text/plain;charset=utf-8" });
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
  
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Generated Sales Script</CardTitle>
        <Button variant="ghost" size="icon" onClick={toggleEdit} aria-label={isEditing ? "Save Script" : "Edit Script"}>
          {isEditing ? <Check className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
        </Button>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={editedScript}
            onChange={(e) => setEditedScript(e.target.value)}
            className="min-h-[200px] md:min-h-[300px] text-base leading-relaxed"
            aria-label="Editable sales script"
          />
        ) : (
          <ScrollArea className="h-[200px] md:h-[300px] rounded-md border p-4">
            <pre className="whitespace-pre-wrap text-sm md:text-base leading-relaxed font-sans">
              {editedScript}
            </pre>
          </ScrollArea>
        )}
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
