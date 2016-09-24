import * as express from 'express';
import { Request, Response } from 'express';
import { Server } from 'http';
import * as bodyParser from 'body-parser';
import Redis from './redis';
import * as crypto from 'crypto';

export interface User {
	email: string;
	hashed: string;
	salt: string;
}

class App {
	
	port = 8080;
	
	app = express();
	redis = new Redis();
	
	server: Server;
	
	constructor() {
		this.catch(this.init());
	}
	
	async init() {
		this.app.use(bodyParser.json({
			type: 'application/json'
		}));
		this.attach('/login', this.login);
	}
	
	random(length = 32) {
		return new Promise<string>((resolve, reject) => {
			crypto.randomBytes(length, (err, buf) => {
				if (err) {
					return reject(err);
				}
				resolve(buf.toString('base64').replace(/\//g,'_').replace(/\+/g,'-'));
			})
		});
	}
	
	hash(text: string) {
		return crypto.createHash('sha256').update(text).digest('hex');
	}
	
	async generateToken() {
		while (true) {
			const token = await this.random();
			const check = await this.redis.get(`token-${token}`);
			if (!check) {
				return token;
			}
		}
	}
	
	async login(req: Request, res: Response): Promise<{error: string} | {token: string}> {
		const email: string = req.body.email;
		const password: string = req.body.password;
		if (!email || !password) {
			return {
				error: 'No email or password'
			};
		}
		const user: User = await this.redis.getJSON(`user-${email}`);
		if (user) {
			if (this.hash(`${user.salt}${password}`) === user.hashed) {
				const token = await this.generateToken();
				await this.redis.set(`token-${token}`, email);
				return {
					token: token
				};
			}
			return {
				error: 'Login failed'
			};
		}
		
		const salt = await this.random();
		const newUser: User = {
			email: email,
			salt: salt,
			hashed: this.hash(`${salt}${password}`)
		};
		await this.redis.setJSON(`user-${email}`, newUser);
		const token = await this.generateToken();
		await this.redis.set(`token-${token}`, user.email);
		return {
			token: token
		};
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
		handler = handler.bind(this);
		this.app[method](path, (req, res) => {
			handler(req, res).catch(err => {
				res.send({
					error: err.toString()
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
