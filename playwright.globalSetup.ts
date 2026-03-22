import { execSync } from 'child_process';

export default async function globalSetup(): Promise<void> {
    console.log('Building extension (dev mode)...');
    execSync('yarn build:dev', { stdio: 'inherit' });
    console.log('Extension built.');
}
