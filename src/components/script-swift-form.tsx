"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// import type { z } from "zod"; // Not needed if not using z.infer here
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label"; // Not directly used, FormLabel is used
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { handleGenerateScriptAction } from "@/lib/actions";
import { GenerateScriptFormSchema, type GenerateScriptInput } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import type { ScriptTurn } from "@/ai/flows/generate-cold-call-script";

interface ScriptSwiftFormProps {
  onScriptGenerated: (scriptTurn: ScriptTurn, inputs: GenerateScriptInput) => void;
  onGenerationStart: () => void;
  onGenerationEnd: () => void;
}

export function ScriptSwiftForm({ onScriptGenerated, onGenerationStart, onGenerationEnd }: ScriptSwiftFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<GenerateScriptInput>({
    resolver: zodResolver(GenerateScriptFormSchema),
    defaultValues: {
      businessInfo: {
        userName: "",
        businessName: "",
        productService: "",
        salesGoals: "",
      },
      customerInfo: {
        type: "url",
        url: "",
        text: "",
      },
    },
  });

  const customerInfoType = form.watch("customerInfo.type");

  async function onSubmit(values: GenerateScriptInput) {
    setIsLoading(true);
    setError(null);
    onGenerationStart();

    const submissionValues: GenerateScriptInput = {
      ...values,
      customerInfo: {
        type: values.customerInfo.type,
        url: values.customerInfo.type === 'url' ? values.customerInfo.url : undefined,
        text: values.customerInfo.type === 'text' ? values.customerInfo.text : undefined,
      }
    };
    

    try {
      const result = await handleGenerateScriptAction(submissionValues);
      if (result.success && result.scriptTurn) {
        onScriptGenerated(result.scriptTurn, submissionValues); // Pass submissionValues
        toast({
          title: "Script Started!",
          description: "Your initial sales script turn is ready.",
        });
      } else {
        setError(result.error || "Failed to generate script.");
        toast({
          title: "Generation Failed",
          description: result.error || "Could not generate script. Please check your inputs.",
          variant: "destructive",
        });
      }
    } catch (e) {
      const errMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errMessage);
      toast({
        title: "Error",
        description: errMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      onGenerationEnd();
    }
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle>Create Your Sales Script</CardTitle>
        <CardDescription>Tell us about your business and customer to generate the first part of your cold call script.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <section className="space-y-4 p-4 border rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Your Business</h3>
              <FormField
                control={form.control}
                name="businessInfo.userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name (Salesperson)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessInfo.businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessInfo.productService"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product/Service Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe what you're selling, e.g., 'Cloud-based CRM solutions'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessInfo.salesGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Goals</FormLabel>
                    <FormControl>
                      <Textarea placeholder="What are you trying to achieve with this call? e.g., 'Schedule a demo, identify needs'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="space-y-4 p-4 border rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-primary">Your Customer</h3>
              <Controller
                control={form.control}
                name="customerInfo.type"
                render={({ field }) => (
                    <Tabs
                        value={field.value}
                        onValueChange={(value) => {
                            field.onChange(value as "url" | "text");
                            if (value === "url") {
                                form.setValue("customerInfo.text", ""); // Clear text if URL is chosen
                                form.clearErrors("customerInfo.text"); 
                            } else {
                                form.setValue("customerInfo.url", ""); // Clear URL if text is chosen
                                form.clearErrors("customerInfo.url");
                            }
                            // form.clearErrors("customerInfo.type"); // May not be needed if refine handles it well
                        }}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="url">Website URL</TabsTrigger>
                        <TabsTrigger value="text">Text Summary</TabsTrigger>
                        </TabsList>
                        <TabsContent value="url" className="mt-4">
                        <FormField
                            control={form.control}
                            name="customerInfo.url"
                            render={({ field: urlField }) => (
                            <FormItem>
                                <FormLabel>Customer Website URL</FormLabel>
                                <FormControl>
                                <Input placeholder="https://customer-website.com" {...urlField} disabled={customerInfoType !== "url"} />
                                </FormControl>
                                 <FormMessage />
                            </FormItem>
                            )}
                        />
                        </TabsContent>
                        <TabsContent value="text" className="mt-4">
                        <FormField
                            control={form.control}
                            name="customerInfo.text"
                            render={({ field: textField }) => (
                            <FormItem>
                                <FormLabel>Customer Summary</FormLabel>
                                <FormControl>
                                <Textarea placeholder="Describe your target customer, their business, or their needs. Include company name if known (e.g., Company Name: XYZ Corp)." {...textField} disabled={customerInfoType !== "text"} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        </TabsContent>
                    </Tabs>
                )}
              />
              {/* Display general customerInfo error if present (from .refine()) */}
              {form.formState.errors.customerInfo?.message && !form.formState.errors.customerInfo?.url && !form.formState.errors.customerInfo?.text && (
                 <p className="text-sm font-medium text-destructive">{form.formState.errors.customerInfo.message}</p>
              )}
               {form.formState.errors.customerInfo?.type?.message && (
                 <p className="text-sm font-medium text-destructive">{form.formState.errors.customerInfo.type.message}</p>
              )}
            </section>
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Script...
                </>
              ) : (
                "Start Script"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
