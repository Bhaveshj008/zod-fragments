# zod-fragments

[![npm version](https://badge.fury.io/js/zod-fragments.svg)](https://badge.fury.io/js/zod-fragments)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

**Reusable validation fragments built on top of Zod. Includes Zod as bundled dependency.**

Stop writing repetitive validation boilerplate. Build robust schemas with pre-configured fragments that handle common patterns and error messages.

## Installation

```bash
npm install zod-fragments
```

No need to install `zod` separately - it's bundled and re-exported.

## Quick Start

```typescript
import { z, requiredString, emailOrMobile, uuid } from "zod-fragments";

const userSchema = z.object({
  name: requiredString("Full Name"),
  contact: emailOrMobile("Email or Phone"),
  userId: uuid("User ID"),
});
```

## Before & After Comparison

### Before: Native Zod
```typescript
import { z } from "zod";

const userSchema = z.object({
  // Required string
  name: z.string({
    required_error: "Name is required",
    invalid_type_error: "Name must be a string"
  }).min(1, "Name cannot be empty"),
  
  // Optional string  
  bio: z.string({
    invalid_type_error: "Bio must be a string"
  }).optional(),
  
  // UUID
  userId: z.string({
    required_error: "User ID is required",
    invalid_type_error: "User ID must be a string"
  }).uuid("User ID must be a valid UUID"),
  
  // Enum
  role: z.enum(["admin", "user", "moderator"], {
    required_error: "Role is required",
    invalid_type_error: "Role must be one of the valid options"
  }),
  
  // Required number
  age: z.number({
    required_error: "Age is required",
    invalid_type_error: "Age must be a number"
  }),
  
  // Optional number
  score: z.number({
    invalid_type_error: "Score must be a number"
  }).optional()
});
```

### After: With zod-fragments
```typescript
import { z, requiredString, optionalString, uuid, Enum, requiredNumber, optionalNumber } from "zod-fragments";

const userSchema = z.object({
  name: requiredString("Name"),
  bio: optionalString("Bio"), 
  userId: uuid("User ID"),
  role: Enum(["admin", "user", "moderator"], "Role"),
  age: requiredNumber("Age"),
  score: optionalNumber("Score")
});
```

## Available Fragments

### String Fragments
```typescript
requiredString("Field Name")     // Required non-empty string
optionalString("Field Name")     // Optional string
slug("URL Slug")                 // URL-safe slug (lowercase, alphanumeric + hyphens)
title                           // Predefined required string for titles
description                     // Predefined optional string for descriptions
```

### Number Fragments
```typescript
requiredNumber("Field Name")     // Required number
positiveNumber("Field Name")     // Required positive number (> 0)
optionalNumber("Field Name")     // Optional number
```

### Boolean Fragments
```typescript
boolean("Field Name")            // Required boolean
optionalBoolean("Field Name")    // Optional boolean
```

### UUID Fragments
```typescript
uuid("Field Name")               // Required valid UUID
optionalUUID("Field Name")       // Optional valid UUID
```

### Enum Fragments
```typescript
Enum(["option1", "option2"], "Field Name")    // Required enum selection
```

### Date Fragments
```typescript
dateString("Field Name")         // Required ISO date string
optionalDate("Field Name")       // Optional ISO date string
```

### Contact Fragments
```typescript
emailOrMobile("Field Name")      // Email format OR 10-digit mobile number
```

### File Fragments
```typescript
fileUrl("Field Name")            // Valid URL for files
imageUrl("Field Name")           // Valid URL for images
```

## Schema Blocks

Pre-built collections of related fields:

```typescript
import { seoFields, paginationFields, listQueryFields } from "zod-fragments";

// SEO fields
const pageSchema = z.object({
  title: requiredString("Page Title"),
  ...seoFields  // Adds: seo_title, seo_description, seo_image
});

// Pagination
const listSchema = z.object({
  ...paginationFields  // Adds: page (default: 1), limit (default: 10)
});

// Complete listing endpoint
const apiSchema = z.object({
  ...listQueryFields  // Adds: page, limit, filters, sort, search
});
```

## Custom Error Messages

All fragments support custom error messages as an optional second parameter:

```typescript
// Simple custom message
requiredString("Field Name", "Custom error message")

// Advanced custom messages for different error types
requiredString("Field Name", {
  required: "This field is required",
  invalid: "Must be a string",
  validation: "Cannot be empty"
})
```

## Framework Integration

### Express.js API
```typescript
import { z, requiredString, emailOrMobile } from "zod-fragments";

const createUserSchema = z.object({
  name: requiredString("Name"),
  email: emailOrMobile("Email")
});

app.post("/users", (req, res) => {
  try {
    const userData = createUserSchema.parse(req.body);
    // Process validated data
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = {};
      error.errors.forEach(err => {
        errors[err.path.join(".")] = err.message;
      });
      return res.status(400).json({ errors });
    }
  }
});
```

### React Hook Form
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z, requiredString, emailOrMobile } from "zod-fragments";

const formSchema = z.object({
  name: requiredString("Full Name"),
  email: emailOrMobile("Email")
});

const MyForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input {...register("email")} />
      {errors.email && <span>{errors.email.message}</span>}
    </form>
  );
};
```

## Error Handling

zod-fragments provides consistent, user-friendly error messages:

```typescript
import { z, requiredString, uuid, Enum } from "zod-fragments";

