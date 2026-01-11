// Helper functions
function clamp(value) {
	return Math.max(0, Math.min(100, value));
}

function createStatBar(label, value) {
	const v = Math.max(0, Math.min(100, Number(value) || 0));
	return `
		<div class="statBarRow">
			<div class="statBarOuter">
				<div class="statBarMask" style="width:${100 - v}%;"></div>
			</div>
			<div class="statRight">
				<span class="statLabel">${label}</span>
				<span class="statValue">${Math.round(v)}</span>
			</div>
		</div>
	`;
}

function isPetDead(pet) {
	if (!pet) return false;
	return (
		Number(pet.hunger) <= 0 ||
		Number(pet.fun) <= 0 ||
		Number(pet.energy) <= 0 ||
		Number(pet.clean) <= 0
	);
}

function handlePetDeathIfNeeded(pet) {
	if (!pet) return;
	if (window.__petDeathTriggered) return;
	if (!isPetDead(pet)) return;
	window.__petDeathTriggered = true;
	try {
		if (typeof window.showPetDeathOverlay === "function") {
			window.showPetDeathOverlay();
			return;
		}
	} catch (e) {}
	try {
		if (window.showToast) window.showToast("The cat died from neglect.");
		else alert("The cat died from neglect.");
	} catch (e) {}
}

// Care functions
function feed() {
	const pet = typeof getCurrentPet === "function" ? getCurrentPet() : null;
	if (!pet) return;
	if (typeof window.useItem === "function" && !window.useItem("food", 1)) {
		if (window.showToast) window.showToast("No food. Buy some in the Shop.");
		else alert("No food. Buy some in the Shop.");
		return;
	}
	pet.hunger = clamp(pet.hunger + 10);
	updateUI();
	handlePetDeathIfNeeded(pet);
}

function play() {
	const pet = typeof getCurrentPet === "function" ? getCurrentPet() : null;
	if (!pet) return;
	if (typeof window.useItem === "function" && !window.useItem("toy", 1)) {
		if (window.showToast) window.showToast("No toy. Buy one in the Shop.");
		else alert("No toy. Buy one in the Shop.");
		return;
	}
	pet.fun = clamp(pet.fun + 10);
	updateUI();
	handlePetDeathIfNeeded(pet);
}

function rest() {
	const pet = typeof getCurrentPet === "function" ? getCurrentPet() : null;
	if (!pet) return;
	if (typeof window.useItem === "function" && !window.useItem("bed", 1)) {
		if (window.showToast) window.showToast("No bed. Buy one in the Shop.");
		else alert("No bed. Buy one in the Shop.");
		return;
	}
	pet.energy = clamp(pet.energy + 10);
	updateUI();
	handlePetDeathIfNeeded(pet);
}

function cleanPet() {
	const pet = typeof getCurrentPet === "function" ? getCurrentPet() : null;
	if (!pet) return;
	if (typeof window.useItem === "function" && !window.useItem("soap", 1)) {
		if (window.showToast) window.showToast("No soap. Buy some in the Shop.");
		else alert("No soap. Buy some in the Shop.");
		return;
	}
	pet.clean = clamp(pet.clean + 10);
	updateUI();
	handlePetDeathIfNeeded(pet);
}

function decayStats() {
	const pet = typeof getCurrentPet === "function" ? getCurrentPet() : null;
	if (!pet) return;
	pet.hunger -= 0.2;
	pet.fun -= 0.15;
	pet.energy -= 0.1;
	pet.clean -= 0.05;

	// Keep values between 0–100
	pet.hunger = Math.max(0, Math.min(100, pet.hunger));
	pet.fun = Math.max(0, Math.min(100, pet.fun));
	pet.energy = Math.max(0, Math.min(100, pet.energy));
	pet.clean = Math.max(0, Math.min(100, pet.clean));

	handlePetDeathIfNeeded(pet);
}

// Link buttons
const btnFeed = document.getElementById("btnFeed");
if (btnFeed) btnFeed.onclick = feed;

const btnPlay = document.getElementById("btnPlay");
if (btnPlay) btnPlay.onclick = play;

const btnRest = document.getElementById("btnRest");
if (btnRest) btnRest.onclick = rest;

const btnClean = document.getElementById("btnClean");
if (btnClean) btnClean.onclick = cleanPet;
