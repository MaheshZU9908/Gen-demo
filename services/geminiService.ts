import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Attachment } from "../types";

class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;
  private modelId: string = "gemini-2.5-flash";

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public startChat() {
    this.chatSession = this.ai.chats.create({
      model: this.modelId,
      config: {
        systemInstruction: "You are a helpful, intelligent AI assistant. Keep responses concise and conversational unless asked for detailed explanations.",
      },
    });
  }

  public async *sendMessageStream(message: string, attachments: Attachment[] = []) {
    if (!this.chatSession) {
      this.startChat();
    }

    if (!this.chatSession) {
      throw new Error("Failed to initialize chat session");
    }

    try {
      // Construct the message payload. 
      // If there are attachments, we must send an array of parts.
      let messagePayload: string | Array<any> = message;

      if (attachments.length > 0) {
        messagePayload = [
          { text: message || " " }, // Ensure there is some text part if message is empty
          ...attachments.map(att => ({
            inlineData: {
              mimeType: att.mimeType,
              data: att.base64
            }
          }))
        ];
      }

      const resultStream = await this.chatSession.sendMessageStream({ message: messagePayload });

      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          yield c.text;
        }
      }
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();