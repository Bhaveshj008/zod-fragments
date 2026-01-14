// src/index.ts
import {
  z,
  ZodString,
  ZodNumber,
  ZodBoolean,
  ZodEnum,
  ZodRawShape,
  ZodOptional,
} from "zod";

/** Exported so extras can reuse consistent text */
export const FIELD_ERRORS = {
  REQUIRED: "is required",
  STRING: "must be a string",
  NUMBER: "must be a number",
  BOOLEAN: "must be a boolean",
  UUID: "must be a valid UUID",
  ENUM: "must be one of:",
  DATE: "must be a valid date",
  URL: "must be a valid URL",
  SLUG_FORMAT: "must contain only lowercase letters, numbers and hyphens",
  MOBILE: "must be a valid 10-digit mobile number",
  EMAIL: "must be a valid email address",
} as const;

/** Exported for extras and consumers */
export interface CustomMessages {
  required?: string;
  invalid?: string;
  validation?: string;
}

export const requiredString = (
  label = "This field",
  customMessages?: CustomMessages | string
): ZodString => {
  const messages =
    typeof customMessages === "string"
      ? {
          required: customMessages,
          invalid: customMessages,
          validation: customMessages,
        }
      : customMessages || {};

  return z
    .string({
      required_error: messages.required || `${label} ${FIELD_ERRORS.REQUIRED}`,
      invalid_type_error: messages.invalid || `${label} ${FIELD_ERRORS.STRING}`,
    })
    .min(
      1,
      messages.validation ||
        messages.required ||
        `${label} ${FIELD_ERRORS.REQUIRED}`
    );
};

export const optionalString = (
  label = "This field",
  customMessages?: CustomMessages | string
): ZodOptional<ZodString> => {
  const messages =
    typeof customMessages === "string"
      ? { invalid: customMessages }
      : customMessages || {};

  return z
    .string({
      invalid_type_error: messages.invalid || `${label} ${FIELD_ERRORS.STRING}`,
    })
    .optional();
};

export const requiredNumber = (
  label = "This field",
  customMessages?: CustomMessages | string
): ZodNumber => {
  const messages =
    typeof customMessages === "string"
      ? { required: customMessages, invalid: customMessages }
      : customMessages || {};

  return z.number({
    required_error: messages.required || `${label} ${FIELD_ERRORS.REQUIRED}`,
    invalid_type_error: messages.invalid || `${label} ${FIELD_ERRORS.NUMBER}`,
  });
};

export const positiveNumber = (
  label = "This field",
  customMessages?: CustomMessages | string
): ZodNumber => {
  const messages =
    typeof customMessages === "string"
      ? { invalid: customMessages, validation: customMessages }
      : customMessages || {};

  return z
    .number({
      invalid_type_error: messages.invalid || `${label} ${FIELD_ERRORS.NUMBER}`,
    })
    .positive(messages.validation || `${label} must be positive`);
};

export const optionalNumber = (
  label = "This field",
  customMessages?: CustomMessages | string
): ZodOptional<ZodNumber> => {
  const messages =
    typeof customMessages === "string"
      ? { invalid: customMessages }
      : customMessages || {};

  return z
    .number({
      invalid_type_error: messages.invalid || `${label} ${FIELD_ERRORS.NUMBER}`,
    })
    .optional();
};

export const boolean = (
  label = "This field",
  customMessages?: CustomMessages | string
): ZodBoolean => {
  const messages =
    typeof customMessages === "string"
      ? { invalid: customMessages }
      : customMessages || {};

  return z.boolean({
    invalid_type_error: messages.invalid || `${label} ${FIELD_ERRORS.BOOLEAN}`,
  });
};

export const optionalBoolean = (
  label = "This field",
  customMessages?: CustomMessages | string
): ZodOptional<ZodBoolean> => {
  const messages =
    typeof customMessages === "string"
      ? { invalid: customMessages }
      : customMessages || {};

  return z
    .boolean({
      invalid_type_error:
        messages.invalid || `${label} ${FIELD_ERRORS.BOOLEAN}`,
    })
    .optional();
};

