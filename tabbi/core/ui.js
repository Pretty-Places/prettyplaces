// Update HTML stats

function updateUI() {
	const pet = getCurrentPet();
	if (!pet) return;
	const moneyVal = typeof window.getMoney === "function" ? window.getMoney() : 0;
	const foodCount = typeof window.getItemCount === "function" ? window.getItemCount("food") : 0;
	const toyCount = typeof window.getItemCount === "function" ? window.getItemCount("toy") : 0;
	const bedCount = typeof window.getItemCount === "function" ? window.getItemCount("bed") : 0;
	const soapCount = typeof window.getItemCount === "function" ? window.getItemCount("soap") : 0;

	const statsEl = document.getElementById("stats");
	if (statsEl) {
		statsEl.innerHTML = `
		<div class="statInfoRow">
			<div class="statInfoLeft"></div>
			<div class="statRight">
				<span class="statLabel">Money</span>
				<span class="statValue">$${moneyVal}</span>
			</div>
		</div>
		<div class="statInfoRow">
			<div class="statInfoLeft"></div>
			<div class="statRight">
				<span class="statLabel">Supplies</span>
				<span class="statValue statValueSmall">Food: ${foodCount} | Toy: ${toyCount} | Bed: ${bedCount} | Soap: ${soapCount}</span>
			</div>
		</div>
        ${createStatBar("Hunger", pet.hunger)}
        ${createStatBar("Fun", pet.fun)}
        ${createStatBar("Energy", pet.energy)}
        ${createStatBar("Cleanliness", pet.clean)}
        `;
	}

	const availablePetsEl = document.getElementById("availablePets");
	if (availablePetsEl) {
		availablePetsEl.innerHTML = `Available Pets: ${pets.map((p) => p.name).join(", ")}`;
	}

	const inventoryEl = document.getElementById("inventoryList");
	if (inventoryEl) {
		const hasAny = foodCount || toyCount || bedCount || soapCount;
		inventoryEl.innerHTML = hasAny
			? `
			<div>Food: ${foodCount}</div>
			<div>Toy: ${toyCount}</div>
			<div>Bed: ${bedCount}</div>
			<div>Soap: ${soapCount}</div>
			`
			: `<div style="color:#bbb">(empty)</div>`;
	}
}

// Safely attach handlers if elements exist
const btnNext = document.getElementById("btnNext");
if (btnNext) {
	btnNext.onclick = () => {
		// Not implemented in this version
	};
}

const btnPrev = document.getElementById("btnPrev");
if (btnPrev) {
	btnPrev.onclick = () => {
		// Not implemented in this version
	};
}

const btnName = document.getElementById("btnName");
if (btnName) {
	btnName.onclick = () => {
		const nameInput = document.getElementById("petName");
		if (nameInput && nameInput.value.trim()) {
			getCurrentPet().name = nameInput.value.trim();
			updateUI();
		}
	};
}

// Initial UI
updateUI();
