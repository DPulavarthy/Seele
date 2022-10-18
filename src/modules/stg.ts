// Import dependencies.
import { Intervalizer, Options, System } from '#manager';

export default class Stg extends Intervalizer {

    /**
     * Execute the module logic.
     * 
     * @return {Promise<void>}
     */
    public static async run(): Promise<void> {

        // Get the memory values.
        const storage = await System.fsSize();
        const drive = storage.find(d => d.mount.is(Options('stg') as string)) || { used: 0, size: 0 };

        // Emit the stg event.
        win.webContents.send('event', { key: 'ram', value: +((drive.used * 100) / drive.size).toFixed(1) });
    }
}