const userSchema = z.object({
  name: requiredString("Name"),
  userId: uuid("User ID"),
  role: Enum(["admin", "user"], "Role")
});

try {
  const result = userSchema.parse({
    name: "",
    userId: "invalid-uuid",
    role: "invalid-role"
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(error.errors);
    // Output:
    // [
    //   { path: ["name"], message: "Name cannot be empty" },
    //   { path: ["userId"], message: "User ID must be a valid UUID" },
    //   { path: ["role"], message: "Role must be one of the valid options" }
    // ]
    
    // Transform to field-level errors
    const fieldErrors = {};
    error.errors.forEach(err => {
      fieldErrors[err.path.join(".")] = err.message;
    });
    
    console.log(fieldErrors);
    // Output:
    // {
    //   "name": "Name cannot be empty",
    //   "userId": "User ID must be a valid UUID", 
    //   "role": "Role must be one of the valid options"
    // }
  }
}
```

## Chaining Additional Validations

Fragments return standard Zod schemas, so you can chain additional validations:

```typescript
const schema = z.object({
  password: requiredString("Password")
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Must contain uppercase, lowercase, and number"),
  
  age: positiveNumber("Age")
    .max(120, "Age cannot exceed 120")
});
```

## TypeScript Support

Full type inference and IDE autocomplete:

```typescript
type User = z.infer<typeof userSchema>;
// TypeScript automatically knows the shape of your validated data
```

## API Reference

| Fragment | Description |
|----------|-------------|
| `requiredString(label)` | Non-empty string, required |
| `optionalString(label)` | Optional string |
| `slug(label)` | URL-safe slug format |
| `requiredNumber(label)` | Required number |
| `positiveNumber(label)` | Positive number (> 0) |
| `optionalNumber(label)` | Optional number |
| `boolean(label)` | Required boolean |
| `optionalBoolean(label)` | Optional boolean |
| `uuid(label)` | Valid UUID format |
| `optionalUUID(label)` | Optional valid UUID |
| `Enum(options, label)` | One of the provided options |
| `dateString(label)` | Valid ISO date string |
| `optionalDate(label)` | Optional ISO date string |
| `emailOrMobile(label)` | Email format OR 10-digit mobile |
| `fileUrl(label)` | Valid URL for files |
| `imageUrl(label)` | Valid URL for images |

### Schema Blocks

| Block | Fields | Description |
|-------|--------|-------------|
| `seoFields` | `seo_title`, `seo_description`, `seo_image` | SEO metadata fields |
| `paginationFields` | `page` (default: 1), `limit` (default: 10) | Pagination parameters |
| `listQueryFields` | `page`, `limit`, `filters`, `sort`, `search` | Complete listing endpoint parameters |

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.