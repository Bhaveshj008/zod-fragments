// src/extensions.ts
import { z } from "zod";
import {
  FIELD_ERRORS,
  CustomMessages,
  requiredString,
  optionalNumber,
  boolean as booleanBase,
  Enum,
  emailOrMobile as emailOrMobileBase,
} from "./index";

/* ---------------------------------------
 * tiny local helpers
 * ------------------------------------- */
const coerceNumber = () =>
  z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number());

const coerceBoolean = () =>
  z.preprocess((v) => {
    if (typeof v === "boolean") return v;
    if (v === "true" || v === "1" || v === 1) return true;
    if (v === "false" || v === "0" || v === 0) return false;
    return v;
  }, z.boolean());

/* ---------------------------------------
 * Normalized / Coercion variants (optional)
 * NOTE: when you need .max/.regex (string-only),
 * do them BEFORE .transform() to avoid ZodEffects typing issues.
 * ------------------------------------- */

// Trimmed required string
export const requiredStringTrimmed = (
  label = "This field",
  msg?: CustomMessages | string
) =>
  requiredString(label, msg)
    // do validations here while still ZodString
    // then normalize at the end
    .transform((v) => v.trim());

// Lowercased, trimmed email (normalized)
export const emailNormalized = (
  label = "Email",
  msg?: CustomMessages | string
) =>
  requiredString(label, msg)
    .transform((v) => v.trim().toLowerCase())
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: typeof msg === "string" ? msg : msg?.validation || `${label} ${FIELD_ERRORS.EMAIL}`,
    });

// Optional number coercion ("" -> undefined, "12" -> 12)
export const optionalNumberCoerce = (
  label = "This field",
  msg?: CustomMessages | string
) => coerceNumber().pipe(optionalNumber(label, msg));

// Boolean coercion
export const booleanCoerce = (
  label = "This field",
  msg?: CustomMessages | string
) => coerceBoolean().pipe(booleanBase(label, msg));

/** Slug (required) normalized: validate first with regex, then normalize */
export const requiredSlugNormalized = (
  label = "Slug",
  msg?: CustomMessages | string
) =>
  z
    .string({
      invalid_type_error:
        typeof msg === "string" ? msg : msg?.invalid || `${label} ${FIELD_ERRORS.STRING}`,
    })
    .regex(
      /^[a-z0-9\s-]+$/,
      typeof msg === "string" ? msg : msg?.validation || `${label} ${FIELD_ERRORS.SLUG_FORMAT}`
    )
    .transform((v) => v.trim().toLowerCase());

/** Slug (optional) normalized */
export const optionalSlugNormalized = (
  label = "Slug",
  msg?: CustomMessages | string
) =>
  z
    .string({
      invalid_type_error:
        typeof msg === "string" ? msg : msg?.invalid || `${label} ${FIELD_ERRORS.STRING}`,
    })
    .regex(
      /^[a-z0-9\s-]+$/,
      typeof msg === "string" ? msg : msg?.validation || `${label} ${FIELD_ERRORS.SLUG_FORMAT}`
    )
    .transform((v) => v.trim().toLowerCase())
    .optional();

/** Enum helpers */
export const enumFrom = <T extends readonly [string, ...string[]]>(
  options: T,
  label = "This field",
  msg?: CustomMessages | string
) => Enum(options as unknown as [string, ...string[]], label, msg);

export const enumWithLabels = <T extends readonly string[]>(
  options: T,
  labels: Partial<Record<T[number], string>> = {},
  label = "This field",
  msg?: CustomMessages | string
) => {
  const e = z.enum(options as unknown as [T[number], ...T[number][]], {
    errorMap: () => ({
      message:
        typeof msg === "string"
          ? msg
          : msg?.validation || `${label} ${FIELD_ERRORS.ENUM} ${options.join(", ")}`,
    }),
  });
  return e.transform((v) => ({ value: v, label: labels[v] ?? v }));
};

