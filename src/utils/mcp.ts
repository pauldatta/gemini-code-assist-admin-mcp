/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

/**
 * Helper for MCP Sampling to get AI explanations/summaries.
 */
export async function sampleMessage(
  server: any,
  prompt: string,
  systemPrompt?: string,
): Promise<string | null> {
  try {
    const result = await server.server.request(
      {
        method: 'sampling/createMessage',
        params: {
          messages: [{ role: 'user', content: { type: 'text', text: prompt } }],
          systemPrompt: systemPrompt,
          maxTokens: 1024,
        },
      },
      z.any(),
    );

    if (result && result.content && result.content.type === 'text') {
      return result.content.text;
    }
    return null;
  } catch (_e) {
    return null;
  }
}

/**
 * Standardized error handler that attempts to use AI sampling for better context.
 */
export async function handleToolError(
  server: any,
  error: any,
  context: string,
): Promise<{ content: { type: 'text'; text: string }[]; isError: true }> {
  // Use sampling to explain the error in plain English
  const errorMessage = error instanceof Error ? error.message : String(error);
  const systemPrompt =
    'You are a helpful Google Cloud expert. Explain the error and suggest a fix.';
  const prompt = `I encountered an error while ${context}:\n${errorMessage}\n\nPlease explain what went wrong and how to fix it.`;

  const explanation = await sampleMessage(server, prompt, systemPrompt);
  const text = explanation
    ? `Error: ${errorMessage}\n\nAnalysis:\n${explanation}`
    : `Error: ${errorMessage}`;

  return {
    content: [{ type: 'text', text }],
    isError: true,
  };
}
