(() => {
  const MIN_ROWS = 3;
  const MAX_ROWS = 7;
  const url = new URL(window.location.href);
  const isSharedView = url.searchParams.has("state");

  const addBtn = document.getElementById("add-row-btn");
  const removeBtn = document.getElementById("remove-row-btn");
  const generateLinkBtn = document.getElementById("generate-link-btn");
  const copyLinkBtn = document.getElementById("copy-link-btn");
  const shareLinkInput = document.getElementById("share-link");
  const shareMessageEl = document.getElementById("share-message");
  const rowsContainer = document.getElementById("rows");
  const statusEl = document.getElementById("status");
  const eventMessageEl = document.getElementById("event-message");
  const makeYourOwnEl = document.getElementById("make-your-own");
  const makeYourOwnLinkEl = document.getElementById("make-your-own-link");

  let idCounter = 0;
  let rows = Array.from({ length: MIN_ROWS }, () => newRow());

  function newRow() {
    idCounter += 1;
    return {
      id: `row-${idCounter}`,
      text: "",
      isOn: false,
    };
  }

  function activeCount() {
    return rows.reduce((count, row) => count + (row.isOn ? 1 : 0), 0);
  }

  function maxOn() {
    return rows.length - 1;
  }

  function randomInt(maxExclusive) {
    return Math.floor(Math.random() * maxExclusive);
  }

  function setEventMessage(message, isWarning = false) {
    eventMessageEl.textContent = message;
    eventMessageEl.classList.toggle("warn", isWarning);
  }

  function setShareMessage(message, isWarning = false) {
    shareMessageEl.textContent = message;
    shareMessageEl.classList.toggle("warn", isWarning);
  }

  function builderUrl() {
    const clean = new URL(window.location.href);
    clean.searchParams.delete("state");
    clean.hash = "";
    return clean.toString();
  }

  function setupViewMode() {
    if (!isSharedView) {
      return;
    }
    document.body.classList.add("shared-view");
    makeYourOwnLinkEl.href = builderUrl();
    makeYourOwnEl.hidden = false;
  }

  function encodeState() {
    const payload = {
      v: 1,
      rows: rows.map((row) => ({
        text: row.text,
        isOn: row.isOn,
      })),
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  function decodeState(stateValue) {
    const normalized = stateValue.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const parsed = JSON.parse(decodeURIComponent(escape(atob(padded))));

    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.rows)) {
      return null;
    }

    const slice = parsed.rows.slice(0, MAX_ROWS);
    if (slice.length < MIN_ROWS) {
      return null;
    }

    return slice.map((item) => ({
      id: newRow().id,
      text: typeof item.text === "string" ? item.text : "",
      isOn: Boolean(item.isOn),
    }));
  }

  function buildShareLink() {
    const url = new URL(window.location.href);
    url.searchParams.set("state", encodeState());
    return url.toString();
  }

  function updateShareLink() {
    shareLinkInput.value = buildShareLink();
  }

  function loadStateFromUrl() {
    const encoded = url.searchParams.get("state");
    if (!encoded) {
      return;
    }

    try {
      const decodedRows = decodeState(encoded);
      if (!decodedRows) {
        setShareMessage("Share link is invalid. Default state loaded.", true);
        return;
      }

      rows = decodedRows;
      const switchedOffAny = enforceMaxOn();
      if (switchedOffAny) {
        setEventMessage(
          "Shared data had all toggles ON. One toggle was turned OFF to apply rules.",
          true
        );
      }
      setShareMessage("Shared output loaded from link.");
    } catch (_error) {
      setShareMessage("Share link is invalid. Default state loaded.", true);
    }
  }

  function enforceMaxOn(preferKeepRowId = null) {
    let count = activeCount();
    const allowed = maxOn();
    let switchedOffAny = false;

    while (count > allowed) {
      let onRows = rows.filter((row) => row.isOn);
      let candidates = onRows;

      if (preferKeepRowId !== null) {
        const excludingPreferred = onRows.filter((row) => row.id !== preferKeepRowId);
        if (excludingPreferred.length > 0) {
          candidates = excludingPreferred;
        }
      }

      const pick = candidates[randomInt(candidates.length)];
      pick.isOn = false;
      switchedOffAny = true;
      count -= 1;
    }

    return switchedOffAny;
  }

  function addRow() {
    if (rows.length >= MAX_ROWS) {
      return;
    }
    rows.push(newRow());
    setEventMessage("");
    render();
  }

  function removeRow() {
    if (rows.length <= MIN_ROWS) {
      return;
    }
    rows.pop();
    const switchedOffAny = enforceMaxOn();
    setEventMessage(
      switchedOffAny
        ? "A toggle was turned OFF to keep at least one toggle OFF."
        : ""
    );
    render();
  }

  function updateText(rowId, value) {
    const row = rows.find((item) => item.id === rowId);
    if (!row) {
      return;
    }
    row.text = value;
  }

  function toggleRow(rowId) {
    const row = rows.find((item) => item.id === rowId);
    if (!row) {
      return;
    }

    row.isOn = !row.isOn;
    const switchedOffAny = enforceMaxOn(row.id);
    setEventMessage(
      switchedOffAny
        ? "Not all toggles can be ON. One active toggle was turned OFF automatically."
        : ""
    );
    render();
  }

  function render() {
    rowsContainer.innerHTML = "";

    rows.forEach((row, index) => {
      const li = document.createElement("li");
      li.className = isSharedView ? "row row-toggle-only" : "row";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "toggle";
      toggle.setAttribute("aria-pressed", String(row.isOn));
      toggle.setAttribute("aria-label", `Toggle Row ${index + 1}`);
      toggle.addEventListener("click", () => toggleRow(row.id));

      if (!isSharedView) {
        const label = document.createElement("label");
        label.setAttribute("for", `${row.id}-input`);
        label.textContent = `Row ${index + 1}`;

        const input = document.createElement("input");
        input.id = `${row.id}-input`;
        input.type = "text";
        input.placeholder = "Enter text";
        input.value = row.text;
        input.addEventListener("input", (event) => {
          updateText(row.id, event.target.value);
        });

        li.appendChild(label);
        li.appendChild(input);
      }
      li.appendChild(toggle);
      rowsContainer.appendChild(li);
    });

    addBtn.disabled = rows.length >= MAX_ROWS;
    removeBtn.disabled = rows.length <= MIN_ROWS;

    statusEl.textContent =
      `Rows: ${rows.length} | Max ON: ${maxOn()} | Currently ON: ${activeCount()}`;
    updateShareLink();
  }

  if (!isSharedView) {
    addBtn.addEventListener("click", addRow);
    removeBtn.addEventListener("click", removeRow);
    generateLinkBtn.addEventListener("click", () => {
      updateShareLink();
      setShareMessage("Share link updated.");
    });
    copyLinkBtn.addEventListener("click", async () => {
      updateShareLink();
      try {
        await navigator.clipboard.writeText(shareLinkInput.value);
        setShareMessage("Share link copied to clipboard.");
      } catch (_error) {
        shareLinkInput.select();
        setShareMessage("Clipboard was blocked. Copy from the field manually.", true);
      }
    });
  }

  setupViewMode();
  loadStateFromUrl();
  render();
})();
