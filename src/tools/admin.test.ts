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

describe('Admin Tools', () => {
    let server: McpServer;

    beforeEach(() => {
        vi.clearAllMocks();
        server = new McpServer({ name: 'test', version: '1.0.0' });
        // We need to capture the tool registration
        registerAdminTools(server);
    });

    it('check_gca_status returns ENABLED if API is found', async () => {
        mockedGcloud.getProjectId.mockResolvedValue('test-project');
        mockedGcloud.runGcloud.mockResolvedValue('cloudaicompanion.googleapis.com');

        // Manually trigger the tool logic (McpServer doesn't expose it easily for unit tests without a transport)
        // In a real scenario, we'd use a TestTransport, but for unit tests we can check if the tool is registered
        const tools = (server as any)._tools;
        const tool = tools.get('check_gca_status');
        
        const result = await tool.execute({ projectId: 'test-project' });
        
        expect(result.content[0].text).toContain('ENABLED');
        expect(result.content[0].text).toContain('test-project');
    });

    it('check_gca_status returns DISABLED if API is missing', async () => {
        mockedGcloud.getProjectId.mockResolvedValue('test-project');
        mockedGcloud.runGcloud.mockResolvedValue('');

        const tools = (server as any)._tools;
        const tool = tools.get('check_gca_status');
        
        const result = await tool.execute({ projectId: 'test-project' });
        
        expect(result.content[0].text).toContain('DISABLED');
    });
});
