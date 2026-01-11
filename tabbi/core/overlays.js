// Home overlay behavior
(function () {
	function $(sel) {
		return document.querySelector(sel);
	}

	const overlay = $("#homeOverlay");
	const btnNewGame = $("#homeNewGame");
	const btnContinue = $("#homeContinue");
	const btnSettings = $("#homeSettings");

	let petDeathOverlay = document.getElementById("petDeathOverlay");
	if (!petDeathOverlay) {
		petDeathOverlay = document.createElement("div");
		petDeathOverlay.id = "petDeathOverlay";
		petDeathOverlay.className = "hidden";
		petDeathOverlay.style.display = "none";
		petDeathOverlay.innerHTML = `
			<div class="settingsCard" style="max-width: 420px; text-align: center">
				<h2>Game Over</h2>
				<p style="margin: 20px 0; color: #ddd">
					The cat died from neglect.
				</p>
				<div class="settingsActions" style="justify-content: center; gap: 15px">
					<button id="petDeathReturnBtn" style="background-color: #d9534f; color: white">
						Return to Menu
					</button>
				</div>
			</div>
		`;
		document.body.appendChild(petDeathOverlay);
	}

	function showHomeOverlay() {
		const home = document.getElementById("homeOverlay");
		if (home) {
			home.style.display = "flex";
			home.classList.remove("hidden");
		}
	}

	function disableContinueButton() {
		const c = document.getElementById("homeContinue");
		if (c) {
			c.disabled = true;
			c.style.opacity = "0.5";
			c.style.cursor = "not-allowed";
			c.title = "No saved game found";
		}
	}

	function closeAllOverlaysExceptHome() {
		const ids = [
			"newGameOverlay",
			"newGameConfirmOverlay",
			"settingsOverlay",
			"deleteSaveConfirmOverlay",
			"minigameOverlay",
		];
		ids.forEach((id) => {
			const el = document.getElementById(id);
			if (!el) return;
			el.classList.remove("visible");
			el.style.display = "none";
		});
	}

	function completeDeathAndReturnToMenu() {
		try {
			if (typeof window.stopDecay === "function") window.stopDecay();
		} catch (e) {}
		try {
			if (typeof window.stopAutosave === "function") window.stopAutosave();
		} catch (e) {}

		try {
			if (petDeathOverlay) {
				petDeathOverlay.classList.remove("visible");
				setTimeout(() => {
					petDeathOverlay.style.display = "none";
				}, 300);
			}
		} catch (e) {}

		try {
			if (typeof window.resetGame === "function") window.resetGame();
			else localStorage.removeItem(SAVE_KEY);
		} catch (e) {}

		try {
			window.__petDeathTriggered = false;
		} catch (e) {}

		closeAllOverlaysExceptHome();
		showHomeOverlay();
		disableContinueButton();
	}

	function showPetDeathOverlay() {
		try {
			if (typeof window.stopDecay === "function") window.stopDecay();
		} catch (e) {}
		try {
			if (typeof window.stopAutosave === "function") window.stopAutosave();
		} catch (e) {}

		const mg = document.getElementById("minigameOverlay");
		if (mg && mg.classList.contains("visible")) {
			try {
				const close = document.getElementById("closeMinigame");
				if (close) close.click();
			} catch (e) {}
		}

		if (!petDeathOverlay) return;
		petDeathOverlay.style.display = "flex";
		requestAnimationFrame(() => petDeathOverlay.classList.add("visible"));
	}

	window.showPetDeathOverlay = showPetDeathOverlay;

	// Create new game confirmation overlay
	let newGameOverlay = document.getElementById("newGameConfirmOverlay");
	if (!newGameOverlay) {
		newGameOverlay = document.createElement("div");
		newGameOverlay.id = "newGameConfirmOverlay";
		newGameOverlay.className = "overlay";
		newGameOverlay.innerHTML = `
			<div class="modal">
				<h3>Start New Game?</h3>
				<p>This will delete your current progress. Are you sure?</p>
				<div class="button-group">
					<button id="confirmNewGameNo">Cancel</button>
					<button id="confirmNewGameYes" class="danger">New Game</button>
				</div>
			</div>
		`;
		document.body.appendChild(newGameOverlay);
	}

	// Show settings button (it always appears) — we'll open the Pet Management folder
	const newGamePetOverlay = document.getElementById("newGameOverlay");
	const previewCanvas = document.getElementById("previewCanvas");
	const newPetNameInput = document.getElementById("newPetName");
	const startGameBtn = document.getElementById("startGameBtn");
	const cancelNewGameBtn = document.getElementById("cancelNewGameBtn");
	const prevPetBtn = document.getElementById("prevPet");
	const nextPetBtn = document.getElementById("nextPet");

	let newGamePetIndex = 0;
	let newGamePreviewFrame = 0;
	let newGamePreviewLastUpdate = 0;
	let newGamePreviewRaf = 0;
	let newGamePetOverlayOpen = false;
	const newGameNameByPetId = {};

	function commitNewGamePetName() {
		if (!newPetNameInput) return;
		if (!window.petTemplates || !window.petTemplates.length) return;
		const t = window.petTemplates[newGamePetIndex];
		if (!t) return;
		const raw = (newPetNameInput.value || "").trim();
		newGameNameByPetId[t.id] = raw || t.defaultName || t.name;
	}

	function syncNewGamePetUI() {
		if (!newPetNameInput) return;
		if (!window.petTemplates || !window.petTemplates.length) return;
		const t = window.petTemplates[newGamePetIndex];
		if (!t) return;
		if (newGameNameByPetId[t.id] == null) {
			newGameNameByPetId[t.id] = t.defaultName || t.name || "";
		}
		newPetNameInput.value = newGameNameByPetId[t.id] || "";
		newPetNameInput.placeholder = t.defaultName || "Pet Name";
		newGamePreviewFrame = 0;
		newGamePreviewLastUpdate = 0;
	}

	function drawNewGamePreviewFrame() {
		if (!newGamePetOverlayOpen) return;
		if (!previewCanvas) return;
		if (!window.petTemplates || !window.petTemplates.length) return;
		const t = window.petTemplates[newGamePetIndex];
		if (!t || !t.sprite) return;

		const ctx2 = previewCanvas.getContext("2d");
		if (!ctx2) return;

		const spr = t.sprite;
		let img = null;
		let frameCount = 1;
		let frameSpeed = 6;
		if (spr.idleImage && (spr.idleLoaded || spr.idleImage.complete)) {
			img = spr.idleImage;
			frameCount = spr.idleFrameCount || spr.frameCount || 1;
			frameSpeed = spr.idleFrameSpeed || spr.frameSpeed || 6;
		} else {
			img = spr.image;
			frameCount = spr.frameCount || 1;
			frameSpeed = spr.frameSpeed || 6;
		}

		ctx2.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
		try {
			ctx2.imageSmoothingEnabled = false;
		} catch (e) {}

		if (!img || !img.complete) return;
		const now = Date.now();
		if (!newGamePreviewLastUpdate) newGamePreviewLastUpdate = now;
		if (now - newGamePreviewLastUpdate > 1000 / frameSpeed) {
			newGamePreviewFrame = (newGamePreviewFrame + 1) % frameCount;
			newGamePreviewLastUpdate = now;
		}

		const gap = spr.frameGap || 0;
		const startX = spr.startOffsetX || 0;
		const startY = spr.startOffsetY || 0;
		const sx = startX + newGamePreviewFrame * (spr.frameWidth + gap);
		const sy = startY;

		const scale = 4;
		const dw = Math.round(spr.frameWidth * scale);
		const dh = Math.round(spr.frameHeight * scale);
		const dx = Math.round((previewCanvas.width - dw) / 2);
		const dy = Math.round((previewCanvas.height - dh) / 2);

		try {
			ctx2.drawImage(img, sx, sy, spr.frameWidth, spr.frameHeight, dx, dy, dw, dh);
		} catch (e) {}
	}

	function startNewGamePreviewLoop() {
		if (newGamePreviewRaf) return;
		const loop = () => {
			if (!newGamePetOverlayOpen) {
				newGamePreviewRaf = 0;
				return;
			}
			drawNewGamePreviewFrame();
			newGamePreviewRaf = requestAnimationFrame(loop);
		};
		newGamePreviewRaf = requestAnimationFrame(loop);
	}

	function stopNewGamePreviewLoop() {
		if (newGamePreviewRaf) cancelAnimationFrame(newGamePreviewRaf);
		newGamePreviewRaf = 0;
	}

	function showNewGamePetOverlay() {
		if (!newGamePetOverlay) return;
		if (!window.petTemplates || !window.petTemplates.length) return;
		newGamePetIndex = 0;
		newGamePetOverlayOpen = true;
		newGamePetOverlay.style.display = "flex";
		requestAnimationFrame(() => newGamePetOverlay.classList.add("visible"));
		syncNewGamePetUI();
		startNewGamePreviewLoop();
	}

	function hideNewGamePetOverlay() {
		if (!newGamePetOverlay) return;
		newGamePetOverlay.classList.remove("visible");
		newGamePetOverlayOpen = false;
		stopNewGamePreviewLoop();
		setTimeout(() => {
			newGamePetOverlay.style.display = "none";
		}, 300);
	}

	if (prevPetBtn) {
		prevPetBtn.onclick = function (e) {
			e.preventDefault();
			e.stopPropagation();
			if (!window.petTemplates || !window.petTemplates.length) return;
			commitNewGamePetName();
			newGamePetIndex =
				(newGamePetIndex - 1 + window.petTemplates.length) % window.petTemplates.length;
			syncNewGamePetUI();
		};
	}

	if (nextPetBtn) {
		nextPetBtn.onclick = function (e) {
			e.preventDefault();
			e.stopPropagation();
			if (!window.petTemplates || !window.petTemplates.length) return;
			commitNewGamePetName();
			newGamePetIndex = (newGamePetIndex + 1) % window.petTemplates.length;
			syncNewGamePetUI();
		};
	}

	if (newPetNameInput) {
		newPetNameInput.oninput = function () {
			commitNewGamePetName();
		};
	}

	if (cancelNewGameBtn) {
		cancelNewGameBtn.onclick = function (e) {
			e.preventDefault();
			e.stopPropagation();
			hideNewGamePetOverlay();
		};
	}

	if (startGameBtn) {
		startGameBtn.onclick = function (e) {
			e.preventDefault();
			e.stopPropagation();
			if (!window.petTemplates || !window.petTemplates.length) return;
			commitNewGamePetName();
			if (window.resetGame) window.resetGame();

			const t = window.petTemplates[newGamePetIndex];
			if (t && pets && pets.length) {
				let idx = -1;
				try {
					idx = pets.findIndex((p) => p && p.id === t.id);
				} catch (e) {
					idx = -1;
				}
				if (idx < 0) idx = Math.max(0, Math.min(newGamePetIndex, pets.length - 1));
				petIndex = idx;
				pet = pets[petIndex];
				if (t.id != null && newGameNameByPetId[t.id] != null && pet) {
					pet.name = newGameNameByPetId[t.id];
				}
			}

			hideNewGamePetOverlay();
			hideOverlayAndStart();
		};
	}

	function hideOverlayAndStart() {
		if (!overlay) return;
		overlay.classList.add("hidden");
		let started = false;
		const startOnce = function () {
			if (started) return;
			started = true;
			try {
				overlay.style.display = "none";
			} catch (e) {}
			try {
				if (window.startGame) window.startGame();
			} catch (e) {}
		};
		const onTransitionEnd = function (ev) {
			if (ev.propertyName !== "opacity") return;
			overlay.removeEventListener("transitionend", onTransitionEnd);
			startOnce();
		};
		overlay.addEventListener("transitionend", onTransitionEnd);
		setTimeout(startOnce, 650);
	}

	// Shop + Minigame UI
	const buyFoodBtn = document.getElementById("buyFood");
	const buyToyBtn = document.getElementById("buyToy");
	const buyBedBtn = document.getElementById("buyBed");
	const buySoapBtn = document.getElementById("buySoap");

	function buyItem(itemId, cost, qty) {
		if (typeof window.spendMoney === "function" && !window.spendMoney(cost)) {
			if (window.showToast) window.showToast("Not enough money");
			else alert("Not enough money");
			return;
		}
		if (typeof window.addItem === "function") window.addItem(itemId, qty);
		if (window.showToast) window.showToast("Purchased!");
	}

	if (buyFoodBtn) buyFoodBtn.onclick = () => buyItem("food", 5, 1);
	if (buyToyBtn) buyToyBtn.onclick = () => buyItem("toy", 10, 1);
	if (buyBedBtn) buyBedBtn.onclick = () => buyItem("bed", 15, 1);
	if (buySoapBtn) buySoapBtn.onclick = () => buyItem("soap", 8, 1);

	const minigameOverlay = document.getElementById("minigameOverlay");
	const openClickMinigameBtn = document.getElementById("btnClickMinigame");
	const openTargetMinigameBtn = document.getElementById("btnTargetMinigame");
	const openCatchMinigameBtn = document.getElementById("btnCatchMinigame");
	const startMinigameBtn = document.getElementById("startMinigame");
	const closeMinigameBtn = document.getElementById("closeMinigame");
	const minigameTitleEl = document.getElementById("minigameTitle");
	const minigameInfoEl = document.getElementById("minigameInfo");
	const hudLeftLabelEl = document.getElementById("minigameHudLeftLabel");
	const hudLeftValueEl = document.getElementById("minigameHudLeftValue");
	const hudRightLabelEl = document.getElementById("minigameHudRightLabel");
	const hudRightValueEl = document.getElementById("minigameHudRightValue");
	const minigameTargetBtn = document.getElementById("minigameTarget");
	const minigameCanvas = document.getElementById("minigameCanvas");

	let activeMinigame = null;
	let minigameTimer = null;
	let minigameRaf = 0;
	let minigameRunning = false;

	// Click Challenge
	let clickClicks = 0;
	let clickSeconds = 15;

	// Target Practice
	let targetHits = 0;
	let targetSeconds = 20;
	let targetX = 0;
	let targetY = 0;
	let targetR = 18;

	// Coin Catch
	let catchScore = 0;
	let catchSeconds = 20;
	let catchPlayerX = 0;
	let catchLeft = false;
	let catchRight = false;
	let catchCoins = [];
	let catchSpawnMs = 0;

	function isMinigameVisible() {
		if (!minigameOverlay) return false;
		return (
			minigameOverlay.classList.contains("visible") && minigameOverlay.style.display !== "none"
		);
	}

	function setHud(leftLabel, leftValue, rightLabel, rightValue) {
		if (hudLeftLabelEl) hudLeftLabelEl.textContent = String(leftLabel || "");
		if (hudLeftValueEl) hudLeftValueEl.textContent = String(leftValue);
		if (hudRightLabelEl) hudRightLabelEl.textContent = String(rightLabel || "");
		if (hudRightValueEl) hudRightValueEl.textContent = String(rightValue);
	}

	function clearCanvas() {
		if (!minigameCanvas) return;
		const ctx = minigameCanvas.getContext("2d");
		if (!ctx) return;
		ctx.clearRect(0, 0, minigameCanvas.width, minigameCanvas.height);
	}

	function stopMinigame() {
		minigameRunning = false;
		if (minigameTimer) clearInterval(minigameTimer);
		minigameTimer = null;
		if (minigameRaf) cancelAnimationFrame(minigameRaf);
		minigameRaf = 0;
		catchLeft = false;
		catchRight = false;
	}

	function saveAfterMinigame() {
		try {
			if (typeof window.saveGame === "function") window.saveGame(true);
		} catch (e) {}
	}

	function showMinigameOverlay(mode) {
		if (!minigameOverlay) return;
		setActiveMinigame(mode);
		minigameOverlay.style.display = "flex";
		requestAnimationFrame(() => minigameOverlay.classList.add("visible"));
	}

	function hideMinigameOverlay() {
		if (!minigameOverlay) return;
		minigameOverlay.classList.remove("visible");
		stopMinigame();
		activeMinigame = null;
		setTimeout(() => {
			minigameOverlay.style.display = "none";
		}, 320);
	}

	function randomRange(min, max) {
		return min + Math.random() * (max - min);
	}

	function setActiveMinigame(mode) {
		stopMinigame();
		activeMinigame = mode;
		clearCanvas();
		if (minigameTargetBtn) minigameTargetBtn.style.display = "none";
		if (minigameCanvas) minigameCanvas.style.display = "none";

		if (mode === "click") {
			clickClicks = 0;
			clickSeconds = 15;
			if (minigameTitleEl) minigameTitleEl.textContent = "Click Challenge";
			if (minigameInfoEl)
				minigameInfoEl.textContent = "Click as fast as you can for 15 seconds. Earn $1 per click.";
			setHud("Time", clickSeconds + "s", "Clicks", clickClicks);
			if (minigameTargetBtn) minigameTargetBtn.style.display = "inline-flex";
			return;
		}

		if (mode === "target") {
			targetHits = 0;
			targetSeconds = 20;
			if (minigameTitleEl) minigameTitleEl.textContent = "Target Practice";
			if (minigameInfoEl)
				minigameInfoEl.textContent = "Click the target on the canvas. Earn $2 per hit.";
			setHud("Time", targetSeconds + "s", "Hits", targetHits);
			if (minigameCanvas) minigameCanvas.style.display = "block";
			spawnTarget();
			drawTargetFrame();
			return;
		}

		if (mode === "catch") {
			catchScore = 0;
			catchSeconds = 20;
			catchCoins = [];
			catchSpawnMs = 0;
			catchPlayerX = minigameCanvas ? minigameCanvas.width / 2 : 190;
			if (minigameTitleEl) minigameTitleEl.textContent = "Coin Catch";
			if (minigameInfoEl)
				minigameInfoEl.textContent =
					"Use A/D or Arrow Keys to move and catch coins. Earn $2 per coin.";
			setHud("Time", catchSeconds + "s", "Coins", catchScore);
			if (minigameCanvas) minigameCanvas.style.display = "block";
			drawCatchFrame.lastTs = 0;
			drawCatchFrame(0);
			return;
		}
	}

	function startActiveMinigame() {
		if (activeMinigame === "click") return startClickChallenge();
		if (activeMinigame === "target") return startTargetPractice();
		if (activeMinigame === "catch") return startCoinCatch();
	}

	function startClickChallenge() {
		stopMinigame();
		clickClicks = 0;
		clickSeconds = 15;
		minigameRunning = true;
		setHud("Time", clickSeconds + "s", "Clicks", clickClicks);
		minigameTimer = setInterval(() => {
			clickSeconds -= 1;
			setHud("Time", Math.max(0, clickSeconds) + "s", "Clicks", clickClicks);
			if (clickSeconds <= 0) {
				stopMinigame();
				const reward = Math.max(0, Math.floor(clickClicks));
				if (reward > 0 && typeof window.addMoney === "function") window.addMoney(reward);
				if (window.showToast) window.showToast(`You earned $${reward}!`);
				saveAfterMinigame();
			}
		}, 1000);
	}

	function spawnTarget() {
		if (!minigameCanvas) return;
		targetR = 18;
		targetX = randomRange(targetR + 8, minigameCanvas.width - targetR - 8);
		targetY = randomRange(targetR + 8, minigameCanvas.height - targetR - 8);
	}

	function drawTargetFrame() {
		if (!minigameCanvas) return;
		const ctx = minigameCanvas.getContext("2d");
		if (!ctx) return;
		ctx.clearRect(0, 0, minigameCanvas.width, minigameCanvas.height);
		ctx.fillStyle = "rgba(0,0,0,0.15)";
		ctx.fillRect(0, 0, minigameCanvas.width, minigameCanvas.height);

		ctx.beginPath();
		ctx.arc(targetX, targetY, targetR, 0, Math.PI * 2);
		ctx.fillStyle = "#ffa500";
		ctx.fill();
		ctx.lineWidth = 3;
		ctx.strokeStyle = "rgba(0,0,0,0.55)";
		ctx.stroke();

		ctx.beginPath();
		ctx.arc(targetX, targetY, Math.max(2, targetR - 8), 0, Math.PI * 2);
		ctx.fillStyle = "rgba(255,255,255,0.35)";
		ctx.fill();
		ctx.strokeStyle = "rgba(0,0,0,0.35)";
		ctx.stroke();

		if (activeMinigame === "target" && isMinigameVisible()) {
			minigameRaf = requestAnimationFrame(drawTargetFrame);
		}
	}

	function startTargetPractice() {
		stopMinigame();
		targetHits = 0;
		targetSeconds = 20;
		spawnTarget();
		minigameRunning = true;
		setHud("Time", targetSeconds + "s", "Hits", targetHits);
		drawTargetFrame();
		minigameTimer = setInterval(() => {
			targetSeconds -= 1;
			setHud("Time", Math.max(0, targetSeconds) + "s", "Hits", targetHits);
			if (targetSeconds <= 0) {
				stopMinigame();
				const reward = Math.max(0, Math.floor(targetHits * 2));
				if (reward > 0 && typeof window.addMoney === "function") window.addMoney(reward);
				if (window.showToast) window.showToast(`You earned $${reward}!`);
				saveAfterMinigame();
			}
		}, 1000);
	}

	function drawCatchFrame(ts) {
		if (!minigameCanvas) return;
		const ctx = minigameCanvas.getContext("2d");
		if (!ctx) return;
		if (!drawCatchFrame.lastTs) drawCatchFrame.lastTs = ts;
		const dt = Math.min(50, ts - drawCatchFrame.lastTs);
		drawCatchFrame.lastTs = ts;

		ctx.clearRect(0, 0, minigameCanvas.width, minigameCanvas.height);
		ctx.fillStyle = "rgba(0,0,0,0.15)";
		ctx.fillRect(0, 0, minigameCanvas.width, minigameCanvas.height);

		const w = minigameCanvas.width;
		const h = minigameCanvas.height;
		const speed = 0.28 * dt;
		const playerW = 56;
		const playerH = 14;
		if (minigameRunning && activeMinigame === "catch") {
			if (catchLeft) catchPlayerX -= speed;
			if (catchRight) catchPlayerX += speed;
			catchPlayerX = Math.max(playerW / 2, Math.min(w - playerW / 2, catchPlayerX));

			catchSpawnMs += dt;
			if (catchSpawnMs > 520) {
				catchSpawnMs = 0;
				catchCoins.push({
					x: randomRange(12, w - 12),
					y: -10,
					vy: randomRange(0.07, 0.12) * h,
					r: 8,
				});
			}

			for (let i = catchCoins.length - 1; i >= 0; i -= 1) {
				const c = catchCoins[i];
				c.y += (c.vy * dt) / 1000;
				const basketTop = h - 24;
				const basketLeft = catchPlayerX - playerW / 2;
				const basketRight = catchPlayerX + playerW / 2;
				const caught =
					c.y + c.r >= basketTop &&
					c.y - c.r <= basketTop + playerH &&
					c.x >= basketLeft &&
					c.x <= basketRight;
				if (caught) {
					catchCoins.splice(i, 1);
					catchScore += 1;
					setHud("Time", Math.max(0, catchSeconds) + "s", "Coins", catchScore);
					continue;
				}
				if (c.y - c.r > h + 10) {
					catchCoins.splice(i, 1);
				}
			}
		}

		// Draw basket
		ctx.fillStyle = "rgba(255,255,255,0.65)";
		ctx.fillRect(catchPlayerX - playerW / 2, h - 24, playerW, playerH);
		ctx.fillStyle = "rgba(0,0,0,0.35)";
		ctx.fillRect(catchPlayerX - playerW / 2, h - 24 + playerH - 3, playerW, 3);

		// Draw coins
		for (let i = 0; i < catchCoins.length; i += 1) {
			const c = catchCoins[i];
			ctx.beginPath();
			ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
			ctx.fillStyle = "#ffa500";
			ctx.fill();
			ctx.lineWidth = 2;
			ctx.strokeStyle = "rgba(0,0,0,0.4)";
			ctx.stroke();
		}

		if (activeMinigame === "catch" && isMinigameVisible()) {
			minigameRaf = requestAnimationFrame(drawCatchFrame);
		}
	}

	function startCoinCatch() {
		stopMinigame();
		catchScore = 0;
		catchSeconds = 20;
		catchCoins = [];
		catchSpawnMs = 0;
		catchPlayerX = minigameCanvas ? minigameCanvas.width / 2 : 190;
		minigameRunning = true;
		setHud("Time", catchSeconds + "s", "Coins", catchScore);
		drawCatchFrame.lastTs = 0;
		minigameRaf = requestAnimationFrame(drawCatchFrame);
		minigameTimer = setInterval(() => {
			catchSeconds -= 1;
			setHud("Time", Math.max(0, catchSeconds) + "s", "Coins", catchScore);
			if (catchSeconds <= 0) {
				stopMinigame();
				const reward = Math.max(0, Math.floor(catchScore * 2));
				if (reward > 0 && typeof window.addMoney === "function") window.addMoney(reward);
				if (window.showToast) window.showToast(`You earned $${reward}!`);
				saveAfterMinigame();
			}
		}, 1000);
	}

	if (minigameTargetBtn)
		minigameTargetBtn.onclick = function () {
			if (!minigameRunning || activeMinigame !== "click") return;
			clickClicks += 1;
			setHud("Time", Math.max(0, clickSeconds) + "s", "Clicks", clickClicks);
		};

	if (minigameCanvas)
		minigameCanvas.addEventListener("pointerdown", function (ev) {
			if (!minigameRunning) return;
			if (activeMinigame !== "target") return;
			const rect = minigameCanvas.getBoundingClientRect();
			const x = ((ev.clientX - rect.left) / rect.width) * minigameCanvas.width;
			const y = ((ev.clientY - rect.top) / rect.height) * minigameCanvas.height;
			const dx = x - targetX;
			const dy = y - targetY;
			if (dx * dx + dy * dy <= targetR * targetR) {
				targetHits += 1;
				spawnTarget();
				setHud("Time", Math.max(0, targetSeconds) + "s", "Hits", targetHits);
			}
		});

	window.addEventListener("keydown", function (ev) {
		if (!minigameRunning || activeMinigame !== "catch") return;
		if (!isMinigameVisible()) return;
		if (ev.key === "ArrowLeft" || ev.key === "a" || ev.key === "A") {
			catchLeft = true;
			ev.preventDefault();
		}
		if (ev.key === "ArrowRight" || ev.key === "d" || ev.key === "D") {
			catchRight = true;
			ev.preventDefault();
		}
	});

	window.addEventListener("keyup", function (ev) {
		if (activeMinigame !== "catch") return;
		if (!isMinigameVisible()) return;
		if (ev.key === "ArrowLeft" || ev.key === "a" || ev.key === "A") {
			catchLeft = false;
			ev.preventDefault();
		}
		if (ev.key === "ArrowRight" || ev.key === "d" || ev.key === "D") {
			catchRight = false;
			ev.preventDefault();
		}
	});

	if (openClickMinigameBtn) openClickMinigameBtn.onclick = () => showMinigameOverlay("click");
	if (openTargetMinigameBtn) openTargetMinigameBtn.onclick = () => showMinigameOverlay("target");
	if (openCatchMinigameBtn) openCatchMinigameBtn.onclick = () => showMinigameOverlay("catch");
	if (closeMinigameBtn) closeMinigameBtn.onclick = hideMinigameOverlay;
	if (startMinigameBtn) startMinigameBtn.onclick = startActiveMinigame;

	if (btnNewGame) {
		btnNewGame.onclick = function (e) {
			e.preventDefault();
			e.stopPropagation();

			const hasSave = localStorage.getItem(SAVE_KEY);
			if (hasSave) {
				// Show custom overlay
				const newGameOverlay = document.getElementById("newGameConfirmOverlay");
				if (newGameOverlay) {
					newGameOverlay.style.display = "flex";
					requestAnimationFrame(() => newGameOverlay.classList.add("visible"));
				}
			} else {
				// If no save file, start new game
				showNewGamePetOverlay();
			}
		};

		// Handle new game confirmation
		const confirmNewGameYes = $("#confirmNewGameYes");
		if (confirmNewGameYes) {
			confirmNewGameYes.onclick = function (e) {
				e.preventDefault();
				e.stopPropagation();

				// Hide the confirmation overlay with animation
				const overlay = document.getElementById("newGameConfirmOverlay");
				if (overlay) {
					overlay.classList.remove("visible");
					setTimeout(() => {
						overlay.style.display = "none";
						// Then reset game and start
						showNewGamePetOverlay();
					}, 300);
				}
			};
		}

		// Handle new game cancellation
		const confirmNewGameNo = $("#confirmNewGameNo");
		if (confirmNewGameNo) {
			confirmNewGameNo.onclick = function (e) {
				e.preventDefault();
				e.stopPropagation();

				// Hide the confirmation overlay with animation
				const overlay = document.getElementById("newGameConfirmOverlay");
				if (overlay) {
					overlay.classList.remove("visible");
					setTimeout(() => {
						overlay.style.display = "none";
					}, 300);
				}
			};
		}
	}

	if (btnContinue) {
		const hasSave = localStorage.getItem(SAVE_KEY);
		if (!hasSave) {
			btnContinue.disabled = true;
			btnContinue.style.opacity = "0.5";
			btnContinue.style.cursor = "not-allowed";
			btnContinue.title = "No saved game found";
		}

		btnContinue.addEventListener("click", function () {
			if (btnContinue.disabled) return;
			hideOverlayAndStart();
		});
	}

	const petDeathReturnBtn = document.getElementById("petDeathReturnBtn");
	if (petDeathReturnBtn) {
		petDeathReturnBtn.onclick = function (e) {
			e.preventDefault();
			e.stopPropagation();
			completeDeathAndReturnToMenu();
		};
	}

	if (btnSettings)
		btnSettings.addEventListener("click", function () {
			// Show the settings overlay on top of the home overlay
			const settings = $("#settingsOverlay");
			if (!settings) return;
			settings.style.display = "flex";
			requestAnimationFrame(() => settings.classList.add("visible"));

			// Get all settings controls
			const settingsControls = {
				autosaveEnabled: $("#autosaveEnabled"),
				autosaveIntervalMs: $("#autosaveIntervalSeconds"),
				autosaveToasts: $("#autosaveToasts"),
			};

			function readStoredSettings() {
				if (window.getSettings) return window.getSettings();
				try {
					const raw = localStorage.getItem(SETTINGS_KEY);
					if (!raw) return { ...DEFAULT_SETTINGS };
					return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
				} catch (e) {
					return { ...DEFAULT_SETTINGS };
				}
			}

			function updateSetting(key, value) {
				try {
					const settings = readStoredSettings();
					settings[key] = value;
					localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
					return true;
				} catch (e) {
					console.error("Failed to update setting:", e);
					return false;
				}
			}

			// Settings configuration
			const settingsConfig = {
				autosaveEnabled: {
					element: settingsControls.autosaveEnabled,
					type: "checkbox",
					updateHandler: (value) => {
						if (window.setAutosaveEnabled) {
							window.setAutosaveEnabled(value);
						} else {
							updateSetting("autosaveEnabled", value);
						}
					},
				},
				autosaveIntervalMs: {
					element: settingsControls.autosaveIntervalMs,
					type: "number",
					// Convert seconds to ms for storage
					preProcess: (value) => {
						const val = Math.max(1, Number(value) || 30);
						return Math.round(val * 1000);
					},
					// Convert ms to seconds for display
					formatForDisplay: (ms) => Math.round(ms / 1000),
					updateHandler: (value) => {
						if (window.setAutosaveInterval) {
							window.setAutosaveInterval(value);
						} else {
							updateSetting("autosaveIntervalMs", value);
						}
					},
				},
				autosaveToasts: {
					element: settingsControls.autosaveToasts,
					type: "checkbox",
					updateHandler: (value) => {
						if (window.setAutosaveToasts) {
							window.setAutosaveToasts(value);
						} else {
							updateSetting("autosaveToasts", value);
						}
					},
				},
			};

			// Initialize settings
			function initSettings() {
				const settings = readStoredSettings();

				Object.entries(settingsConfig).forEach(([key, config]) => {
					const element = config.element;
					if (!element) return;

					// Set initial value
					if (config.type === "checkbox") {
						element.checked = settings[key] !== false; // Default to true if not set
					} else {
						const value = config.formatForDisplay
							? config.formatForDisplay(settings[key])
							: settings[key];
						element.value = value || "";
					}

					// Add change handler
					element.onchange = function () {
						let value = config.type === "checkbox" ? this.checked : this.value;
						if (config.preProcess) {
							value = config.preProcess(value);
						}
						config.updateHandler(value);
					};
				});
			}

			// Initialize settings when settings overlay is opened
			initSettings();

			// Wire the Reset button
			const resetBtn = $("#settingsReset");
			if (resetBtn) {
				resetBtn.onclick = function () {
					// Reset each setting to its default value
					Object.entries(settingsConfig).forEach(([key, config]) => {
						if (!config.element) return;

						const defaultValue = DEFAULT_SETTINGS[key];
						if (defaultValue === undefined) return;

						// Update the UI
						if (config.type === "checkbox") {
							config.element.checked = defaultValue;
						} else if (config.formatForDisplay) {
							config.element.value = config.formatForDisplay(defaultValue);
						} else {
							config.element.value = defaultValue;
						}

						// Trigger the change handler to update the actual setting
						const event = new Event("change");
						config.element.dispatchEvent(event);
					});

					if (window.showToast) {
						window.showToast("Settings reset to defaults");
					}
				};
			}

			// Wire the Delete Save button
			const deleteSaveBtn = $("#deleteSaveBtn");
			if (deleteSaveBtn) {
				deleteSaveBtn.onclick = function () {
					// Check if there's a save to delete
					if (!localStorage.getItem(SAVE_KEY)) {
						if (window.showToast) {
							window.showToast("No save file found");
						} else {
							alert("No save file found");
						}
						return;
					}

					const deleteOverlay = document.getElementById("deleteSaveConfirmOverlay");
					if (!deleteOverlay) return;

					// Show the delete confirmation overlay
					deleteOverlay.style.display = "flex";
					requestAnimationFrame(() => deleteOverlay.classList.add("visible"));
				};
			}

			// Wire the Delete Save Confirmation buttons
			const confirmDeleteYes = $("#confirmDeleteYes");
			if (confirmDeleteYes) {
				confirmDeleteYes.onclick = function () {
					// Clear the save data
					localStorage.removeItem(SAVE_KEY);

					// Reset the game state
					if (window.resetGame) window.resetGame();

					// Hide the delete confirmation overlay and settings overlay
					const deleteOverlay = document.getElementById("deleteSaveConfirmOverlay");
					const settingsOverlay = document.getElementById("settingsOverlay");

					if (deleteOverlay) {
						deleteOverlay.classList.remove("visible");
						setTimeout(() => {
							deleteOverlay.style.display = "none";
						}, 300);
					}

					// Close settings overlay
					if (settingsOverlay) {
						settingsOverlay.classList.remove("visible");
						setTimeout(() => {
							settingsOverlay.style.display = "none";
						}, 300);
					}

					// Disable continue button
					const btnContinue = $("#homeContinue");
					if (btnContinue) {
						btnContinue.disabled = true;
						btnContinue.style.opacity = "0.5";
						btnContinue.style.cursor = "not-allowed";
						btnContinue.title = "No saved game found";
					}

					// Show a confirmation message
					if (window.showToast) {
						window.showToast("Save data deleted");
					} else {
						alert("Save data deleted");
					}
				};
			}

			const confirmDeleteNo = $("#confirmDeleteNo");
			if (confirmDeleteNo) {
				confirmDeleteNo.onclick = function () {
					const deleteOverlay = document.getElementById("deleteSaveConfirmOverlay");
					if (!deleteOverlay) return;

					deleteOverlay.classList.remove("visible");
					setTimeout(() => {
						deleteOverlay.style.display = "none";
					}, 300);
				};
			}

			// Wire the Back button inside settings to hide it
			const back = $("#settingsBack");
			if (back) {
				back.onclick = function () {
					settings.classList.remove("visible");
					const onEnd = function (ev) {
						if (ev.propertyName !== "opacity") return;
						settings.style.display = "none";
						settings.removeEventListener("transitionend", onEnd);
					};
					settings.addEventListener("transitionend", onEnd);
				};
			}
		});
})();
