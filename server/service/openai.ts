import { OPENAI_KEY } from '$/service/envValues';
import OpenAI from 'openai';

export const openai = new OpenAI({ apiKey: OPENAI_KEY });
