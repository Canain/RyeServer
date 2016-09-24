import * as redis from 'redis';

export default class Redis {
	
	prefix = 'rye-';
	
	redis = redis.createClient();
	
	constructor() {
		this.redis.on('error', e => console.error(e));
	}
	
	localize(key: string, noprefix?: boolean) {
		return noprefix ? key : `${this.prefix}${key}`;
	}
	
	get(key: string, noprefix?: boolean) {
		return new Promise<string>((resolve, reject) => {
			this.redis.get(this.localize(key, noprefix), (err, reply) => {
				if (err) {
					return reject(err);
				}
				resolve(reply);
			});
		});
	}
	
	getJSON(key: string, noprefix?: boolean) {
		return this.get(this.localize(key, noprefix)).then(r => r ? JSON.parse(r) : null);
	}
	
	set(key: string, value: string, noprefix?: boolean) {
		return new Promise<void>((resolve, reject) => {
			this.redis.set(this.localize(key, noprefix), value, err => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
		});
	}
	
	setJSON(key: string, value, noprefix?: boolean) {
		return this.set(this.localize(key, noprefix), JSON.stringify(value));
	}
	
	quit() {
		this.redis.quit();
	}
}
