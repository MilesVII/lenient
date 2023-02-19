import * as tf from "@tensorflow/tfjs-node-gpu"
import sharp from "sharp";

import { MAX_W, MAX_H, loadMeta, chonks } from "./commons.js"
const SPLIT = .90;
const CHUMNKIFY = true;
const CHOMNK_SIZE = 4;

async function feed(meta){
	const si = sharp(`./dataset/images/${meta.file}`)
		.resize({
			width: MAX_W,
			height: MAX_H,
			fit: "contain",
			background: { r: 255, g: 255, b: 255 }
		})
		.removeAlpha();
	//const dims = await si.metadata();
	const data = await si.raw({depth: "uchar"}).toBuffer();
	//const normaled = Array.from(data).map(px => px / 255);
	const normaled = new Float32Array(data);
	normaled.forEach((value, index, array) => {
		array[index] = value / 255;
	});
	return {
		xs: tf.tensor(normaled, [MAX_W, MAX_H, 3]).expandDims(0),
		ys: tf.tensor2d([meta.score], [1, 1])
	};
}

const metas = await loadMeta();
tf.util.shuffle(metas);
const splitIndex = metas.length * SPLIT;
const trainMetas = metas.slice(0, splitIndex);
const validationMetas = metas.slice(splitIndex);

async function main(){
	console.log("building");

	const model = tf.sequential();
	model.add(tf.layers.conv2d({
		inputShape: [MAX_W, MAX_H, 3],
		filters: 16,
		kernelSize: 3,
		activation: "relu",
		padding: "same"
	}));
	model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
	model.add(tf.layers.flatten());
	//model.add(tf.layers.dense({units: 128, activation: 'relu'}));
	model.add(tf.layers.dense({units: 64, activation: 'relu'}));
	model.add(tf.layers.dense({units: 32, activation: 'relu'}));
	model.add(tf.layers.dense({units: 1, outputShape: [1, 1]}));

	console.log("compiling");

	// Compile the model
	model.compile({
		optimizer: "adam",
		loss: tf.losses.meanSquaredError,
		metrics: ['accuracy']
	});

	console.log("training");
	const validationData = await Promise.all(validationMetas.map(m => feed(m)));
	const validationDataset = tf.data.array(validationData);
	
	let i = 0;
	const losses = [];
	if (CHUMNKIFY){
		const chunks = chonks(trainMetas, CHOMNK_SIZE);
		for (let m of chunks) {
			const batch = await Promise.all(m.map(x => feed(x)));
			await model.fitDataset(tf.data.array(batch), {
				epochs: 1,
				verbose: 0,
				callbacks: {
					onEpochEnd: (epoch, logs) => losses.push(logs.loss)
				}
			});
			console.log(`${Math.round(++i / chunks.length * 100)}%`)
		}
	} else {
		for (let m of trainMetas) {
			const data = await feed(m);
			await model.fit(data, {
				epochs: 3,
				verbose: 0,
				callbacks: {
					onEpochEnd: (epoch, logs) => losses.push(logs.loss)
				}
			});
			console.log(`${Math.round(++i / trainMetas.length * 100)}%`)
		}
	}
	console.log("fit complete");
	await model.save("file://./models/m2.g_2853_fat");

	console.log("loss stats:");
	console.log(losses.join(" "));
	const result = await model.evaluateDataset(validationDataset);
	console.log(`Finals after validation: ${result}`);
}


main();