/* ---------------------------------------
 * Pagination builders (safer defaults)
 * ------------------------------------- */
export const buildPagination = (maxLimit = 200) =>
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(maxLimit).default(10),
  });

export const buildListQuery = <SortKeys extends readonly string[]>(
  sortKeys: SortKeys,
  maxLimit = 200
) =>
  z.object({
    filters: z.record(z.any()).optional().default({}),
    sort: z
      .object({
        by: z.enum(sortKeys as unknown as [SortKeys[number], ...SortKeys[number][]]),
        order: Enum(["asc", "desc"], "Sort order"),
      })
      .optional(),
    search: z.string().optional(),
    ...buildPagination(maxLimit).shape,
  });

/* ---------------------------------------
 * Email/Mobile normalized (structured)
 * ------------------------------------- */
export const emailOrMobileNormalized = (
  label = "Identifier",
  msg?: CustomMessages | string
) =>
  z
    .string({
      required_error: typeof msg === "string" ? msg : msg?.required || `${label} ${FIELD_ERRORS.REQUIRED}`,
      invalid_type_error: typeof msg === "string" ? msg : msg?.invalid || `${label} ${FIELD_ERRORS.STRING}`,
    })
    .transform((raw) => raw.trim().replace(/[\s-]/g, ""))
    .transform((raw) => (raw.startsWith("+91") ? raw.slice(3) : raw))
    .refine(
      (raw) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
        const isMobile = /^[6-9]\d{9}$/.test(raw);
        return isEmail || isMobile;
      },
      {
        message:
          typeof msg === "string" ? msg : msg?.validation || `${label} must be a valid email or mobile`,
      }
    )
    .transform((raw) => {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
      return isEmail
        ? { type: "email" as const, value: raw.toLowerCase() }
        : { type: "mobile" as const, value: raw };
    });

/* ---------------------------------------
 * SEO stricter variant
 * NOTE: .max() before .transform()
 * ------------------------------------- */
export const seoFieldsStrict = {
  seo_title: requiredString("SEO Title")
    .max(60, "SEO Title should be <= 60 chars")
    .transform((v) => v.trim())
    .optional(),
  seo_description: requiredString("SEO Description")
    .max(160, "SEO Description should be <= 160 chars")
    .transform((v) => v.trim())
    .optional(),
  seo_image: requiredString("SEO Image")
    .url(`SEO Image ${FIELD_ERRORS.URL}`)
    .optional(),
};

/* ---------------------------------------
 * India-specific validators
 * ------------------------------------- */
export const pinCode = (
  label = "PIN Code",
  msg?: string | { validation?: string }
) =>
  requiredString(label, msg).regex(
    /^[0-9]{6}$/,
    typeof msg === "string" ? msg : msg?.validation || `${label} must be 6 digits`
  );

export const pan = (label = "PAN", msg?: string | { validation?: string }) =>
  requiredString(label, msg)
    .regex(/^[a-z]{5}\d{4}[a-z]$/i, typeof msg === "string" ? msg : msg?.validation || `${label} must be a valid PAN`)
    .transform((v) => v.trim().toLowerCase());

export const gstin = (label = "GSTIN", msg?: string | { validation?: string }) =>
  requiredString(label, msg)
    .regex(/^\d{2}[a-z0-9]{10}\d[zZ][a-z0-9]$/, typeof msg === "string" ? msg : msg?.validation || `${label} must be a valid GSTIN`)
    .transform((v) => v.trim().toLowerCase());

export const inMobile = (
  label = "Mobile",
  msg?: string | { validation?: string }
) =>
  requiredString(label, msg)
    .transform((v) => v.replace(/[\s-]/g, ""))
    .transform((v) => (v.startsWith("+91") ? v.slice(3) : v))
    .refine((v) => /^[6-9]\d{9}$/.test(v), {
      message:
        typeof msg === "string" ? msg : msg?.validation || `${label} ${FIELD_ERRORS.MOBILE}`,
    });

