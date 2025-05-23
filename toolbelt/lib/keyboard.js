/**
 * @param { array } array 
 * @param { array } target 
 * @returns 
 */
function arrayIncludesArray(array, target) {
	return array.sort().join(',') === target.sort().join(',')
}

export var keyboard = new class Keyboard {

	/** @type {string[]} */
	list = [];
	/**
	 * If `key:string[]` it returns if **any** key is active
	 * @param  {...string} key 
	 * @returns {boolean}
	 */
	isPressed(...keys) {
		keys = this.#fixKeys(keys);
		return keys.some(r => this.list.includes(r));
	}
	constructor() {
		window.addEventListener("focus", (e) => {
			keyboard.list = [];
		});
		window.addEventListener("keydown", (e) => {
			let key = e.key.toLowerCase();
			if (!keyboard.list.includes(key)) {
				keyboard.setKey(key, true, e);
			}
			keyboard.setKey("control", e.ctrlKey, e);
			keyboard.setKey("shift", e.shiftKey, e);
			keyboard.setKey("alt", e.altKey, e);
		});
		window.addEventListener("keyup", (e) => {
			let key = e.key.toLowerCase();
			keyboard.setKey(key, false, e);
			keyboard.setKey("control", e.ctrlKey, e);
			keyboard.setKey("shift", e.shiftKey, e);
			keyboard.setKey("alt", e.altKey, e);
		});
	}
	/**
	 * @param { string } key 
	 * @param { boolean } value 
	 * @param { KeyboardEvent } keyboardEvent 
	 */
	setKey(key, value, keyboardEvent) {
		key = this.#fixKeys([key])[0];
		if (value == true && !this.isPressed(key)) {
			this.list.push(key);
			this.#triggerEventListeners(this.#eventListener_ON, keyboardEvent);
		} else if (value == false && this.isPressed(key)) {
			this.#triggerEventListeners(this.#eventListener_OFF, keyboardEvent);
			while (this.isPressed(key)) {
				this.list.splice(this.list.indexOf(key), 1);
			}
		}
	}
	/**
	 * @param { string[] } keys 
	 * @returns 
	 */
	#fixKeys(keys) {
		for (let i = 0; i < keys.length; i++) {
			let key = keys[i].toLowerCase();
			if (key == "ctrl") key = "control";
			if (key == "space") key = " ";
			if (key.includes("up") && !key.includes("page")) key = "arrowup";
			if (key.includes("down") && !key.includes("page")) key = "arrowdown";
			if (key.includes("left")) key = "arrowleft";
			if (key.includes("right")) key = "arrowright";

			if (key.includes("up") && key.includes("page")) key = "pageup";
			if (key.includes("down") && key.includes("page")) key = "pagedown";

			keys[i] = key;
		}
		return keys;
	}

	#eventListener_ON = [];
	#eventListener_OFF = [];

	/**
	 * @param {string | string[] | "*" | ["*"]} keys 
	 * @param { (e:KeyboardEvent) => {} } callback 
	 * @param {{
	 * 	passive: boolean
	 * }} options 
	 */
	on(keys, callback, options = {}) {
		if (options.passive == undefined) options.passive = true;
		if (typeof keys == "string") keys = [keys];
		keys = this.#fixKeys(keys);
		this.#eventListener_ON.push({
			keys,
			callback,
			options
		});
	}
	/**
	 * @param {string | string[] | "*" | ["*"]} keys 
	 * @param { (e:KeyboardEvent) => {} } callback 
	 * @param {{
	 * 	passive: boolean
	 * }} options 
	 */
	off(keys, callback, options = {}) {
		if (options.passive == undefined) options.passive = true;
		if (typeof keys == "string") keys = [keys];
		keys = this.#fixKeys(keys);
		this.#eventListener_OFF.push({
			keys,
			callback,
			options
		});
	}

	/**
	 * @param {{
	 * keys: string[],
	 * 	callback: (e:KeyboardEvent) => {},
	 * options: {
	 * 	passive: boolean
	 * }
	 * }[]} eventListners
	 * @param {KeyboardEvent} keyboardEvent
	**/
	#triggerEventListeners(eventListners, keyboardEvent) {
		let clearKeys = false;
		for (let index = 0; index < eventListners.length; index++) {
			let keybinding = eventListners[index];
			let hasWildCard = (keybinding.keys.length == 1 && keybinding.keys[0] == "*");
			let hasMatch = arrayIncludesArray(this.list, keybinding.keys) || hasWildCard;
			if (hasMatch) {
				if (keybinding.options?.passive == false) keyboardEvent.preventDefault();
				keybinding.callback(keyboardEvent);
				clearKeys = clearKeys || !keybinding.options?.passive;
			}
		}
		if (clearKeys) this.list = [];
	}
};

