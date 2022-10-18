// Import dependencies.
import { Intervalizer, System } from '#manager';
import { powerMonitor } from 'electron';

export default class Bat extends Intervalizer {

    /**
     * Execute the module logic.
     * 
     * @return {Promise<void>}
     */
    public static async run(): Promise<void> {

        // Get the battery value.
        const { percent } = await System.battery();

        // Emit the bat event.
        win.webContents.send('event', { key: 'bat', value: +percent.toFixed(1), charging: !powerMonitor.onBatteryPower });
    }
}
