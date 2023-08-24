/*
import { ConversationChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { memoryA } from "/Users/iniad/Documents/TS/alphasample/HumanA/memoryA"; 
import { memoryB } from "/Users/iniad/Documents/TS/alphasample/HumanB/memoryB"; 
import axios from "axios";

require("dotenv").config();

export const run = async () => {
    // LLMの準備
    const llm = new OpenAI({ temperature: 0 });
  
    // ConversationChainの準備
    const chain = new ConversationChain({ llm: llm });

    // 会話の実行
    const input1 = `${memoryA.res3}で求めた収支と${memoryB.res3}で求めた収支を合わせて合計の収支を求めてください`; 
    const res1 = await chain.call({ input: input1 });
    console.log("total:", res1["response"]);
};
*/