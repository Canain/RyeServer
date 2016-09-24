import * as express from 'express';
import { Request, Response } from 'express';
import { Server } from 'http';
import * as bodyParser from 'body-parser';

class App {
	
	port = 8080;
	
	app = express();
	
	server: Server;
	
	constructor() {
		this.catch(this.init());
	}
	
	async init() {
		this.app.use(bodyParser.json());
		this.attach('/venmo', this.venmo, 'get');
	}
	
	async venmo(req: Request, res: Response) {
		return req.query;
	}
	
	listen() {
		this.server = this.app.listen(this.port, () => {
			console.log(`Listening on port ${this.server.address().port}`);
		});
	}
	
	catch(promise: Promise<any>) {
		return promise.catch(e => console.error(e));
	}
	
	attach(path: string, handler: (req, res) => Promise<any>, method = 'post') {
		this.app[method](path, (req, res) => {
			handler(req, res).catch(err => {
				res.send({
					error: err
				});
			}).then(result => {
				if (result) {
					res.send(result);
				}
			});
		});
	}
}

new App().listen();
