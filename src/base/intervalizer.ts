import { Config, Interval } from '#manager';

// Intervalizer interface.
export default interface Intervalizer {
    run: () => Promise<void>;
    default: Intervalizer;
}

export default class Intervalizer {
    public constructor() {

        // Emit a refresh event.
        win.webContents.send('event', { key: 'refresh', value: Date.now(), preloader: false });

        // Clear all intervals.
        Intervalizer.clear();

        // Load all intervals.
        Intervalizer.load();
    }

    /**
     * Clear all intervals.
     * 
     * @return {void}
     */
    private static clear(): void {
        for (const interval in Config.intervals) clearInterval(win.intervals[interval]);
    }

    /**
     * Load all intervals.
     * 
     * @return {Promise<void>}
     */
    private static async load(): Promise<void> {
        for (const event in win.events) win.events[event].run().then(() => setInterval(() => win.events[event].run(), Interval(event)))
    }
}
