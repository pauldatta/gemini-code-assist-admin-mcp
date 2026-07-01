/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn } from 'child_process';

/**
 * Executes a gcloud command safely using spawn.
 * @param args Array of arguments for the gcloud command.
 * @returns The stdout of the command.
 */
export async function runGcloud(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn('gcloud', [...args, '-q']);
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data;
        });

        child.stderr.on('data', (data) => {
            stderr += data;
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout.trim());
            } else {
                reject(new Error(`gcloud command failed with code ${code}: ${stderr}`));
            }
        });

        child.on('error', (err) => {
            reject(new Error(`Failed to start gcloud command: ${err.message}`));
        });
    });
}

/**
 * Executes a curl command safely using spawn.
 * @param args Array of arguments for the curl command.
 * @returns The stdout of the command.
 */
export async function runCurl(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn('curl', ['-s', ...args]);
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data;
        });

        child.stderr.on('data', (data) => {
            stderr += data;
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout.trim());
            } else {
                reject(new Error(`curl command failed with code ${code}: ${stderr}`));
            }
        });

        child.on('error', (err) => {
            reject(new Error(`Failed to start curl command: ${err.message}`));
        });
    });
}

/**
 * Gets the current project ID from gcloud config if not provided.
 */
export async function getProjectId(providedId?: string): Promise<string> {
    if (providedId) return providedId;
    try {
        const projectId = await runGcloud(['config', 'get-value', 'project']);
        if (!projectId) throw new Error('No project ID provided and no default project set in gcloud.');
        return projectId;
    } catch (error: any) {
        throw new Error(`Failed to get current project ID: ${error.message}`);
    }
}
