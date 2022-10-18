// Import dependencies.
import { Intervalizer, System } from '#manager';

export default class Cpu extends Intervalizer {

    /**
     * Execute the module logic.
     * 
     * @return {Promise<void>}
     */
    public static async run(): Promise<void> {

        // Get the CPU load value.
        const { currentLoad } = await System.currentLoad();

        // Emit the cpu event.
        win.webContents.send('event', { key: 'cpu', value: +currentLoad.toFixed(1) });
    }
}
