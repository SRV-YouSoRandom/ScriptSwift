
import { z } from 'zod';

export const ProspectResponseOptionSchema = z.object({
  responseText: z.string().describe("A short, plausible response the prospect might give (e.g., 'Tell me more', 'Not interested', 'I'm busy'). This will be button text."),
  responseType: z.enum(["positive", "neutral", "negative_objection"]).describe("Categorize the prospect's likely sentiment or action if they choose this response. 'positive' means interest, 'neutral' can be inquiry or deferral, 'negative_objection' means disinterest or an objection."),
});

export const ScriptTurnSchema = z.object({
  salespersonUtterance: z.string().describe("What the salesperson should say for this turn of the conversation. Keep it concise, engaging, and human-like."),
  prospectResponseOptions: z.array(ProspectResponseOptionSchema).min(2).max(4).describe("2 to 4 distinct, likely responses the prospect might give to the salesperson's utterance. These will be presented as choices to the user to guide the next step of the script."),
});
