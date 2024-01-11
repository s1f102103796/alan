import type { InitAppModel, OgpImage } from '$/commonTypesWithClient/appModels';
import { toOgpImage } from '$/domain/app/query/utils';
import { openai } from '$/service/openai';
import { customAssert } from '$/service/returnStatus';
import { putImageToS3 } from '$/service/s3Client';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { z } from 'zod';
import { invokeOrThrow } from './llmRepo/invokeOrThrow';

export const ogpImageRepo = {
  create: async (app: InitAppModel): Promise<OgpImage> => {
    const validator = z.object({ prompt: z.string() });
    const { prompt } = await invokeOrThrow(
      app,
      `${app.similarName}によく似たウェブサービスを開発しています。
DALL-E 3でOGP画像を生成するためのプロンプトを日本語で作成してください。
サービス名「${app.name}」を中央にテキスト表示する指示を含めてください。
ダウンロード後にアスペクト比2:1にトリミングするので、要素を画像の上下中央部にまとめる指示も含めてください。`,
      validator,
      []
    );
    const {
      data: [image],
    } = await openai.images.generate({ model: 'dall-e-3', prompt, size: '1024x1024' });
    customAssert(image?.url, 'エラーならロジック修正必須');

    const arrayBuffer = await fetch(image.url).then((e) => e.arrayBuffer());
    const canvas = createCanvas(1024, 512);
    const ctx = canvas.getContext('2d');
    await loadImage(arrayBuffer).then((image) =>
      ctx.drawImage(image, 0, 256, 1024, 512, 0, 0, 1024, 512)
    );
    const buffer = canvas.toBuffer('image/webp');
    const imageName = `${Date.now()}.webp`;
    const ogpImage = toOgpImage(app.index, imageName, prompt);
    await putImageToS3(ogpImage.s3Key, buffer);

    return ogpImage;
  },
};
