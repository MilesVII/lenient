import * as fs from "fs";

export const MAX_W = 512;
export const MAX_H = 512;

export function safe(cb){
	try {
		return cb();
	} catch(e){
		return null;
	}
}

export function safeParse(str){
	return safe(() => JSON.parse(str));
}

export function last(arr){
	return arr[arr.length - 1];
}

export function chonks(src, length){
	let r = [];
	for (let i = 0; i < src.length; i += length) r.push(src.slice(i, i + length))
	return r;
}

export function loadMeta(){
	const path = "./dataset/images.json";
	if (!fs.existsSync(path)) return [];
	const data = fs.readFileSync(path);
	return safeParse(data.toString()) || [];
}

export function saveMeta(data){
	const path = "./dataset/images.json";
	fs.rmSync(path, {force: true});
	fs.writeFileSync(path, JSON.stringify(data), {flag: "w"});
}

export function phetchV2(url, options = {}, payload, cl = https){
	return new Promise(resolve => {
		options.method = options.method || "GET";

		const req = cl.request(url, options, res => {
			let responseData = [];
			res.on('data', chunk => {
				responseData.push(chunk);
			});
			res.on('end', () => {
				const buf = Buffer.concat(responseData);
				const str = buf.toString();
				resolve({
					status: res.statusCode,
					headers: res.headers,
					body: buf,
					parsed: {
						json: safeParse(str),
						text: str
					}
				});
			});
		});

		if (payload) req.write(payload);

		req.end()
	});
}