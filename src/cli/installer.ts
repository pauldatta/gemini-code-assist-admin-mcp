import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function runInteractiveInstaller() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const question = (query: string) => new Promise<string>((resolve) => rl.question(query, resolve));

    console.log('\n🚀 Welcome to the GCA Admin Helper Installer!');
    console.log('----------------------------------------------');

    console.log('\nWhat would you like to do?');
    console.log('1. Install Antigravity Plugin (MCP + Global Skills)');
    console.log('2. Add Workspace Skills (Project-local)');
    console.log('3. Run MCP Server (Standard Stdio)');
    console.log('4. Exit');

    const choice = await question('\nSelect an option (1-4): ');

    switch (choice) {
        case '1':
            await installAntigravityPlugin();
            break;
        case '2':
            await installWorkspaceSkills();
            break;
        case '3':
            console.log('\nStarting MCP server...');
            rl.close();
            return true; // Signal to start MCP server
        default:
            console.log('Goodbye!');
            process.exit(0);
    }

    rl.close();
    return false;
}

async function installAntigravityPlugin() {
    const home = process.env.HOME || process.env.USERPROFILE;
    if (!home) {
        console.error('Error: Could not find home directory.');
        return;
    }

    const agPluginDir = path.join(home, '.gemini/antigravity-cli/plugins/gca-admin');
    const sourcePluginDir = path.join(pkgRoot, 'plugins/gca-admin');

    try {
        if (!fs.existsSync(sourcePluginDir)) {
            console.error(`Error: Source plugin directory not found at ${sourcePluginDir}`);
            return;
        }

        fs.mkdirSync(agPluginDir, { recursive: true });
        
        // Copy plugin files
        const files = fs.readdirSync(sourcePluginDir);
        for (const file of files) {
            fs.copyFileSync(path.join(sourcePluginDir, file), path.join(agPluginDir, file));
        }

        console.log(`\n✅ Antigravity plugin installed to: ${agPluginDir}`);
        console.log('Restart Antigravity to see the new /gca commands!');
    } catch (err: any) {
        console.error(`\n❌ Installation failed: ${err.message}`);
    }
}

async function installWorkspaceSkills() {
    const cwd = process.cwd();
    const targetDir = path.join(cwd, '.agents/skills');
    const sourceSkill = path.join(pkgRoot, '.agents/skills/gca-admin.md');

    try {
        if (!fs.existsSync(sourceSkill)) {
            console.error(`Error: Source skill file not found at ${sourceSkill}`);
            return;
        }

        fs.mkdirSync(targetDir, { recursive: true });
        fs.copyFileSync(sourceSkill, path.join(targetDir, 'gca-admin.md'));

        console.log(`\n✅ Workspace skill added to: ${path.join(targetDir, 'gca-admin.md')}`);
        console.log('This project now supports /gca commands in Antigravity.');
    } catch (err: any) {
        console.error(`\n❌ Failed to add workspace skills: ${err.message}`);
    }
}
