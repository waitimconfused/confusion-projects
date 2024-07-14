import * as toolbelt from "../toolbelt/toolbelt.js";
import { Point2, Point3, Point4 } from "./points.js";
export { Point2, Point3, Point4 };

export class Camera {
	position = { x: 0, y: 0 };
	zoom = 1;
	
	moveTo(x=0, y=0) {
		this.position.x = x;
		this.position.y = y;
	}

	script() {}

	update() {
		this.script();
	}
}
export class Keyboard {
	keys = {};

	constructor() {
		document.addEventListener("keydown", (e) => {
			this.setKey(e.key, true);
		});
		document.addEventListener("keyup", (e) => {
			this.setKey(e.key, false);
		});
	}

	isKeyPressed(...keys) {
		let hasKeyPressed = false;
		for(let i = 0; i < keys.length; i++) {
			let key = keys[i];
			if(key.length == 1) key = key.toUpperCase();
			if(this.keys[key]) hasKeyPressed = true;
		}
		return hasKeyPressed;
	}
	setKey(key="", value=false) {
		if(key.length == 1) key = key.toUpperCase();
		this.keys[key] = value;
	}
}

export class EngineClass {
	camera = new Camera;
	keyboard = new Keyboard;

	canvas = document.createElement("canvas");

	components = {};
	componentHashes = [];
	isPixelArt = false;

	stats = {
		fps: 0,
		delta: 0
	}
	#lastCalledTime = 0;

	loadAsset = toolbelt.image.cacheImage;

	#resizeCanvas() {
		let width = window.innerWidth;
		let height = window.innerHeight;

		let prevCanvasWidth = this.canvas.width;
		let prevCanvasHeight = this.canvas.height;

		this.canvas.width = width;
		this.canvas.height = height;

		this.canvas.style.width = "var(--width)";
		this.canvas.style.height = "var(--height)";
		this.canvas.style.setProperty('--width', `${width}px`);
		this.canvas.style.setProperty('--height', `${height}px`);

