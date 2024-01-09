import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { S3_ACCESS_KEY, S3_BUCKET, S3_ENDPOINT, S3_REGION, S3_SECRET_KEY } from './envValues';

const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  forcePathStyle: true,
  credentials: { accessKeyId: S3_ACCESS_KEY, secretAccessKey: S3_SECRET_KEY },
});

export const putTextToS3 = (Key: string, Body: string) =>
  s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key,
      Body,
      ContentType: Key.split('.').at(-1) === 'json' ? 'application/json' : 'text/plain',
    })
  );
