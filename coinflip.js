(function () {
  // DOM references
  const coinEl = document.getElementById("coin");
  const roundIdEl = document.getElementById("round-id");
  const phasePill = document.getElementById("phase-pill");
  const phaseLabel = document.getElementById("phase-label");
  const resultMainStrong = document
    .getElementById("result-main")
    .querySelector("strong");
  const resultTag = document.getElementById("result-tag");
  const streakInfo = document.getElementById("streak-info");

  const btnHeads = document.getElementById("btn-heads");
  const btnTails = document.getElementById("btn-tails");

  const chipButtons = document.querySelectorAll(".chip-btn");
  const betAmountEl = document.getElementById("bet-amount");
  const btnBetMinus = document.getElementById("btn-bet-minus");
  const btnBetPlus = document.getElementById("btn-bet-plus");
  const btnBetClear = document.getElementById("btn-bet-clear");
  const btnFlip = document.getElementById("btn-flip");
  const flipHint = document.getElementById("flip-hint");

  const balanceEl = document.getElementById("balance");
  const statWagered = document.getElementById("stat-wagered");
  const statProfit = document.getElementById("stat-profit");
  const statRtp = document.getElementById("stat-rtp");
  const statFlips = document.getElementById("stat-flips");
  const statWinrate = document.getElementById("stat-winrate");
  const statBestStreak = document.getElementById("stat-best-streak");
  const btnClearHistory = document.getElementById("btn-clear-history");
  const historyEl = document.getElementById("history");

  // State
  let roundId = 1;
  let selectedSide = "heads"; // 'heads' or 'tails'
  let selectedChip = 1;
  let currentBet = 10;

  let baseBalance = 1000;
  let balance = 1000;
  let totalWagered = 0;
  let totalReturned = 0;

  let totalFlips = 0;
  let totalWins = 0;
  let currentStreak = 0;
  let bestStreak = 0;

  let isFlipping = false;
  let currentRotation = 0;

  // Helpers
  function formatMoney(v) {
    return "$" + v.toFixed(2);
  }

  function updatePhase(name) {
    phasePill.className = "phase-pill";
    if (name === "flipping") {
      phasePill.classList.add("phase-flipping");
      phaseLabel.textContent = "Flipping";
    } else if (name === "result") {
      phasePill.classList.add("phase-result");
      phaseLabel.textContent = "Result";
    } else {
      phasePill.classList.add("phase-idle");
      phaseLabel.textContent = "Ready to flip";
    }
  }

  function updateBetDisplay() {
    if (currentBet < 1) currentBet = 1;
    betAmountEl.textContent = formatMoney(currentBet);
  }

  function updateBalanceDisplay() {
    balanceEl.textContent = formatMoney(balance);
    balanceEl.classList.remove("positive", "negative");
    if (balance > baseBalance) balanceEl.classList.add("positive");
    else if (balance < baseBalance) balanceEl.classList.add("negative");
  }

  function updateStatsDisplay() {
    statWagered.textContent = formatMoney(totalWagered);
    const profit = balance - baseBalance;
    statProfit.textContent = formatMoney(profit);
    const rtp = totalWagered > 0 ? (totalReturned / totalWagered) * 100 : null;
    statRtp.textContent = rtp === null ? "–" : rtp.toFixed(1) + "%";

    statFlips.textContent = totalFlips;
    const winrate = totalFlips > 0 ? (totalWins / totalFlips) * 100 : null;
    statWinrate.textContent = winrate === null ? "–" : winrate.toFixed(1) + "%";
    statBestStreak.textContent = bestStreak;

    streakInfo.textContent =
      "Current streak: " + currentStreak + " • Best streak: " + bestStreak;
  }

  function setSide(side) {
    selectedSide = side;
    btnHeads.classList.toggle("active", side === "heads");
    btnTails.classList.toggle("active", side === "tails");
  }

  function setChip(value) {
    selectedChip = value;
    chipButtons.forEach((btn) => {
      btn.classList.toggle(
        "active",
        parseInt(btn.dataset.chip, 10) === value
      );
    });
  }

  function addHistoryRow(resultSide, chosenSide, bet, payout, net) {
    const row = document.createElement("div");
    row.className = "history-row";

    const mainSpan = document.createElement("span");
    mainSpan.className = "history-main";
    mainSpan.textContent =
      (resultSide === "heads" ? "HEADS" : "TAILS") +
      " (" +
      (resultSide === chosenSide ? "hit" : "miss") +
      ")";

    const changeSpan = document.createElement("span");
    changeSpan.className = "history-change";
    if (net >= 0) {
      changeSpan.classList.add("history-win");
      changeSpan.textContent = "+" + formatMoney(net);
    } else {
      changeSpan.classList.add("history-loss");
      changeSpan.textContent = formatMoney(net);
    }

    const sideSpan = document.createElement("span");
    sideSpan.className = "history-side";
    sideSpan.textContent =
      "Bet " +
      (chosenSide === "heads" ? "HEADS" : "TAILS") +
      " $" +
      bet.toFixed(2);

    row.appendChild(mainSpan);
    row.appendChild(changeSpan);
    row.appendChild(sideSpan);

    historyEl.insertBefore(row, historyEl.firstChild);
    while (historyEl.children.length > 80) {
      historyEl.removeChild(historyEl.lastChild);
    }
  }

  // Coin animation
  function flipCoinAnimation(targetSide, onDone) {
    // Each flip adds at least 2 full rotations + 0 or 180deg depending on side
    const extraTurns = 4;
    const baseAngle = targetSide === "heads" ? 0 : 180;
    currentRotation = currentRotation + extraTurns * 360 + baseAngle;
    coinEl.style.transform = "rotateY(" + currentRotation + "deg)";

    setTimeout(() => {
      if (typeof onDone === "function") onDone();
    }, 900); // match CSS transition
  }

  function handleFlip() {
    if (isFlipping) return;

    if (currentBet <= 0) {
      alert("Set a bet greater than zero before flipping.");
      return;
    }
    if (currentBet > balance) {
      alert("Bet is larger than your current balance.");
      return;
    }

    // Lock bet, deduct from balance
    const bet = currentBet;
    balance -= bet;
    totalWagered += bet;
    updateBalanceDisplay();
    updateStatsDisplay();

    isFlipping = true;
    updatePhase("flipping");
    flipHint.innerHTML =
      "Coin is spinning… Wait for the 3D animation to finish.";

    // Random result
    const resultSide = Math.random() < 0.5 ? "heads" : "tails";

    flipCoinAnimation(resultSide, () => {
      // Resolve result
      const win = resultSide === selectedSide;
      let payout = 0;
      let net = -bet;
      if (win) {
        payout = bet * 2; // 1:1
        balance += payout;
        totalReturned += payout;
        net = payout - bet;
        totalWins += 1;
        currentStreak += 1;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }

      totalFlips += 1;
      updateBalanceDisplay();
      updateStatsDisplay();

      // Update UI text
      resultMainStrong.textContent =
        resultSide === "heads" ? "HEADS" : "TAILS";
      resultTag.className = "result-tag";
      if (win) {
        resultTag.classList.add("result-win");
        resultTag.textContent =
          "You won " +
          formatMoney(net) +
          " on " +
          (selectedSide === "heads" ? "HEADS" : "TAILS");
      } else {
        resultTag.classList.add("result-loss");
        resultTag.textContent =
          "You lost " +
          formatMoney(bet) +
          " on " +
          (selectedSide === "heads" ? "HEADS" : "TAILS");
      }

      flipHint.innerHTML =
        "Adjust your side or bet and press <strong>Flip coin</strong> again to continue.";

      // History
      addHistoryRow(resultSide, selectedSide, bet, payout, net);

      // Prepare next round
      roundId += 1;
      roundIdEl.textContent = "#" + roundId;
      updatePhase("result");
      isFlipping = false;
    });
  }

  // Event handlers
  function attachHandlers() {
    btnHeads.addEventListener("click", () => {
      if (isFlipping) return;
      setSide("heads");
    });

    btnTails.addEventListener("click", () => {
      if (isFlipping) return;
      setSide("tails");
    });

    chipButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (isFlipping) return;
        const val = parseInt(btn.dataset.chip, 10);
        setChip(val);
      });
    });

    btnBetPlus.addEventListener("click", () => {
      if (isFlipping) return;
      const newBet = currentBet + selectedChip;
      if (newBet > balance) {
        alert("Bet cannot exceed your current balance.");
        return;
      }
      currentBet = newBet;
      updateBetDisplay();
    });

    btnBetMinus.addEventListener("click", () => {
      if (isFlipping) return;
      currentBet = Math.max(1, currentBet - selectedChip);
      updateBetDisplay();
    });

    btnBetClear.addEventListener("click", () => {
      if (isFlipping) return;
      currentBet = 1;
      updateBetDisplay();
    });

    btnFlip.addEventListener("click", handleFlip);

    btnClearHistory.addEventListener("click", () => {
      historyEl.innerHTML = "";
    });
  }

  // Init
  function init() {
    setSide("heads");
    setChip(1);
    updateBetDisplay();
    updateBalanceDisplay();
    updateStatsDisplay();
    updatePhase("idle");
    attachHandlers();
  }

  init();
})();
