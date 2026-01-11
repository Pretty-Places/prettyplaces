// Pet positions and movement

function drawPetSprite(ctx, pet) {
	const spr = pet.sprite;

	// If image not loaded yet, don't draw
	if (!spr || !spr.image || !spr.loaded) return;

	// Animation timing and state-aware frame selection
	if (!spr.lastUpdate) spr.lastUpdate = Date.now();
	const now = Date.now();

	const isIdle = typeof petState !== "undefined" && petState === "idle";
	// If switched state since last draw, reset frame
	if (spr.lastState !== petState) {
		spr.currentFrame = 0;
		spr.lastUpdate = now;
		spr.lastState = petState;
	}

	const frameCount = isIdle ? spr.idleFrameCount || spr.frameCount : spr.frameCount;
	const frameSpeed = isIdle ? spr.idleFrameSpeed || spr.frameSpeed : spr.frameSpeed;

	if (now - spr.lastUpdate > 1000 / frameSpeed) {
		spr.currentFrame = (spr.currentFrame + 1) % frameCount;
		spr.lastUpdate = now;
	}

	// Frame cropping: account for 1px gaps between frames
	const gap = spr.frameGap || 0;
	const startX = spr.startOffsetX || 0;
	const startY = spr.startOffsetY || 0;
	const sx = startX + spr.currentFrame * (spr.frameWidth + gap);
	const sy = startY;

	// Round destination coordinates to avoid subpixel blurring
	const dw = Math.round(spr.frameWidth * SPRITE_SCALE);
	const dh = Math.round(spr.frameHeight * SPRITE_SCALE);
	const dx = Math.round(petX - dw / 2);
	const dy = Math.round(petY - dh / 2);

	// Ensure image smoothing is disabled
	try {
		ctx.imageSmoothingEnabled = false;
	} catch (e) {}

	// Choose appropriate image (idle vs walk)
	let img = spr.image;
	let needsFlip = false;

	if (isIdle) {
		if (spr.idleLoaded) {
			img = spr.idleImage;
			if (petDirection === -1) needsFlip = true;
		}
	} else {
		img = spr.image;
		if (petDirection === -1) needsFlip = true;
	}

	if (needsFlip) {
		ctx.save();
		ctx.translate(dx + dw, dy);
		ctx.scale(-1, 1);
		try {
			if (spr.frameWidth > 0 && spr.frameHeight > 0) {
				ctx.drawImage(img, sx, sy, spr.frameWidth, spr.frameHeight, 0, 0, dw, dh);
			}
		} catch (e) {
			console.error("Sprite draw error", e);
		}
		ctx.restore();
	} else {
		try {
			if (spr.frameWidth > 0 && spr.frameHeight > 0) {
				ctx.drawImage(img, sx, sy, spr.frameWidth, spr.frameHeight, dx, dy, dw, dh);
			}
		} catch (e) {
			console.error("Sprite draw error", e);
		}
	}
}

// Update pet position and walk cycle
function updatePetPosition() {
	const now = Date.now();

	// If idle, wait until idleEndTime then resume with nextDirection
	if (petState === "idle") {
		if (now >= idleEndTime) {
			petDirection = nextDirection;
			petState = "walking";
		} else {
			return; // remain still while idle
		}
	}

	// Walking behavior: advance walk cycle and position
	walkCycle += 0.05;
	petX += petSpeed * petDirection;

	// Use CSS/display width (not the pixel-buffer `canvas.width`) for bounds
	const canvasWidth = canvas.getBoundingClientRect().width;
	const halfSprite = pet && pet.sprite ? (pet.sprite.frameWidth * SPRITE_SCALE) / 2 : 50;
	const leftBound = halfSprite + EDGE_MARGIN;
	const rightBound = canvasWidth - halfSprite - EDGE_MARGIN;

	// If hitting an edge, clamp and enter idle state for a random short duration
	if (petX > rightBound) {
		petX = rightBound;
		nextDirection = -1;
		// keep petDirection so sprite continues to face the edge while idle
		petState = "idle";
		idleEndTime = now + Math.floor(Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS + 1)) + IDLE_MIN_MS;
	} else if (petX < leftBound) {
		petX = leftBound;
		nextDirection = 1;
		// keep petDirection so sprite continues to face the edge while idle
		petState = "idle";
		idleEndTime = now + Math.floor(Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS + 1)) + IDLE_MIN_MS;
	}
}
