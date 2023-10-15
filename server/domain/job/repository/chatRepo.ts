import { CLAUDE_MODEL_IDS } from '$/commonConstantsWithClient';
import type { ChatLogModel } from '$/commonTypesWithClient/models';
import { chatLogIdParser } from '$/service/idParsers';
import { BedrockRuntime } from '@aws-sdk/client-bedrock-runtime';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';

const client = new BedrockRuntime({ region: 'us-east-1' });
const bodyParser = z.object({
  completion: z.string(),
  stop_reason: z.enum(['stop_sequence', 'max_tokens']),
});

export const chatRepo = {
  chat: async (prompt: string): Promise<{ output: string; log: ChatLogModel }> => {
    const modelId = CLAUDE_MODEL_IDS[0];
    const res = await client.invokeModel({
      modelId,
      body: JSON.stringify({
        prompt: `Human:
${prompt}

Assistant:`,
        max_tokens_to_sample: 100999,
        temperature: 1,
        top_k: 250,
        top_p: 0.999,
        stop_sequences: ['\\n\\nHuman:'],
        anthropic_version: 'bedrock-2023-05-31',
      }),
      accept: 'application/json',
      contentType: 'application/json',
    });

    const body = bodyParser.parse(JSON.parse(Buffer.from(res.body).toString('utf-8')));

    return {
      output: body.completion,
      log: {
        id: chatLogIdParser.parse(res.$metadata.requestId),
        status: 'loading',
        modelId,
        timestamp: Date.now(),
      },
    };
  },
  saveLog: async (tx: Prisma.TransactionClient, chatLog: ChatLogModel) => {
    await tx.chatLog.upsert({
      where: { id: chatLog.id },
      update: {
        status: chatLog.status,
        s3Key: chatLog.s3?.Key,
        inputTokenCount: chatLog.s3?.tokenCount?.input,
        outputTokenCount: chatLog.s3?.tokenCount?.output,
      },
      create: {
        id: chatLog.id,
        modelId: chatLog.modelId,
        status: chatLog.status,
        s3Key: chatLog.s3?.Key,
        inputTokenCount: chatLog.s3?.tokenCount?.input,
        outputTokenCount: chatLog.s3?.tokenCount?.output,
        createdAt: new Date(chatLog.timestamp),
      },
    });
  },
};
