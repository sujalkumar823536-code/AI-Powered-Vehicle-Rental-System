import api from "./axiosInstance";

// Sends a question to the RAG / LangChain endpoint
export const askAssistant = (message, history = []) =>
  api.post("/chat", { message, history });
