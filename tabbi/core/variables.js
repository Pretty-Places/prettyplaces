// Canvas
let canvas = document.getElementById("gameCanvas");
let ctx = canvas ? canvas.getContext("2d") : null;

// Game State
let pets = [];
let petTemplates = [];
let petIndex = 0;
let pet = null; // Current active pet
let decayIntervalId = null;

let money = 0;
let inventory = {};

// Sprite / Movement
let petX = 250;
let petY = 400;
let petSpeed = 1.5;
let petDirection = 1; // 1 = right, -1 = left
let walkCycle = 0;
let petState = "walking";
let idleEndTime = 0;
let nextDirection = 1;

// Constants
const NAME_OFFSET = 10;
const IDLE_MIN_MS = 2000;
const IDLE_MAX_MS = 5000;
const EDGE_MARGIN = 60;
const SPRITE_SCALE = 7;
const MAX_TOASTS = 3;
const TOAST_SHOW_TIME = 3000;
const SETTINGS_KEY = "TabbiSettings";
const SAVE_KEY = "TabbiSave";
const DEFAULT_SETTINGS = {
	autosaveEnabled: true,
	autosaveToasts: true,
	autosaveIntervalMs: 30000,
};

// Settings
let _autosaveInterval = null;
let _settings = null;

// Keep track of active toasts
let activeToasts = [];

function getMoney() {
	return typeof money === "number" && isFinite(money) ? money : 0;
}

function setMoney(value) {
	money = Math.max(0, Math.floor(Number(value) || 0));
	try {
		if (typeof updateUI === "function") updateUI();
	} catch (e) {}
}

function addMoney(amount) {
	setMoney(getMoney() + Math.floor(Number(amount) || 0));
}

function spendMoney(amount) {
	const cost = Math.floor(Number(amount) || 0);
	if (getMoney() < cost) return false;
	setMoney(getMoney() - cost);
	return true;
}

function getItemCount(itemId) {
	if (!inventory || typeof inventory !== "object") inventory = {};
	return Math.max(0, Math.floor(Number(inventory[itemId] || 0) || 0));
}

function addItem(itemId, qty = 1) {
	const q = Math.floor(Number(qty) || 0);
	if (q <= 0) return;
	inventory[itemId] = getItemCount(itemId) + q;
	try {
		if (typeof updateUI === "function") updateUI();
	} catch (e) {}
}

function useItem(itemId, qty = 1) {
	const q = Math.floor(Number(qty) || 0);
	if (q <= 0) return true;
	const have = getItemCount(itemId);
	if (have < q) return false;
	inventory[itemId] = have - q;
	try {
		if (typeof updateUI === "function") updateUI();
	} catch (e) {}
	return true;
}

window.getMoney = getMoney;
window.setMoney = setMoney;
window.addMoney = addMoney;
window.spendMoney = spendMoney;
window.getItemCount = getItemCount;
window.addItem = addItem;
window.useItem = useItem;
