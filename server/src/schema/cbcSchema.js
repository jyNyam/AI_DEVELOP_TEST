// server/src/schema/cbcSchema.js

import { z } from "zod";

const RangeSchema = z.enum(["정상", "준임상", "임상"]).nullable();

const SemanticSchema = z.object({
  rawRange: z.string().nullable(),
  standardRange: RangeSchema,
  meaning: z.string().nullable(),
  clinicalNote: z.string().nullable(),
});

const ScaleItemSchema = z.object({
  tScore: z.number().nullable(),
  percentile: z.number().nullable(),
  range: RangeSchema,
  semantic: SemanticSchema,
});

export const CBCSchema = z.object({
  childName: z.string().nullable(),
  childAge: z.number().nullable(),
  childGender: z.string().nullable(),
  examDate: z.string().nullable(),
  scales: z.record(z.string(), ScaleItemSchema),
  broadband: z.object({
    internalizing: ScaleItemSchema,
    externalizing: ScaleItemSchema,
    total: ScaleItemSchema,
  }),
});