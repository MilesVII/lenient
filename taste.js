import * as tf from "@tensorflow/tfjs-node-gpu"
import sharp from "sharp";

import { MAX_W, MAX_H } from "./commons.js"

async function feed(file){
	const si = sharp(file)
		.resize({
			width: MAX_W,
			height: MAX_H,
			fit: "contain",
			background: { r: 255, g: 255, b: 255 }
		})
		.removeAlpha();
	const data = await si.raw({depth: "uchar"}).toBuffer();
	const normaled = new Float32Array(data);
	normaled.forEach((value, index, array) => {
		array[index] = value / 255;
	});
	return tf.tensor(normaled, [MAX_W, MAX_H, 3]).expandDims(0);
}

async function main(){
	const model = await tf.loadLayersModel("file://./models/m1_2853/model.json")
	const paths = [
		"./samples/sample_d17f298cc20808efce9653387be51467.jpg"
	];
	for (let p of paths){
		const x = await feed(p);
		const y = await model.predict(x).array()
		console.log(y[0]);
	}
}


main();