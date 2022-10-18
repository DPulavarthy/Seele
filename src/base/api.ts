import express from 'express';
import cors from 'cors'

export default interface Api {
    app: express.Application;
}

export default class Api {
    private static get port(): number {
        return 3000;
    }

    public constructor() {
        this.app = express();
        this.app.use(cors());
        this.load();
        this.init();
    }

    private load(): void {
        this.app.post('/restart', (req, res) => {
            win.webContents.send('event', { key: 'refresh', value: Date.now(), preloader: true });
            res.status(200).send();
        })
    }

    private init(): void {
        this.app.listen(Api.port, () => console.log(`Listening on port ${Api.port}`));
    }
}