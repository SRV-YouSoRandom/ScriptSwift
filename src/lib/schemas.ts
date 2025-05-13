import { z } from "zod";

const BusinessInfoSchema = z.object({
  userName: z.string().min(1, "Your name is required."),
  businessName: z.string().min(1, "Business name is required."),
  productService: z.string().min(1, "Product/Service description is required."),
  salesGoals: z.string().min(1, "Sales goals are required."),
});

const CustomerInfoSchema = z.object({
  type: z.enum(["url", "text"]),
  url: z.string().url("Invalid URL format.").optional(),
  text: z.string().optional(),
}).refine(data => {
  if (data.type === "url") {
    // Ensure URL is provided and not empty if type is URL
    return !!data.url && data.url.trim().length > 0;
  }
  if (data.type === "text") {
    // Ensure text is provided and not empty if type is text
    return !!data.text && data.text.trim().length > 0;
  }
  return false;
}, {
  // This message might be too generic if individual fields also have messages.
  // Consider if more specific error messages are needed or if this covers the case where
  // neither URL nor text is provided despite a type being selected.
  message: "Please provide a valid URL if 'Website URL' is selected, or a summary if 'Text Summary' is selected.",
  path: ["type"], // Apply error to the 'type' field or a more general path
});


export const GenerateScriptFormSchema = z.object({
  businessInfo: BusinessInfoSchema,
  customerInfo: CustomerInfoSchema,
});

export type GenerateScriptInput = z.infer<typeof GenerateScriptFormSchema>;
