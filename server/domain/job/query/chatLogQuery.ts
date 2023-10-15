import type { ChatLogModel } from '$/commonTypesWithClient/models';
import { chatLogIdParser, claudeModelIdParser } from '$/service/idParsers';
import { customAssert } from '$/service/returnStatus';
import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import type { Prisma } from '@prisma/client';
import ndjson from 'ndjson';
import { Readable } from 'stream';
import { promisify } from 'util';
import { gunzip } from 'zlib';
import { z } from 'zod';

const s3Client = new S3Client({ region: 'us-east-1' });
const Bucket = 'tsukuyomi-bedrock-log';
const logParser = z
  .object({
    accountId: z.string(),
    modelId: z.string(),
    operation: z.string(),
    region: z.string(),
    requestId: z.string(),
    schemaType: z.string(),
    schemaVersion: z.string(),
    timestamp: z.string(),
  })
  .and(
    z
      .object({
        errorCode: z.undefined(),
        input: z.object({
          inputBodyJson: z.any(),
          inputContentType: z.string(),
          inputTokenCount: z.number(),
        }),
        output: z.object({
          outputBodyJson: z.any(),
          outputContentType: z.string(),
          outputTokenCount: z.number(),
        }),
      })
      .or(z.object({ errorCode: z.string() }))
  );

const getContentKeys = async (startAfter: string | undefined) => {
  const contentKeys: string[] = [];
  let isTruncated = true;
  let StartAfter = startAfter;

  while (isTruncated) {
    const command = new ListObjectsV2Command({ Bucket, StartAfter });
    const res = await s3Client.send(command);

    if (res.Contents === undefined) break;

    isTruncated = res.IsTruncated === true;
    StartAfter = res.Contents.at(-1)?.Key;
    contentKeys.push(
      ...res.Contents.map((c) => c.Key).flatMap((Key) =>
        Key?.endsWith('.json.gz') === true ? [Key] : []
      )
    );
  }

  return contentKeys;
};

const getLog = async (Key: string) => {
  const command = new GetObjectCommand({ Bucket, Key });

  const res = await s3Client.send(command);
  customAssert(res.Body, 'エラーならロジック修正必須', { Key });

  const data = await res.Body.transformToByteArray();
  const result = await promisify(gunzip)(data.buffer);
  let log: z.infer<typeof logParser>;

  return await new Promise<ChatLogModel>((resolve) => {
    new Readable({
      read() {
        this.push(Buffer.from(result).toString('utf-8'));
        this.push(null);
      },
    })
      .pipe(ndjson.parse())
      .on('data', (json) => {
        log = logParser.parse(json);
      })
      .on('end', () => {
        resolve(
          log.errorCode === undefined
            ? {
                id: chatLogIdParser.parse(log.requestId),
                status: 'success',
                timestamp: Date.now(),
                modelId: claudeModelIdParser.parse(log.modelId),
                s3: {
                  Key,
                  tokenCount: {
                    input: log.input.inputTokenCount,
                    output: log.output.outputTokenCount,
                  },
                },
              }
            : {
                id: chatLogIdParser.parse(log.requestId),
                status: 'failure',
                timestamp: Date.now(),
                modelId: claudeModelIdParser.parse(log.modelId),
                s3: { Key },
              }
        );
      });
  });
};

export const chatLogQuery = {
  fetchNewLogs: async (tx: Prisma.TransactionClient) => {
    const latest = await tx.chatLog.findFirst({ orderBy: { s3Key: 'desc' } });
    const contentKeys = await getContentKeys(latest?.s3Key ?? undefined);

    return await Promise.all(contentKeys.map(getLog));
  },
};
