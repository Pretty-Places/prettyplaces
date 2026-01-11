// Save game data to browser
function saveGame(silent = false) {
	const sanitizedPets = pets.map((p) => {
		const sp = p.sprite || {};
		return {
			id: p.id || null,
			name: p.name,
			type: p.type,
			hunger: p.hunger,
			fun: p.fun,
			energy: p.energy,
			clean: p.clean,
		};
	});

	const saveData = {
		pets: sanitizedPets,
		petIndex: petIndex,
		money: typeof window.getMoney === "function" ? window.getMoney() : 0,
		inventory: inventory && typeof inventory === "object" ? inventory : {},
	};

	localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
	if (!silent) alert("Game Saved!");
}

// Load game data
function loadGame(silent = false) {
	const data = localStorage.getItem(SAVE_KEY);
	if (!data) {
		if (!silent) alert("No save found!");
		return;
	}

	const parsed = JSON.parse(data);

	try {
		if (typeof window.setMoney === "function") {
			window.setMoney(parsed.money || 0);
		} else {
			money = Math.max(0, Math.floor(Number(parsed.money) || 0));
		}
	} catch (e) {}

	try {
		inventory = parsed.inventory && typeof parsed.inventory === "object" ? parsed.inventory : {};
		Object.keys(inventory).forEach((k) => {
			inventory[k] = Math.max(0, Math.floor(Number(inventory[k]) || 0));
		});
	} catch (e) {
		inventory = {};
	}

	// Restore pets + index
	pets.length = 0;
	parsed.pets.forEach((pData) => {
		let template = null;
		if (pData.id && window.petTemplates) {
			template = window.petTemplates.find((t) => t.id === pData.id);
		}
		let newPet;
		if (template) {
			newPet = JSON.parse(JSON.stringify(template));
			newPet.name = pData.name;
			newPet.hunger = pData.hunger;
			newPet.fun = pData.fun;
			newPet.energy = pData.energy;
			newPet.clean = pData.clean;

			newPet.sprite.image = new Image();
			newPet.sprite.image.src = template.sprite.src;
			newPet.sprite.idleImage = new Image();
			newPet.sprite.idleImage.src = template.sprite.idleSrc;

			newPet.sprite.currentFrame = 0;
			newPet.sprite.loaded = false;
			newPet.sprite.idleLoaded = false;

			// Attach onload handlers
			newPet.sprite.image.onload = () => {
				newPet.sprite.loaded = true;
			};
			newPet.sprite.idleImage.onload = () => {
				newPet.sprite.idleLoaded = true;
			};
		}

		// Set defaultName is set
		if (!newPet.defaultName && template) {
			newPet.defaultName = template.defaultName;
		}

		pets.push(newPet);
	});

	// Restore index
	petIndex = parsed.petIndex || 0;
	if (petIndex >= pets.length) petIndex = 0;
	pet = pets[petIndex];

	if (!silent) {
		if (window.showToast) window.showToast("Game Loaded!");
		else alert("Game Loaded!");
	}
}

// Sadly didn't have time to implement save files for cross computer saves
/*
function exportGame() {
	const save = localStorage.getItem(SAVE_KEY);
	if (!save) {
		if (window.showToast) window.showToast("No save data to export");
		return;
	}
	const blob = new Blob([save], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "save_" + Date.now() + ".TABBI"; 
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
	if (window.showToast) window.showToast("Save exported successfully");
}
*/

// New Game: Reset pets and clear save data
function resetGame() {
	// Reset all pets to default stats
	pets.forEach((p) => {
		p.hunger = 100;
		p.fun = 100;
		p.energy = 100;
		p.clean = 100;
		if (p.defaultName) p.name = p.defaultName;
	});

	try {
		if (typeof window.setMoney === "function") window.setMoney(25);
		else money = 25;
	} catch (e) {}
	try {
		inventory = {};
	} catch (e) {}

	petIndex = 0;
	pet = pets[0];

	// Clear localStorage save
	localStorage.removeItem(SAVE_KEY);
}

