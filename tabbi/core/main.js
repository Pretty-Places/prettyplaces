// Resize canvas for pixelated content
function resizeCanvasForDPR() {
	const dpr = window.devicePixelRatio || 1;
	// Use the canvas CSS/display size as the base
	const rect = canvas.getBoundingClientRect();
	const displayWidth = Math.max(1, Math.floor(rect.width));
	const displayHeight = Math.max(1, Math.floor(rect.height));

	canvas.width = Math.floor(displayWidth * dpr);
	canvas.height = Math.floor(displayHeight * dpr);
	// Keep CSS size the same so layout doesn't change
	canvas.style.width = displayWidth + "px";
	canvas.style.height = displayHeight + "px";

	// Scale the drawing context so drawing coordinates stay in CSS pixels
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

	// Disable smoothing for pixel-art / crisp sprites
	ctx.imageSmoothingEnabled = false;
	try {
		ctx.imageSmoothingQuality = "low";
	} catch (e) {}
}

// Initial resize and on window resize
resizeCanvasForDPR();
window.addEventListener("resize", resizeCanvasForDPR);

// Attempt to auto-load a save silently on startup
try {
	if (window.loadGame) loadGame(true);
} catch (e) {}

// Stat decay is started when the player begins the game

function startDecay() {
	if (!decayIntervalId) decayIntervalId = setInterval(decayStats, 1000);
}
function stopDecay() {
	if (decayIntervalId) {
		clearInterval(decayIntervalId);
		decayIntervalId = null;
	}
}

// Expose start function for the overlay to call
function startGame() {
	startDecay();
	if (window.startAutosave) window.startAutosave();
}
window.startGame = startGame;
window.stopDecay = stopDecay;

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#333";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	updatePetPosition();
	drawPetSprite(ctx, pet);

	// Display pet name above the pet with a horizontal offset depending on facing
	ctx.fillStyle = "white";
	ctx.font = "22px Arial";
	ctx.textAlign = "center";

	// petDirection is global
	const nameOffsetX = petDirection === -1 ? -NAME_OFFSET : NAME_OFFSET;
	const nameX = petX + nameOffsetX;
	ctx.fillText(`${pet.name}`, nameX, petY - 75);

	// Update HTML stats
	updateUI();

	requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
