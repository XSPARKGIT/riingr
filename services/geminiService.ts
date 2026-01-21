
import { GoogleGenAI, Type } from "@google/genai";
import type { Message } from '../types';

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeminiResponse = async (messages: Message[]): Promise<{ text: string; sources?: any[] }> => {
    const ai = getAI();
    const contents = messages
        .filter(msg => !msg.isSystem && msg.text)
        .map(msg => ({
            role: msg.senderId === 'me' ? 'user' : 'model',
            parts: [{ text: msg.text! }],
        }));

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: contents,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });
        const text = response.text || "I'm sorry, I couldn't generate a response.";
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        return { text, sources };
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
};

/**
 * AI Smart Replies: Generates 3 contextual response suggestions
 */
export const getSmartReplies = async (messages: Message[]): Promise<string[]> => {
    const ai = getAI();
    const lastFewMessages = messages.filter(m => m.text).slice(-5);
    const context = lastFewMessages.map(m => `${m.senderId === 'me' ? 'User' : 'Contact'}: ${m.text}`).join('\n');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Based on this conversation context, provide exactly 3 short, natural, friendly one-sentence reply suggestions that the 'User' could send next. Return them as a JSON array of strings. \n\nContext:\n${context}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("Smart replies error:", e);
        return [];
    }
};

/**
 * AI Smart Summary: Summarizes recent messages in 3 bullets
 */
export const summarizeConversation = async (messages: Message[]): Promise<string> => {
    const ai = getAI();
    const textContent = messages.filter(m => m.text).slice(-20).map(m => `${m.senderId}: ${m.text}`).join('\n');
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Summarize the following chat messages into exactly 3 concise bullet points focusing on the main topics or decisions. Use emojis where appropriate. \n\nMessages:\n${textContent}`,
        });
        return response.text || "No summary available.";
    } catch (e) {
        console.error("Summarization error:", e);
        return "Failed to generate summary.";
    }
};

/**
 * AI Translation: Translates a specific text
 */
export const translateText = async (text: string, targetLang: string = "English"): Promise<string> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate the following text to ${targetLang}. Return only the translated text, no explanation.\n\nText: ${text}`,
        });
        return response.text?.trim() || text;
    } catch (e) {
        return text;
    }
};

export const generateImage = async (prompt: string): Promise<string> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image data found in response");
    } catch (error) {
        console.error("Error generating image:", error);
        throw error;
    }
};
