import { getValue } from "../../toolbelt/lib/units.js";
import { parseColour, Range } from "../../toolbelt/toolbelt.js";
import { Component, Point2, engine } from "../utils.js";


export class Circle extends Component {
	display = new Point2(0, 0);
	displayOffset = new Point2(0, 0);
	radius = 100;
	colour = "purple";
	/**
	 * @type {{
	 * colour: string,
	 * size: number,
	 * lineCap: "butt" | "round" | "square",
	 * lineJoin: "miter" | "round" | "bevel" | "miter-clip" | "arcs",
	 * }}
	 */
	outline = { colour: "black", size: "5 / 100cz", lineCap: "round", lineJoin: "round" };
	/**
	 * @type {{
	 * colour: string,
	 * blur: number|string,
	 * offset: { x: number|string, y: number|string }
	 * }}
	 */
	shadow = { colour: "black", blur: 0, offset: { x: 0, y: 0 } };

	/** @type {"disc" | "pie" | "ring" | "arc"} Default value is `"disc"`*/
	mode = "disc";

	/** @type {number} Applies when `mode` is `"pie"` or `"arc"`. Starting angle of circle, in radians */
	startAngle = 0;

	/** @type {number} Applies when `mode` is `"pie"` or `"arc"`. Ending angle of circle, in radians */
	endAngle = Math.PI * 2;

	/** @type {?number} Applies when `mode` is `"ring"`  `"angle"`. If `null`, `innerRadius` will be `radius / 2` */
	innerRadius = null;

	getType(){ return "Circle"; }

	/**
	 * @param {CanvasRenderingContext2D} context
	 * @param {{x: 0, y: 0}} defaultOffset
	 */
	render(context, defaultOffset){

		if (!defaultOffset) defaultOffset = {x: 0, y: 0};
		
		if (!this.visibility) return this;

		let colour = parseColour(this.colour);
		let outlineColour = parseColour(this.outline.colour);

		let destinationX = getValue( this.display.x );
		let destinationY = getValue( this.display.y );
		let radius = getValue( this.radius );
		let innerRadius = getValue(this.innerRadius) ?? radius/2;
		let outlineSize = getValue(this.outline.size);
		destinationX += defaultOffset.x;
		destinationY += defaultOffset.y;

		innerRadius = Range.clamp(0, innerRadius, radius);

		innerRadius = radius / 2;

		if(engine.isPixelArt){
			destinationX = Math.floor(destinationX);
			destinationY = Math.floor(destinationY);
		}
		
		context.save();
		if (!this.fixedPosition) {
			destinationX -= engine.camera.position.x;
			destinationY -= engine.camera.position.y;
			if (this.isPixelArt == true || (this.isPixelArt == "unset" && engine.isPixelArt)) {
				context.translate(Math.round(engine.canvas.width / 2), Math.round(engine.canvas.height / 2));
				context.scale(Math.round(engine.camera.zoom), Math.round(engine.camera.zoom));
			} else {
				context.translate(engine.canvas.width / 2, engine.canvas.height / 2);
				context.scale(engine.camera.zoom, engine.camera.zoom);
			}
		}

		let startAngle = 0;
		let endAngle = Math.PI * 2;
		let counterClockwise = false;

		if (this.mode == "pie" || this.mode == "arc") {
			startAngle = this.startAngle;
			endAngle = this.endAngle;
			counterClockwise = (endAngle < startAngle);
		}

		context.beginPath();
		context.fillStyle = colour;
		context.strokeStyle = outlineColour;
		context.lineWidth = outlineSize;
		context.lineCap = this.outline.lineCap;
		context.lineJoin = this.outline.lineJoin;
		if (this.mode == "pie") {
			context.moveTo(destinationX, destinationY);
		}
		context.arc(destinationX, destinationY, radius, startAngle, endAngle, counterClockwise);
		if (this.mode == "ring" || this.mode == "arc") {
			context.lineTo(destinationX, destinationY);
			context.closePath();
			context.fill();

			context.globalCompositeOperation = "destination-out";
			context.beginPath();
			context.arc(destinationX, destinationY, innerRadius, 0, Math.PI*2, counterClockwise);
			// context.lineTo(destinationX, destinationY);
		}
		if (this.mode == "pie") {
			context.lineTo(destinationX, destinationY);
		}
		context.closePath();

		context.fill();
		context.globalCompositeOperation = "source-over";
		
		if (outlineSize > 0) {
			context.beginPath();
			context.arc(destinationX, destinationY, radius, startAngle, endAngle, counterClockwise);
			context.arc(destinationX, destinationY, innerRadius, endAngle, startAngle, !counterClockwise);
			context.lineTo(
				destinationX + Math.cos(startAngle) * radius,
				destinationY + Math.sin(startAngle) * radius
			);
			context.stroke();
		}

		context.restore();
	}
}


