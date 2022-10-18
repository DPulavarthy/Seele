// Import dependencies.
import { app, BrowserWindow } from 'electron';
import { readFileSync } from 'fs';
import system from 'systeminformation';
import Seele from './base/app';

// Define configuration.
const config: { intervals: { [key: string]: number }, options: { [key: string]: string | ({ id: string, os: string, ip: string })[] } } = JSON.parse(readFileSync(`${__dirname.match(/.*Dashboard/g)?.shift()}/config.json`, 'utf8'));
const interval = (key: string): number => config.intervals[key.toLowerCase()];
const options = (key: string): string | ({ id: string, os: string, ip: string })[] => config.options[key.toLowerCase()];

// If the app is on windows then start a powershell instance. This way the 'systeminformation' module will only use one instance of powershell keeping CPU usage low.
process.platform === 'win32' && system.powerShellStart();

// Export app dependencies.
export { default as Intervalizer } from './base/intervalizer';
export { default as Preload } from './base/preload';
export { default as Api } from './base/api';
export { interval as Interval };
export { options as Options };
export { config as Config };
export { system as System };

// Create a new Seele instance.
app
    .on('ready', () => global.win = new Seele())
    .on('activate', () => (!BrowserWindow.getAllWindows().length ? app.emit('ready') : void 0));
