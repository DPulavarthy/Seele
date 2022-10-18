// Import dependencies.
import { Intervalizer, System } from '#manager';

export default class Ram extends Intervalizer {

    /**
     * Execute the module logic.
     * 
     * @return {Promise<void>}
     */
    public static async run(): Promise<void> {

        // Get the memory values.
        const { used, total } = await System.mem();

        // Emit the ram event.
        win.webContents.send('event', { key: 'ram', value: +((used * 100) / total).toFixed(1) });
    }
}
