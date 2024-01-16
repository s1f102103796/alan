import { ghConclusionParser, ghStatusParser } from '$/commonTypesWithClient/bubbleModels';
import { ghStepIdParser } from '$/commonTypesWithClient/idParsers';
import { z } from 'zod';

export const GH_STEP_TYPES = ['migrate', 'generate', 'lint', 'typecheck', 'test'] as const;

const ghStepParser = z.object({
  id: ghStepIdParser,
  type: z.enum(GH_STEP_TYPES),
  status: ghStatusParser,
  conclusion: ghConclusionParser,
  log: z.string(),
  createdTime: z.number(),
  updatedTime: z.number(),
});

export type GHStepModel = z.infer<typeof ghStepParser>;

export const parseGHStep = (val: GHStepModel) => ghStepParser.parse(val);