		if(this.canvas.onresize) {
			if(width != prevCanvasWidth || height != prevCanvasHeight) this.canvas.onresize();
		}
	}
	#updateStats() {
		this.stats.timestamp = Date.now();
		this.stats.delta = (this.stats.timestamp - this.#lastCalledTime) / 1000;
		this.#lastCalledTime = this.stats.timestamp;
		this.stats.fps = Math.round(1 / this.stats.delta);
	}
	constructor() {
		document.body.style.backgroundColor = "#232323";
		document.body.appendChild(this.canvas);
		this.canvas.style.position = "fixed";
		this.canvas.style.borderRadius = "0px";
		this.canvas.style.top = "0px";
		this.canvas.style.left = "0px";
		window.addEventListener("resize", () => {
			this.#resizeCanvas();
		});
		this.#resizeCanvas();
		this.tick();
	}

	addObject(component=new Component) {
		if(component instanceof Component == false) throw new Error("Cannot add object to engine if object is not of type: Component");
		if(this.hasObject(component)) throw new Error("Cannot add object to engine if object was already added.");
		let randomToken = "";
		while(this.componentHashes.includes(randomToken) || randomToken.length < 14) {
			randomToken = `${Math.floor(Math.random() * 9999)}`;
			while(randomToken.length < 10) randomToken += Math.floor(Math.random() * 10);
			randomToken = btoa(randomToken).replace(/==$/, "");
		}
		component.hash = randomToken;
		this.componentHashes.push(randomToken);
		this.components[randomToken] = component;
		let fakeContext = document.createElement("canvas").getContext("2d");
		component.render(fakeContext);
		component.script();
	}
	hasObject(component=new Component) {
		if(component instanceof Component == false) throw new Error("Cannot find object in engine if object is not of type: Component");
		let indexOfComponent = this.componentHashes.indexOf(component.hash);
		return indexOfComponent > -1;
	}
	getObject(hash) {
		if(hash instanceof String == false) throw new Error("Cannot find object in engine if hash is not of type: String");
		let indexOfComponent = this.componentHashes.indexOf(hash);
		return this.components[indexOfComponent];
	}
	removeObject(component=new Component) {
		if(component instanceof Component == false) throw new Error("Cannot remove object to engine if object is not of type: Component");
		if(this.hasObject(component) == false) throw new Error("Cannot remove object from engine if object was never added");
		let indexOfComponent = this.componentHashes.indexOf(component.hash);
		this.componentHashes.splice(indexOfComponent, 1);
		delete this.components[component.hash];
	}

	#disableZoomFunction = (e=new WheelEvent) => {
		if(e.target == this.canvas) e.preventDefault();
	}

	disableZoom() {
		window.addEventListener('wheel', this.#disableZoomFunction, {passive: false});
	}
	enableZoom() {
		// window.addEventListener('wheel', (e) => {
		// 	if(e.target == this.canvas) e.preventDefault();
		// }, {passive: false});
		window.removeEventListener("wheel", this.#disableZoomFunction);
	}

	setBackground(colour="") {
		this.canvas.style.backgroundColor = colour;
	}
	setIcon(href="") {
		document.querySelector("link[rel=icon]").href = href;
	}

	tick() {
		this.camera.update();
		this.#updateStats();

		let context = this.canvas.getContext("2d");
		if(this.isPixelArt) {
			this.canvas.style.imageRendering = "pixelated";
		}else{
			this.canvas.style.imageRendering = null;
		}

		context.msImageSmoothingEnabled = this.isPixelArt;
		context.mozImageSmoothingEnabled = this.isPixelArt;
		context.webkitImageSmoothingEnabled = this.isPixelArt;
		context.imageSmoothingEnabled = this.isPixelArt;

		context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		let numberOfComponents = this.componentHashes.length;
		for(let i = 0; i < numberOfComponents; i ++) {
			let hash = this.componentHashes[i];
			let component = this.components[hash];
			component.script(component);
			component.render(context);
		}
		window.requestAnimationFrame(() => {
			this.tick();
		});
	}
}
export const engine = new EngineClass;


export class Component {
	hash = "";
	display = new Point4(0, 0, 100, 100);
	transform = new Point2(0.5, 0.5);

	#attributes = {};

	getType() { return "Default Component"; }

	moveTo(x=0, y=0) {
		this.display.x = x;
		this.display.y = y;
		return this;
	}
	moveBy(x=0, y=0) {
		this.display.x += x;
		this.display.y += y;
		return this;
	}

	setSize(w=0, h=0) {
		this.display.w = w;
		this.display.h = h;
		return this;
	}

	script() {}
	render() {
		this.script();
		return this;
	}

	setAttribute(name="", value) {
		this.#attributes[name] = value;
		return this;
	}
	getAttribute(name="") {
		return this.#attributes[name];
	}

	remove() {
		engine.removeObject(this);
		return undefined;
	}
}

export class ComponentGroup extends Component {

	display = new Point2(0, 0);

	componentHashes = [];
	components = {};

	getType() {
		return "Component Group";
	}

	setSize() {
		throw new Error("The setSize() function is not supported with type ComponentGroup")
	}

	constructor() {
		super();
		delete this.setSize
	}
	
	addObject(component=new Component) {
		if(engine.hasObject(component)) engine.removeObject(component);
		if(component instanceof Component == false) throw new Error("Cannot add object to group if object is not of type: Component");
		if(this.hasObject(component)) throw new Error("Cannot add object to group if object was already added.");
		let randomToken = "";
		while(this.componentHashes.includes(randomToken) || randomToken.length < 14) {
			randomToken = `${Math.floor(Math.random() * 9999)}`;
			while(randomToken.length < 10) randomToken += Math.floor(Math.random() * 10);
			randomToken = btoa(randomToken).replace(/==$/, "");
		}
		component.hash = randomToken;
		this.componentHashes.push(randomToken);
		this.components[randomToken] = component;
		let fakeContext = document.createElement("canvas").getContext("2d");
		component.render(fakeContext);
		component.script();
	}
	getObject(hash="") {
		return this.components[hash];
	}
	hasObject(component=new Component) {
		if(component instanceof Component == false) throw new Error("Cannot find object in group if object is not of type: Component");
		let indexOfComponent = this.componentHashes.indexOf(component.hash);
		return indexOfComponent > -1;
	}
	removeObject(component=new Component) {
		if(component instanceof Component == false) throw new Error("Cannot remove object to group if object is not of type: Component");
		if(this.hasObject(component) == false) throw new Error("Cannot remove object from group if object was never added");
		let indexOfComponent = this.componentHashes.indexOf(component.hash);
		this.componentHashes.splice(indexOfComponent, 1);
		this.components.splice(indexOfComponent, 1);
	}

	render(context=new CanvasRenderingContext2D) {
		let numberOfComponents = this.componentHashes.length;
		for(let i = 0; i < numberOfComponents; i ++) {
			let hash = this.componentHashes[i];
			let component = this.components[hash];
			component.script(component);
			component.render(context, this.display);
		}
	}
}