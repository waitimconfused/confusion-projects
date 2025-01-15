import { draw as drawImage } from "../../toolbelt/lib/image.js";
import { toRange } from "../../toolbelt/toolbelt.js";
import { Component, engine, Point2, Point4 } from "../utils.js";
import { AnimationCluster } from "../animations.js";
import { SuperGif } from "../../libgif.js";

export class Image extends Component {
	#cameraTracking = false;
	#type = "Image";
	crop = new Point4(0, 0);
	colour = "white";
	opacity = 1;
	/**
	 * @type {String | HTMLCanvasElement | HTMLImageElement | AnimationCluster}
	 */
	#source = "";

	/**
	 * ### Images
	 * All images (`.png`, `.jpeg`, ect.) will be automatically loaded and rendered.
	 * 
	 * ### GIFs
	 * If the source is a path to a GIF, the image will be converted to an `Image-Animation` type,
	 * and all GIF contents can be seen/modified within the `Image.animation` property.
	 * 
	 * The GIF frames and data will be located at: `Image.animation.animations["main"].frames`
	 * 
	 * > **WARNING** Due to the reliance on `Image.onload()` and GIF extraction libraries,
	 * > the `Image.animation` property will be "filled out" after these events complete. (Promise-ish)
	 * 
	 * ```js
	 * const image = new Image;
	 * engine.addObject(image);
	 * image.source = "/path/to/gif_file.gif";
	 * image.animation.fps = 7;
	 * 
	 * console.log(image.animation.animations["main"].frames);
	 * // {
	 * // 	source = String | HTMLCanvasElement | HTMLImageElement | AnimationCluster;
	 * // 	x = number;
	 * // 	y = number;
	 * // 	width = number;
	 * // 	height = number;
	 * // }[]
	 * ```
	 */
	set source(value) {
		if (typeof value == "string") engine.loadAsset(value);
		if (typeof value == "string" && value.endsWith(".gif")) {
			let isInitiallyVisible = this.visibility;
			this.visibility = false;

			this.#type = "Image-Animation";
			this.#source = "Image-Animation";
			this.animation = new AnimationCluster("loop", null, 15, { singleRef: true });

			let animation = this.animation.createAnimation("main");
			let promise = gifToSpritesheet(value); // Promise

			promise.then((spritesheet) => {

				for (let i = 0; i < spritesheet.frames.length; i++) {
					animation.pushFrame({
						source: spritesheet.frames[i],
						x: 0,
						y: 0,
						width: spritesheet.framesWidth,
						height: spritesheet.framesHeight
					});
				}

				this.visibility = isInitiallyVisible;
				this.animation.playAnimation("main");
			});
		} else {
			this.#source = value;
		}
	}
	get source() { return this.#source; };
	/**
	 * @type { undefined | AnimationCluster }
	 */
	animation = undefined;

	/** @type { number } In Degrees */
	rotation = 0;
	outline = { colour: "black", size: 0 };
	shadow = { colour: "black", blur: 0, offset: { x: 0, y: 0 } };

	getType() { return this.#type }

	/**
	 * @param {String|AnimationCluster|undefined} hook
	 */
	constructor(hook) {
		super();
		delete this.colour;

		if (hook instanceof AnimationCluster) {
			this.source = "Image-Animation";
			this.animation = hook.clone();
			this.#type = "Image-Animation";
			this.setSize(1, 1);
		}

		return this;
	}

	setSourcePath(path = "") {
		if (this.source instanceof AnimationCluster) throw new Error("Cannot set source of image if image is of type Image-Animation.");
		this.source = path;
		return this;
	}

	setCrop(x = 0, y = 0, w = 0, h = 0) {
		if (this.source instanceof AnimationCluster) throw new Error("Cannot crop image if image is of type Image-Animation.");
		this.crop.x = x;
		this.crop.y = y;
		this.crop.w = w;
		this.crop.h = h;
		return this;
	}

	render(context = new CanvasRenderingContext2D, defaultOffset = new Point2) {

		if (!this.visibility) return this;

		this.transform.x = toRange(0, this.transform.x, 1);
		this.transform.y = toRange(0, this.transform.y, 1);

		let destinationW = this.display.w;
		let destinationH = this.display.h;

		let currentFrame = null;

		if (this.source == "Image-Animation") {
			currentFrame = this.animation.currentFrame;
			destinationW *= currentFrame.width;
			destinationH *= currentFrame.height;
		}

		let offset = { x: 0, y: 0 };

		offset.x += defaultOffset.x;
		offset.y += defaultOffset.y;

		offset.x -= destinationW * this.transform.x;
		offset.y -= destinationH * this.transform.y;
		let destinationX = this.display.x + offset.x;
		let destinationY = this.display.y + offset.y;

		context.save();
		if (!this.fixedPosition) {
			if (this.isPixelArt == true || (this.isPixelArt == "unset" && engine.isPixelArt)) {
				context.translate(Math.floor(engine.canvas.width / 2), Math.floor(engine.canvas.height / 2));
				context.scale(Math.floor(engine.camera.zoom), Math.floor(engine.camera.zoom));
				destinationX = Math.floor(destinationX);
				destinationY = Math.floor(destinationY);
				destinationW = Math.floor(destinationW);
				destinationH = Math.floor(destinationH);
			} else {
				context.translate(engine.canvas.width / 2, engine.canvas.height / 2);
				context.scale(engine.camera.zoom, engine.camera.zoom);
			}
			context.translate(-engine.camera.position.x, -engine.camera.position.y);
		}
		context.translate(destinationX + destinationW * this.transform.x, destinationY + destinationH * this.transform.y);
		context.rotate(this.rotation * Math.PI / 180);
		context.translate(-destinationX - destinationW * this.transform.x, - destinationY - destinationH * this.transform.y);

		if (this.colour) {
			context.fillStyle = this.colour;
			context.fillRect(destinationX, destinationY, destinationW, destinationH);
		}

		let filters = {
			pixelated: (this.isPixelArt == true || (this.isPixelArt == "unset" && engine.isPixelArt)),
			alpha: this.opacity,
		};

		if (this.source == "Image-Animation") {
			drawImage(
				currentFrame.source,
				destinationX, destinationY, destinationW, destinationH,
				currentFrame.x, currentFrame.y, currentFrame.width, currentFrame.height,
				filters, engine.canvas
			);
		} else {
			drawImage(
				this.source,
				destinationX, destinationY, destinationW, destinationH,
				this.crop.x, this.crop.y, this.crop.w, this.crop.h,
				filters,
				engine.canvas
			);
		}

		context.restore();

		return this;
	}

}

/**
 * @param {string} source
 * @returns {Promise<{ asCanvas:()=>HTMLCanvasElement, frames:HTMLCanvasElement[], framesWidth:number, framesHeight:number, length:number>}
*/
function gifToSpritesheet(source) {

	return new Promise((resolve, reject) => {
		/** @type {HTMLImageElement} */
		let image = document.createElement("img");

		image.onload = () => {
			let rub = SuperGif({
				gif: image,
				progressbar_height: 0
			});

			let a = 0;
			rub.load(() => {
				/** @type {HTMLCanvasElement} */
				let canvas = document.createElement("canvas");
				let context = canvas.getContext("2d");

				let frameCount = rub.get_length();

				canvas.width = image.width * frameCount;
				canvas.height = image.height;

				/** @type {HTMLCanvasElement[]} */
				let frames = [];

				for (let i = 0; i < frameCount; i++) {
					rub.move_to(i);

					/** @type {HTMLCanvasElement} */
					let canvas = rub.get_canvas();

					let frame = document.createElement("canvas");
					frame.width = image.width;
					frame.height = image.height;
					frame.getContext("2d").drawImage(canvas, 0, 0, image.width, image.height);
					frames.push(frame);

					context.drawImage(canvas, i * image.width, 0, image.width, image.height);
				}

				canvas.remove();
				image.remove();
				resolve({
					asCanvas: function () { return canvas },
					frames: frames,
					framesWidth: image.width,
					framesHeight: image.height,
					length: frameCount,
				});
			});
		}

		image.src = source;
	});
}