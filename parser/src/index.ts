/**
 * @mrcf/parser — public API
 *
 * Usage:
 * ```ts
 * import { parse, validate } from '@mrcf/parser';
 *
 * const result = parse(source);
 * if (result.ok) {
 *   const validation = validate(result.document!);
 *   console.log(validation.valid, validation.issues);
 * }
 * ```
 */

export { parse } from './parser/index';
export { validate } from './validator/index';
export { resolveAssets } from './parser/assetResolver';
export * from './types/index';