// export class ComponentPoint2 extends Circle {
// 	point2 = new Point2

// 	/**
// 	 * 
// 	 * @param { number } x
// 	 * @param { number } y
// 	 */
// 	constructor(x, y) {
// 		this.point2.x = x;
// 		this.point2.y = y;

// 		this.radius = 10;
// 		this.colour = "rgba(199, 68, 64, 1)";
// 		this.outline.colour = "rgba(199, 68, 64, 0.5)";
// 		this.outline.size = 10;
// 	}

// 	render() {
// 		this.radius = 10 / engine.camera.zoom;
// 		this.outline.size = 10 / engine.camera.zoom;

// 		let mouse = engine.mouse.toWorld();

// 		let distanceToMouse = Math.hypot(this.display.x - mouse.x, this.display.y - mouse.y);
// 		let hovering = distanceToMouse <= this.radius;

// 		if (
// 			this.getAttribute("dragging") == true ||
// 			(engine.mouse.click_l && hovering && hasHoveringDot == false)
// 		) {
// 			this.moveTo(mouse.x, mouse.y);
// 			this.setAttribute("dragging", engine.mouse.click_l);
// 			// hasHoveringDot = engine.mouse.click_l;
// 		}

// 		if (typeof startCircle.display.x != "number") {
// 			console.log("BROKEN!", {
// 				dot: this.display,
// 				mouse
// 			});
// 			this.display.y = this.display.x.y;
// 			this.display.x = this.display.x.x;
// 		}

// 		if (!this.visibility) return this;

// 		let offset = { x: 0, y: 0 };

// 		if(["", "none"].includes(this.colour)) this.colour = "transparent";

// 		offset.x += defaultOffset.x;
// 		offset.y += defaultOffset.y;

// 		if(!this.fixedPosition) {
// 			offset.x -= engine.camera.position.x;
// 			offset.y -= engine.camera.position.y;
// 		}

// 		this.displayOffset.x = this.display.x + offset.x;
// 		this.displayOffset.y = this.display.y + offset.y;

// 		if(engine.isPixelArt){
// 			this.displayOffset.x = Math.floor(this.displayOffset.x);
// 			this.displayOffset.y = Math.floor(this.displayOffset.y);
// 			this.displayOffset.x = Math.floor(this.displayOffset.x);
// 		}
		
// 		context.save();
// 		if (!this.fixedPosition) {
// 			if (this.isPixelArt == true || (this.isPixelArt == "unset" && engine.isPixelArt)) {
// 				context.translate(Math.round(engine.canvas.width / 2), Math.round(engine.canvas.height / 2));
// 				context.scale(Math.round(engine.camera.zoom), Math.round(engine.camera.zoom));
// 			} else {
// 				context.translate(engine.canvas.width / 2, engine.canvas.height / 2);
// 				context.scale(engine.camera.zoom, engine.camera.zoom);
// 			}
// 		}

// 		context.beginPath();
// 		context.fillStyle = this.colour;
// 		context.strokeStyle = this.outline.colour;
// 		context.lineWidth = this.outline.size;
// 		context.arc(this.displayOffset.x, this.displayOffset.y, this.radius, 0, 2 * Math.PI);
// 		context.fill();
// 		if(this.outline.size > 0) context.stroke();
// 		context.closePath();

// 		context.restore();
// 	}
// }