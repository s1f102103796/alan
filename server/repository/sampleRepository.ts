import { config } from 'dotenv';
config();

import { ChatOpenAI } from 'langchain/chat_models/openai';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from 'langchain/prompts';
export const runTemplete = async (people: string) => {
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    SystemMessagePromptTemplate.fromTemplate('あなたは{role}です。'),
    HumanMessagePromptTemplate.fromTemplate('{input}に一発ギャグを考えて。'),
  ]);

  const chat = new ChatOpenAI({ temperature: 0 });
  const prompt = await chatPrompt.formatPromptValue({ role: 'ドラえもん', input: `${people}` });
  const messages = prompt.toChatMessages();

  const res = await chat.call(messages);
  console.log(res);
  return res;
};
