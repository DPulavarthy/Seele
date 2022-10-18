// Import dependencies.
import { BrowserWindow } from 'electron';
import { Intervalizer, Preload, Api } from '#manager';
import { readdirSync } from 'fs';

export default class Seele extends BrowserWindow {

    // Globally usable interval modules.
    public intervals: { [key: string]: NodeJS.Timer } = {};
    public events: { [key: string]: Intervalizer } = {};

    // Create a new window.
    public constructor() {
        super({
            titleBarStyle: 'hidden',
            autoHideMenuBar: true,
            show: false,
            // kiosk: true,
            width: 768,
            height: 1366,
            // fullscreen: true,
            alwaysOnTop: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        // Run some preloading (Should be done earlier if preload does anything important!!!).
        new Preload();

        // Start the API.
        new Api();

        // Initialize the window properties.
        this.init();
    }

    /**
     * Initialize the window properties.
     * 
     * @return {Promise<void>}
     */
    private async init(): Promise<void> {

        // Show the window on top of all other windows.
        this.setAlwaysOnTop(true, 'screen-saver');

        // Skip showing the taskbar icon.
        this.setSkipTaskbar(true);

        // Load the window content.
        this.loadFile('./web/pages/index.html');

        // Window ready to show event.
        this.on('ready-to-show', async () => {

            // Show the window.
            this.show();

            // Emit a uptime event.
            this.webContents.send('event', { key: 'uptime', value: Date.now() })

            // Load the modules.
            Seele.load();
        });
    }

    /**
     * Load all modules.
     * 
     * @return {Promise<void>}
     */
    private static async load(): Promise<void> {

        // Read the modules directory.
        const modules: string[] = readdirSync(`${__dirname.match(/.*Dashboard/g)?.shift()}/app/modules`).filter((file: string) => !file.endsWith('.d.ts'));

        // Import the modules.
        for await (const module of modules) win.events[module.split('.').shift() as string] = await import(`../modules/${module}`);
        for (const event in win.events) win.events[event] = win.events[event].default

        // Load the intervals.
        new Intervalizer();
    }
}
