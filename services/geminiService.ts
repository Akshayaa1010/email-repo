import { GoogleGenAI } from "@google/genai";
import { UserRole, ChatMessage, ChartData } from '../types';
import { SYSTEM_INSTRUCTIONS } from '../constants';
import { groundwaterData } from '../data/groundwaterData';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface BotResponse {
    text: string;
    chartData?: ChartData;
}

export const generateResponse = async (
    prompt: string,
    history: ChatMessage[],
    role: UserRole,
    language: string
): Promise<BotResponse> => {
    try {
        const model = 'gemini-2.5-flash';

        const systemInstruction = `
${SYSTEM_INSTRUCTIONS[role]}

---
Here is the complete groundwater dataset you MUST use as the source of truth for all your answers. Do not use any other information.
${groundwaterData}
---
        `;
        
        const contents = history.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const userPrompt = `Based ONLY on the provided data, please answer the following question in the ${language} language.
Question: ${prompt}`;

        contents.push({ role: 'user', parts: [{ text: userPrompt }] });

        let responseText = '';
        let chartData: ChartData | undefined = undefined;

        const response = await ai.models.generateContent({
            model,
            contents,
            config: {
                systemInstruction
            }
        });

        if (role === UserRole.RESEARCHER) {
            const rawResponse = response.text || '';
            const separator = '|||---|||';
            const parts = rawResponse.split(separator);

            if (parts.length > 1 && parts[0].trim().startsWith('{')) {
                const jsonPart = parts[0].trim();
                const textPart = parts.slice(1).join(separator).trim();
                
                try {
                    const parsedJson = JSON.parse(jsonPart);
                    chartData = parsedJson;
                    responseText = textPart || parsedJson.explanation || "Chart generated successfully.";
                } catch (e) {
                    console.error("Failed to parse JSON part of researcher response:", e);
                    responseText = "I tried to generate a visualization, but encountered an issue with the data format. Here is the text analysis instead:\n\n" + (textPart || rawResponse);
                }
            } else {
                // No separator found, or the first part wasn't JSON. Assume it's a text-only response.
                responseText = rawResponse;
            }
        } else {
            responseText = response.text;
        }

        return { text: responseText, chartData };

    } catch (error) {
        console.error("Error generating response from Gemini API:", error);
        return { text: "I'm sorry, I encountered an error while processing your request. Please try again." };
    }
};