/* ---------------------------------------
 * Money & currency helpers
 * ------------------------------------- */
export const inrCurrency = () => z.literal("INR");

export const money = (label = "Amount", msg?: { invalid?: string; validation?: string } | string) =>
  z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === "string" ? Number(v) : v))
    .refine((n) => Number.isFinite(n), {
      message: typeof msg === "string" ? msg : msg?.invalid || `${label} ${FIELD_ERRORS.NUMBER}`,
    })
    .refine((n) => n >= 0, {
      message: typeof msg === "string" ? msg : msg?.validation || `${label} must be >= 0`,
    })
    .transform((n) => Math.round(n * 100) / 100);

export const priceObject = z.object({
  currency: inrCurrency().default("INR"),
  amount: money(),
});

/* ---------------------------------------
 * Dates & ranges
 * ------------------------------------- */
export const isoDateTime = (
  label = "Date",
  msg?: string | { validation?: string }
) =>
  requiredString(label, msg).refine((v) => !Number.isNaN(Date.parse(v)), {
    message:
      typeof msg === "string" ? msg : msg?.validation || `${label} ${FIELD_ERRORS.DATE}`,
  });

export const dateRange = z
  .object({
    start: isoDateTime("Start date"),
    end: isoDateTime("End date"),
  })
  .refine((r) => new Date(r.start) <= new Date(r.end), {
    message: "Start date must be before or equal to end date",
  });

export const dateAfter = (minISO: string, label = "Date") =>
  isoDateTime(label).refine((v) => new Date(v) > new Date(minISO), {
    message: `${label} must be after ${minISO}`,
  });

/* ---------------------------------------
 * Arrays
 * ------------------------------------- */
export const nonEmptyArrayOf = <T extends z.ZodTypeAny>(
  schema: T,
  label = "Items"
) => z.array(schema).min(1, `${label} must contain at least 1 item`);

export const uniqueArrayBy = <T extends z.ZodTypeAny, K extends string>(
  schema: T,
  key: K,
  label = "Array"
) =>
  z
    .array(schema)
    .refine(
      (arr) => new Set(arr.map((x: any) => x?.[key])).size === arr.length,
      `${label} must have unique ${key}`
    );

/* ---------------------------------------
 * URL variants
 * ------------------------------------- */
export const httpsUrl = (
  label = "URL",
  msg?: { validation?: string } | string
) =>
  requiredString(label, msg)
    .url(typeof msg === "string" ? msg : msg?.validation || `${label} ${FIELD_ERRORS.URL}`)
    .refine((v) => v.startsWith("https://"), { message: `${label} must use https` });

export const domain = (
  label = "Domain",
  msg?: { validation?: string } | string
) =>
  requiredString(label, msg)
    .regex(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/, typeof msg === "string" ? msg : msg?.validation || `${label} must be a valid domain`)
    .transform((v) => v.trim().toLowerCase());

export const imageUrlStrict = (label = "Image URL") =>
  httpsUrl(label).refine((v) => /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(v), {
    message: `${label} must point to an image`,
  });

/* ---------------------------------------
 * Cursor pagination
 * ------------------------------------- */
export const cursorPagination = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

/* ---------------------------------------
 * Records with constrained keys
 * ------------------------------------- */
export const recordOf = <K extends readonly string[], V extends z.ZodTypeAny>(
  keys: K,
  value: V
) => z.record(z.enum(keys as unknown as [K[number], ...K[number][]]), value);

/* ---------------------------------------
 * Brands
 * ------------------------------------- */
export type Brand<T, B extends string> = T & { __brand: B };

export const brandedUuid = <B extends string>(brand: B, label = brand) =>
  requiredString(label)
    .uuid(`${label} ${FIELD_ERRORS.UUID}`)
    .transform((v) => v as Brand<string, B>);