// Hook up buttons
const btnHome = document.getElementById("btnHome");
if (btnHome) {
	btnHome.addEventListener("click", function () {
		// Save before returning to home
		saveGame(true);
		showToast("Game Saved");

		// Show home overlay
		const overlay = document.getElementById("homeOverlay");
		if (overlay) {
			overlay.style.display = "flex";
			requestAnimationFrame(() => overlay.classList.remove("hidden"));
		}

		// Re-enable continue button if it was disabled
		const btnContinue = document.getElementById("homeContinue");
		if (btnContinue) {
			btnContinue.disabled = false;
			btnContinue.style.opacity = "1";
			btnContinue.style.cursor = "pointer";
			btnContinue.title = "";
		}
	});
}

window.addEventListener("keydown", function (ev) {
	if (ev.key !== "Escape") return;

	const minigameOverlay = document.getElementById("minigameOverlay");
	if (minigameOverlay && minigameOverlay.classList.contains("visible")) {
		const closeMinigame = document.getElementById("closeMinigame");
		if (closeMinigame) closeMinigame.click();
		ev.preventDefault();
		return;
	}

	const settingsOverlay = document.getElementById("settingsOverlay");
	if (settingsOverlay && settingsOverlay.classList.contains("visible")) {
		const settingsBack = document.getElementById("settingsBack");
		if (settingsBack) settingsBack.click();
		ev.preventDefault();
		return;
	}

	const homeOverlay = document.getElementById("homeOverlay");
	if (!homeOverlay) return;
	const homeVisible =
		getComputedStyle(homeOverlay).display !== "none" && !homeOverlay.classList.contains("hidden");

	if (homeVisible) {
		const hasSave = localStorage.getItem(SAVE_KEY);
		const btnContinue = document.getElementById("homeContinue");
		if (btnContinue && !btnContinue.disabled && hasSave) {
			btnContinue.click();
			ev.preventDefault();
		}
		return;
	}

	if (btnHome) {
		btnHome.click();
		ev.preventDefault();
	}
});

function showToast(message, type = "default") {
	console.log("Showing toast:", message, "Type:", type, new Date().toLocaleTimeString());

	const container = document.getElementById("toastContainer");
	if (!container) {
		console.error("Toast container not found!", new Date().toLocaleTimeString());
		return;
	}

	// Remove oldest toast if we've reached the limit
	if (activeToasts.length >= MAX_TOASTS) {
		const oldestToast = activeToasts.shift();
		if (oldestToast && oldestToast.parentNode) {
			removeToast(oldestToast);
		}
	}

	const toast = document.createElement("div");
	toast.className = `toast toast-${type}`;
	toast.textContent = message;
	toast.dataset.type = type;

	// Set initial styles
	Object.assign(toast.style, {
		position: "relative",
		opacity: "0",
		transform: "translateY(20px)",
		transition: "opacity 0.3s ease, transform 0.3s ease",
	});

	// Add to DOM first so we can calculate height
	container.appendChild(toast);

	activeToasts.push(toast);
	updateToastPositions();
	void toast.offsetHeight;
	toast.style.opacity = "1";
	toast.style.transform = "translateY(0)";
	toast.classList.add("visible");

	setTimeout(() => {
		removeToast(toast);
	}, TOAST_SHOW_TIME);
}

function removeToast(toast) {
	if (!toast) return;

	// Add fade-out class to trigger the animation
	toast.classList.add("fade-out");

	// Remove from active toasts
	const index = activeToasts.indexOf(toast);
	if (index > -1) {
		activeToasts.splice(index, 1);
	}

	// Remove from DOM after animation completes
	setTimeout(() => {
		if (toast.parentNode) {
			toast.parentNode.removeChild(toast);
		}
		updateToastPositions();
	}, 300);
}

function updateToastPositions() {
	const TOAST_HEIGHT = 60; // Height + margin of each toast
	activeToasts.forEach((toast, index) => {
		const offset = (activeToasts.length - 1 - index) * TOAST_HEIGHT;
		toast.style.transform = `translateY(-${offset}px)`;
	});
}

// Update existing toast calls to use appropriate types
const originalSaveGame = window.saveGame;
window.saveGame = function (silent = false) {
	const result = originalSaveGame.apply(this, arguments);
	if (!silent) {
		showToast("Game Saved", "save");
	}
	return result;
};


window.loadGame = loadGame;
window.resetGame = resetGame;
window.showToast = showToast;
// window.exportGame = exportGame;
