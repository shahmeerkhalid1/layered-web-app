import { z } from "zod";
import { classPlanDurationMinutesStrSchema, parseDurationMinutesStr } from "@/lib/validation/duration-minutes-form-schema";
import type { ClassPlanTemplateDetail } from "@/lib/types";
import type { CreateClassPlanBody, UpdateClassPlanBody } from "@/services/class-plan-api";

export const TAG_PRESETS = ["Easy Teach", "Moderate", "Challenging"] as const;

export const MAX_TAGS = 10;
export const MAX_TAG_LEN = 50;

/** Form values aligned with shadcn Selects (`none` = unset) and server limits. */
export const classPlanTemplateFormSchema = z.object({
  name: z
    .string()
    .max(200, "Title must be at most 200 characters")
    .refine((s) => s.trim().length > 0, "Title is required"),
  classType: z.string(),
  classStyle: z.string(),
  durationMinutesStr: classPlanDurationMinutesStrSchema,
  folderId: z.string(),
  tags: z
    .array(z.string().max(MAX_TAG_LEN, `Each tag must be at most ${MAX_TAG_LEN} characters`))
    .max(MAX_TAGS, `At most ${MAX_TAGS} tags`),
});

export type ClassPlanTemplateFormValues = z.infer<typeof classPlanTemplateFormSchema>;

export function buildClassPlanTemplateCreateDefaults(): ClassPlanTemplateFormValues {
  return {
    name: "",
    classType: "none",
    classStyle: "none",
    durationMinutesStr: "60",
    folderId: "none",
    tags: [],
  };
}

export function buildClassPlanTemplateEditDefaults(
  plan: ClassPlanTemplateDetail
): ClassPlanTemplateFormValues {
  return {
    name: plan.name,
    classType:
      plan.classType != null && String(plan.classType).trim() !== ""
        ? String(plan.classType)
        : "none",
    classStyle:
      plan.classStyle != null && String(plan.classStyle).trim() !== ""
        ? String(plan.classStyle)
        : "none",
    durationMinutesStr:
      plan.durationMinutes != null && plan.durationMinutes > 0
        ? String(plan.durationMinutes)
        : "60",
    folderId: plan.folderId ?? "none",
    tags: Array.isArray(plan.tags) ? [...plan.tags] : [],
  };
}

export function toCreateClassPlanBody(values: ClassPlanTemplateFormValues): CreateClassPlanBody {
  const name = values.name.trim();
  const durationMinutes = parseDurationMinutesStr(values.durationMinutesStr);
  return {
    name,
    durationMinutes,
    tags: values.tags,
    folderId: values.folderId === "none" ? null : values.folderId,
    ...(values.classType !== "none" && { classType: values.classType }),
    ...(values.classStyle !== "none" && { classStyle: values.classStyle }),
  };
}

export function toUpdateClassPlanBody(values: ClassPlanTemplateFormValues): UpdateClassPlanBody {
  const name = values.name.trim();
  const durationMinutes = parseDurationMinutesStr(values.durationMinutesStr);
  return {
    name,
    durationMinutes,
    tags: values.tags,
    folderId: values.folderId === "none" ? null : values.folderId,
    classType: values.classType === "none" ? null : values.classType,
    classStyle: values.classStyle === "none" ? null : values.classStyle,
  };
}
