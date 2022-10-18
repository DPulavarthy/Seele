// Import dependencies.
import { Intervalizer, System } from '#manager';

export default class App extends Intervalizer {
    
    /**
     * Execute the module logic.
     * 
     * @return {Promise<void>}
     */
    public static async run(): Promise<void> {

        // Store the memory values.
        const memory: { used: number, total: number } = { 
            used: 0,
            total: 0,
        };

        // Get the memory values.
        const data = await System.dockerContainerStats('*');

        // Loop through the containers.
        data.map(container => {
            memory.used += container.memUsage;
            memory.total += container.memLimit;
        });

        // Emit the app event.
        win.webContents.send('event', { key: 'app', value: +((memory.used * 100) / memory.total).toFixed(1) });
    }
}
