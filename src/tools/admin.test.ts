import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAdminTools } from './admin.js';
import * as gcloud from '../utils/gcloud.js';

// Mock gcloud utils
vi.mock('../utils/gcloud.js', () => ({
  runGcloud: vi.fn(),
  getProjectId: vi.fn(),
}));

const mockedGcloud = vi.mocked(gcloud);

/**
 * Helper to invoke a registered tool's callback directly.
 * McpServer stores tools in `_registeredTools` as a plain object keyed by name,
 * each having a `callback` function. This avoids needing a live transport.
 */
async function invokeTool(server: McpServer, toolName: string, args: Record<string, unknown>) {
  const registered = (server as any)._registeredTools;
  const tool = registered[toolName];
  if (!tool) throw new Error(`Tool "${toolName}" not registered.`);
  return tool.callback(args, {} /* extra */);
}

describe('Admin Tools', () => {
  let server: McpServer;

  beforeEach(() => {
    vi.clearAllMocks();
    server = new McpServer({ name: 'test', version: '1.0.0' });
    registerAdminTools(server);
  });

  it('check_gca_status returns ENABLED if API is found', async () => {
    mockedGcloud.getProjectId.mockResolvedValue('test-project');
    mockedGcloud.runGcloud.mockResolvedValue('cloudaicompanion.googleapis.com');

    const result = await invokeTool(server, 'check_gca_status', { projectId: 'test-project' });

    expect(result.content[0].text).toContain('ENABLED');
    expect(result.content[0].text).toContain('test-project');
  });

  it('check_gca_status returns DISABLED if API is missing', async () => {
    mockedGcloud.getProjectId.mockResolvedValue('test-project');
    mockedGcloud.runGcloud.mockResolvedValue('');

    const result = await invokeTool(server, 'check_gca_status', { projectId: 'test-project' });

    expect(result.content[0].text).toContain('DISABLED');
  });
});