export const uuid = (
  label = "ID",
  customMessages?: CustomMessages | string
): ZodString => {
  const messages =
    typeof customMessages === "string"
      ? {
          required: customMessages,
          invalid: customMessages,
          validation: customMessages,
        }
      : customMessages || {};

  return z
    .string({
      required_error: messages.required || `${label} ${FIELD_ERRORS.REQUIRED}`,
      invalid_type_error: messages.invalid || `${label} ${FIELD_ERRORS.STRING}`,
    })
    .uuid(messages.validation || `${label} ${FIELD_ERRORS.UUID}`);
};

export const optionalUUID = (
  label = "ID",
  customMessages?: CustomMessages | string
): ZodOptional<ZodString> => uuid(label, customMessages).optional();

export const Enum = <T extends [string, ...string[]]>(
  options: T,
  label = "This field",
  customMessages?: CustomMessages | string
): ZodEnum<T> => {
  const messages =
    typeof customMessages === "string"
      ? { validation: customMessages }
      : customMessages || {};

  return z.enum(options, {
    errorMap: () => ({
      message:
        messages.validation ||
        `${label} ${FIELD_ERRORS.ENUM} ${options.join(", ")}`,
    }),
  });
};

export const dateString = (
  label = "Date",
  customMessages?: CustomMessages | string
) => {
  const messages =
    typeof customMessages === "string"
      ? {
          required: customMessages,
          invalid: customMessages,
          validation: customMessages,
        }
      : customMessages || {};

  return z
    .string({
      required_error: messages.required || `${label} ${FIELD_ERRORS.REQUIRED}`,
      invalid_type_error: messages.invalid || `${label} ${FIELD_ERRORS.STRING}`,
    })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: messages.validation || `${label} ${FIELD_ERRORS.DATE}`,
    });
};

export const optionalDate = (
  label = "Date",
  customMessages?: CustomMessages | string
) => dateString(label, customMessages).optional();

export const paginationFields: ZodRawShape = {
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(10),
};

export const filters = z.record(z.any()).optional().default({});
export const sort = z.record(z.any()).optional().default({});
export const search = z.string().optional();

export const listQueryFields: ZodRawShape = {
  filters,
  sort,
  search,
  ...paginationFields,
};

export const seoFields: ZodRawShape = {
  seo_title: optionalString("SEO Title"),
  seo_description: optionalString("SEO Description"),
  seo_image: optionalString("SEO Image"),
};

export const fileUrl = (
  label = "File URL",
  customMessages?: CustomMessages | string
): ZodOptional<ZodString> => {
  const messages =
    typeof customMessages === "string"
      ? { validation: customMessages }
      : customMessages || {};

  return z
    .string()
    .url(messages.validation || `${label} ${FIELD_ERRORS.URL}`)
    .optional();
};

export const imageUrl = (
  label = "Image URL",
  customMessages?: CustomMessages | string
): ZodOptional<ZodString> => {
  const messages =
    typeof customMessages === "string"
      ? { validation: customMessages }
      : customMessages || {};

  return z
    .string()
    .url(messages.validation || `${label} ${FIELD_ERRORS.URL}`)
    .optional();
};

export const slug = (
  label = "Slug",
  customMessages?: CustomMessages | string
): ZodOptional<ZodString> => {
  const messages =
    typeof customMessages === "string"
      ? { invalid: customMessages, validation: customMessages }
      : customMessages || {};

  return z
    .string({
      invalid_type_error: messages.invalid || `${label} ${FIELD_ERRORS.STRING}`,
    })
    .regex(
      /^[a-z0-9-]+$/,
      messages.validation || `${label} ${FIELD_ERRORS.SLUG_FORMAT}`
    )
    .optional();
};

export const description = optionalString("Description");
export const title = requiredString("Title");

export const emailOrMobile = (
  label = "Identifier",
  customMessages?: CustomMessages | string
) => {
  const messages =
    typeof customMessages === "string"
      ? {
          required: customMessages,
          invalid: customMessages,
          validation: customMessages,
        }
      : customMessages || {};

  return z
    .string({
      required_error: messages.required || `${label} ${FIELD_ERRORS.REQUIRED}`,
      invalid_type_error: messages.invalid || `${label} ${FIELD_ERRORS.STRING}`,
    })
    .refine(
      (val) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        const isMobile = /^[0-9]{10}$/.test(val);
        return isEmail || isMobile;
      },
      {
        message:
          messages.validation ||
          `${label} ${FIELD_ERRORS.EMAIL} or ${FIELD_ERRORS.MOBILE}`,
      }
    );
};


export * from "./extensions";


export { z };