export var mouse = new class Mouse {
	click_l = false;
	click_r = false;

	pen = {
		pressure: 0,
	}

	#hooks = [];

	constructor() {
		window.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			mouse.click_r = true;
			mouse.updateHooks(e);
		});

		window.addEventListener("pointerdown", (e) => {
			if (e.pointerType == "touch") return;
			if (e.pointerType == "pen") e.preventDefault();
			mouse.position.x = e.clientX;
			mouse.position.y = e.clientY;
			mouse.click_l = true;
			mouse.pen.pressure = (e.pointerType == "pen") ? e.pressure : 0;
			mouse.updateHooks(e);
		});
		window.addEventListener("pointermove", (e) => {
			if (e.pointerType == "touch") return;
			if (e.pointerType == "pen") e.preventDefault();
			mouse.position.x = e.clientX;
			mouse.position.y = e.clientY;
			mouse.pen.pressure = (e.pointerType == "pen") ? e.pressure : 0;
			mouse.updateHooks(e);
		});
		window.addEventListener("pointerup", (e) => {
			if (e.pointerType == "touch") return;
			if (e.pointerType == "pen") e.preventDefault();
			mouse.position.x = e.clientX;
			mouse.position.y = e.clientY;
			mouse.click_l = false;
			mouse.pen.pressure = 0;
			mouse.updateHooks(e);
		});

		window.addEventListener("touchstart", (e) => {
			mouse.position.x = e.touches[0].clientX;
			mouse.position.y = e.touches[0].clientY;
			mouse.click_l = false;
			mouse.pen.pressure = 0;
			mouse.updateHooks(e);
		});
		window.addEventListener("touchmove", (e) => {
			mouse.position.x = e.touches[0].clientX;
			mouse.position.y = e.touches[0].clientY;
			mouse.click_l = true;
			mouse.updateHooks(e);
		});
		window.addEventListener("touchend", (e) => {
			mouse.position.x = e.touches[0].clientX;
			mouse.position.y = e.touches[0].clientY;
			mouse.click_l = false;
			mouse.updateHooks(e);
		});
		window.addEventListener("touchcancel", (e) => {
			mouse.position.x = e.touches[0].clientX;
			mouse.position.y = e.touches[0].clientY;
			mouse.click_l = false;
			mouse.updateHooks(e);
		});
	}

	/**
	 * 
	 * @param { object } options 
	 * @param { (e: MouseEvent, mouse: Mouse) => {} } options.updateFunc
	 */
	addHook(options) {
		if (typeof options?.updateFunc != "function") options.updateFunc = new Function;
		let hook = new MouseHook({
			x: this.position.x,
			y: this.position.y,
			click_l: this.click_l,
			click_r: this.click_r,
			...options
		});
		this.#hooks.push(hook);
		return hook;
	}
	/**
	 * 
	 * @param {MouseEvent} e
	 */
	updateHooks(e) {
		for (let i = 0; i < this.#hooks.length; i++) {
			/**
			 * @type { MouseHook }
			 */
			let hook = this.#hooks[i];
			hook.x = this.position.x;
			hook.y = this.position.y;
			hook.click_l = this.click_l;
			hook.click_r = this.click_r;
			hook.updateFunc(e, this);
		}
	}

	touchDisabled = false;

	disableTouch() {
		this.touchDisabled = true;
	}
	ensableTouch() {
		this.touchDisabled = false;
	}

	position = {
		x: 0,
		y: 0,
		/**
		 * @param { HTMLElement } element
		*/
		relative: function (element) {
			let elementRect = element.getBoundingClientRect();

			let x = this.x - elementRect.left;
			let y = this.y - elementRect.top;

			let renderedWidth = elementRect.width;
			let renderedHeight = elementRect.height;

			renderedWidth = element.offsetWidth;

			let actualWidth = element.getAttribute("width") || element.clientWidth;
			let actualHeight = element.getAttribute("height") || element.clientWidth;
			if (element.nodeName.toLowerCase() == "svg") {
				let veiwbox = element.getAttribute("viewBox").split(" ");
				actualWidth = veiwbox[2];
				actualHeight = veiwbox[3];
			}

			var scaleX = renderedWidth / actualWidth;
			var scaleY = renderedHeight / actualHeight;

			x /= scaleX;
			y /= scaleY;
			return { x, y };
		},
	};
	get pos() {
		return this.position;
	}
};
class MouseHook {
	x = 0;
	y = 0;
	click_l = false;
	click_r = false;

	/**
	 * 
	 * @param { object} options
	 * @param { function } options.
	 */
	constructor(options) {
		for (let key in options) {
			if (["x", "y"].includes(key)) continue;
			this[key] = options[key];
		}
	}
}