import * as https from "https";
import * as http from "http";
import * as fs from "fs";
import sharp from "sharp";

import { MAX_W, MAX_H, saveMeta, loadMeta, last, safeParse, phetchV2 } from "./commons.js"

async function dl(url){
	const filename = last(url.split("/")).split(".")[0] + ".avif";
	const path = `./dataset/images/${filename}`;
	if (fs.existsSync(path)) return filename;
	const mirror = `http://localhost:3000/api/imgproxy?w=1024&h=1024&url=${url}`;
	const response = await phetchV2(mirror, undefined, undefined, http);
	if (response.status > 299){
		console.error(response);
		return null;
	}
	//console.log(url);
	try{
		fs.writeFileSync(path, response.body);
		return filename;
	} catch (e) {console.error(url); return null;}
}

async function main(){
	// const newResponse = await phetchV2(
	// 	"http://localhost:3000/api/prinzeugen/main", //"https://mikumiku.vercel.app/api/prinzeugen/main", 
	// 	{
	// 		method: "POST",
	// 		headers: {
	// 			"Content-Type": "application/json"
	// 		}
	// 	}, 
	// 	JSON.stringify({
	// 		"action": "getPool",
	// 		"user": 3
	// 	}),
	// 	http
	// );
	// console.log(`PE status ${newResponse.status}`);
	
	// const newList = newResponse.parsed.json.map(e => ({
	// 	link: e.message.image[0],
	// 	score: e.score
	// }));

	const newList = [];
	
	const oldList = loadMeta().filter(e => !newList.some(ne => ne.file == e.file));
	const list = newList.concat(oldList);
	let i = 0;
	for (let entry of list){
		entry.file = await dl(entry.link);
		++i;
		console.log(`downloaded ${i} of ${newList.length}`)
	}
	saveMeta(list)
}

main();