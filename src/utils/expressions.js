// @flow

import { correctIndentation } from "./indentation";
import type { Expression } from "debugger-html";

// replace quotes and slashes that could interfere with the evaluation.
export function sanitizeInput(input: string) {
  return input.replace(/\\/g, "\\\\").replace(/"/g, '"');
}

/*
 * wrap the expression input in a try/catch so that it can be safely
 * evaluated.
 *
 * NOTE: we add line after the expression to protect against comments.
*/
export function wrapExpression(input: string) {
  return correctIndentation(`
    try {
      ${sanitizeInput(input)}
    } catch (e) {
      e
    }
  `);
}

export function getValue(expression: Expression) {
  const value = expression.value;
  if (!value) {
    return {
      path: expression.from,
      value: { unavailable: true }
    };
  }

  if (value.exception) {
    return {
      path: value.from,
      value: value.exception
    };
  }

  if (value.error) {
    return {
      path: value.from,
      value: value.error
    };
  }

  if (value.result && value.result.class == "Error") {
    const { name, message } = value.result.preview;
    const newValue =
      name === "ReferenceError" ? { unavailable: true } : `${name}: ${message}`;

    return { path: value.input, value: newValue };
  }

  if (typeof value.result == "object") {
    return {
      path: value.result.actor,
      value: value.result
    };
  }

  return {
    path: value.input,
    value: value.result
  };
}
