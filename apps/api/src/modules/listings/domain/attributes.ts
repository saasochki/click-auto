import type { ProblemFieldError } from '../../../common/problem';

export interface AttributeDef {
  key: string;
  type: 'number' | 'range' | 'enum' | 'multi_enum' | 'bool' | 'text';
  options: string[] | null;
  required: boolean;
}

type Value = number | string | boolean | string[];

/** Checks goods attributes against the category schema. Returns field errors, empty if valid. */
export function validateAttributes(
  defs: AttributeDef[],
  values: Record<string, Value>,
): ProblemFieldError[] {
  const errors: ProblemFieldError[] = [];
  const known = new Map(defs.map((d) => [d.key, d]));
  for (const key of Object.keys(values)) {
    if (!known.has(key)) errors.push({ field: `goods.attributes.${key}`, code: 'unknown' });
  }
  for (const def of defs) {
    const field = `goods.attributes.${def.key}`;
    const value = values[def.key];
    if (value === undefined) {
      if (def.required) errors.push({ field, code: 'required' });
      continue;
    }
    const ok = (() => {
      switch (def.type) {
        case 'number':
          return typeof value === 'number' && Number.isFinite(value) && value >= 0;
        case 'bool':
          return typeof value === 'boolean';
        case 'text':
          return typeof value === 'string' && value.trim().length > 0;
        case 'enum':
          return typeof value === 'string' && (def.options ?? []).includes(value);
        case 'multi_enum':
          return Array.isArray(value) && value.every((v) => (def.options ?? []).includes(v));
        case 'range':
          return false;
      }
    })();
    if (!ok) errors.push({ field, code: 'invalid' });
  }
  return errors;
}
