import { githubUseCase } from '$/domain/app/useCase/githubUseCase';
import { GITHUB_WEBHOOK_SECRET } from '$/service/envValues';
import { createHmac, timingSafeEqual } from 'crypto';
import { defineController } from './$relay';
import type { GHWebhookBody, ReqHeaders } from './validator';
import { headersValidator } from './validator';

// ref: https://docs.github.com/ja/webhooks/using-webhooks/validating-webhook-deliveries#typescript-example
const verifySignature = (headers: ReqHeaders, body: GHWebhookBody) => {
  const signature = createHmac('sha256', GITHUB_WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');
  const trusted = Buffer.from(`sha256=${signature}`, 'ascii');
  const untrusted = Buffer.from(headers['x-hub-signature-256'], 'ascii');

  return timingSafeEqual(trusted, untrusted);
};

export default defineController(() => ({
  post: {
    validators: { headers: headersValidator },
    handler: async ({ headers, body }) => {
      if (!verifySignature(headers, body)) return { status: 401 };

      await githubUseCase.updateByWebhook(body);

      return { status: 200 };
    },
  },
}));
