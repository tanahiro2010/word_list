import { z } from "zod";

export const createDeckSchema = z.object({
  title: z.string().trim().min(1).max(100),
});

export const choiceSchema = z.object({
  text: z.string().trim().min(1).max(100),
  isCorrect: z.boolean(),
});

export const questionSchema = z
  .object({
    prompt: z.string().trim().min(1).max(300),
    choices: z.array(choiceSchema).min(2).max(6),
  })
  .refine((item) => item.choices.filter((choice) => choice.isCorrect).length === 1, {
    message: "正解は1つだけ選択してください。",
    path: ["choices"],
  });

export const publishDeckSchema = z.object({
  questions: z.array(questionSchema).min(1),
});

export type PublishDeckInput = z.infer<typeof publishDeckSchema>;
