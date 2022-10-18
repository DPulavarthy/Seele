// Import dependencies.
import { Intervalizer, Options } from '#manager';
import { promise as ping } from 'ping'

export default class Ips extends Intervalizer {

    /**
     * Execute the module logic.
     * 
     * @return {Promise<void>}
     */
    public static async run(): Promise<void> {

        // Device list.
        const devices = []

        for await (const device of Options('ips')) {

            // Ping the device.
            const { alive } = await ping.probe((device as { ip: string }).ip);

            // Push the device to the list.
            devices.push({ ...(device as object), alive });
        }

        // Emit the ips event.
        win.webContents.send('event', { key: 'ips', value: devices });
    }
}
