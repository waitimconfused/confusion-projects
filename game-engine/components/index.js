import { Component, Point2, engine } from "../utils.js";

export class ComponentGroup extends Component {

	display = new Point2(0, 0);
	displayOffset = new Point2(0, 0);

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
	
	/**
	 * @param {Component} components
	 */
	addObject(...components) {
		for (let i = 0; i < components.length; i ++) {
			let component = components[i];
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
			component.script(component);
		}
		return this;
	}
	/**
	 * 
	 * @param {string} hash
	 * @returns { Component }
	 */
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
		return this;
	}

	render(context=new CanvasRenderingContext2D, defaultOffset=new Point2) {
		
		if (!this.visibility) return this;

		let offset = { x: 0, y: 0 };

		offset.x += defaultOffset.x;
		offset.y += defaultOffset.y;

		if(this.cameraTracking) {
			engine.camera.moveTo(this.display.x, this.display.y);
			this.fixedPosition = false;
		}

		if(!this.fixedPosition) {
			offset.x -= engine.camera.position.x;
			offset.y -= engine.camera.position.y;
			offset.x += engine.canvas.width / 2;
			offset.y += engine.canvas.height / 2;
		}

		this.displayOffset.x = this.display.x + offset.x;
		this.displayOffset.y = this.display.y + offset.y;

		if(engine.isPixelArt){
			this.displayOffset.x = Math.floor(this.displayOffset.x);
			this.displayOffset.y = Math.floor(this.displayOffset.y);
			this.displayOffset.x = Math.floor(this.displayOffset.x);
		}

		let numberOfComponents = this.componentHashes.length;
		for(let i = 0; i < numberOfComponents; i ++) {
			let hash = this.componentHashes[i];
			let component = this.components[hash];
			component.script(component);
			component.render(context, this.display);
		}
	}
}


export { Rect } from "./Rect.js";
export { Circle } from "./Circle.js";
export { Image } from "./Image.js";
export { Text } from "./Text.js";
export { Path } from "./Path.js";