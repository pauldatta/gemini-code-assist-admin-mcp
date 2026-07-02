import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runGcloud, getProjectId } from './gcloud.js';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

// Mock child_process.spawn
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

describe('gcloud utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runGcloud returns stdout on success', async () => {
    const mockChild: any = new EventEmitter();
    mockChild.stdout = new EventEmitter();
    mockChild.stderr = new EventEmitter();

    (spawn as any).mockReturnValue(mockChild);

    const promise = runGcloud(['config', 'list']);

    mockChild.stdout.emit('data', 'project = my-project');
    mockChild.emit('close', 0);

    const result = await promise;
    expect(result).toBe('project = my-project');
    expect(spawn).toHaveBeenCalledWith('gcloud', ['config', 'list', '-q']);
  });

  it('runGcloud throws error on non-zero exit code', async () => {
    const mockChild: any = new EventEmitter();
    mockChild.stdout = new EventEmitter();
    mockChild.stderr = new EventEmitter();

    (spawn as any).mockReturnValue(mockChild);

    const promise = runGcloud(['invalid', 'command']);

    mockChild.stderr.emit('data', 'unknown command');
    mockChild.emit('close', 1);

    await expect(promise).rejects.toThrow('gcloud command failed with code 1: unknown command');
  });

  it('getProjectId returns provided ID if present', async () => {
    const result = await getProjectId('manual-id');
    expect(result).toBe('manual-id');
    expect(spawn).not.toHaveBeenCalled();
  });

  it('getProjectId fetches from gcloud if not provided', async () => {
    const mockChild: any = new EventEmitter();
    mockChild.stdout = new EventEmitter();
    mockChild.stderr = new EventEmitter();

    (spawn as any).mockReturnValue(mockChild);

    const promise = getProjectId();

    mockChild.stdout.emit('data', 'auto-project');
    mockChild.emit('close', 0);

    const result = await promise;
    expect(result).toBe('auto-project');
  });
});
