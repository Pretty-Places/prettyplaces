// Settings persist independently from save file
function loadSettings() {
	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		if (!raw) return { ...DEFAULT_SETTINGS };
		const parsed = JSON.parse(raw);
		return Object.assign({}, DEFAULT_SETTINGS, parsed);
	} catch (e) {
		return { ...DEFAULT_SETTINGS };
	}
}

function saveSettings(settings) {
	try {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
	} catch (e) {}
}

// Initialize settings
_settings = loadSettings();

function isAnyOverlayVisible() {
	// Check all possible overlays in the app
	const overlaySelectors = [
		"#homeOverlay:not(.hidden)",
		"#settingsOverlay.visible",
		"#newGameConfirmOverlay.visible",
		"#deleteSaveConfirmOverlay.visible",
		"#minigameOverlay.visible",
	];

	return overlaySelectors.some((selector) => {
		const el = document.querySelector(selector);
		return el && getComputedStyle(el).display !== "none" && el.offsetParent !== null;
	});
}

function startAutosave() {
	// Only start if enabled
	if (!_settings.autosaveEnabled) return;
	if (_autosaveInterval) return;

	const interval = Math.max(1000, Number(_settings.autosaveIntervalMs) || 30000);
	_autosaveInterval = setInterval(() => {
		try {
			// Skip autosave if any overlay is visible
			if (isAnyOverlayVisible()) {
				return;
			}

			// Only save if we're in the game and not in menu
			const homeOverlay = document.getElementById("homeOverlay");
			if (homeOverlay && !homeOverlay.classList.contains("hidden")) {
				return; // Don't autosave in main menu
			}

			if (window.saveGame) {
				window.saveGame(true);

				// Show toast if enabled
				try {
					if (_settings.autosaveToasts && window.showToast) {
						window.showToast("Game autosaved");
					}
				} catch (e) {
					console.error("Error showing autosave toast:", e);
				}
			}
		} catch (e) {
			console.error("Autosave error:", e);
		}
	}, interval);
}

function stopAutosave() {
	if (!_autosaveInterval) return;
	clearInterval(_autosaveInterval);
	_autosaveInterval = null;
}

function setAutosaveEnabled(enabled) {
	_settings.autosaveEnabled = !!enabled;
	saveSettings(_settings);
	if (_settings.autosaveEnabled) startAutosave();
	else stopAutosave();
}

function setAutosaveInterval(ms) {
	const v = Math.max(1000, Number(ms) || DEFAULT_SETTINGS.autosaveIntervalMs);
	_settings.autosaveIntervalMs = v;
	saveSettings(_settings);
	// restart autosave with new interval if running
	if (_autosaveInterval) {
		stopAutosave();
		startAutosave();
	}
}

function setAutosaveToasts(enabled) {
	_settings.autosaveToasts = !!enabled;
	saveSettings(_settings);
}

function getSettings() {
	return Object.assign({}, _settings);
}

window.startAutosave = startAutosave;
window.stopAutosave = stopAutosave;
window.setAutosaveEnabled = setAutosaveEnabled;
window.setAutosaveInterval = setAutosaveInterval;
window.setAutosaveToasts = setAutosaveToasts;
window.getSettings = getSettings;
window.loadSettings = loadSettings;
window.saveSettings = saveSettings;
