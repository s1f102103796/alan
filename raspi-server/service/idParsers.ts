import { z } from 'zod';

const createIdParser = <T extends string>() => z.string() as unknown as z.ZodType<T>;
