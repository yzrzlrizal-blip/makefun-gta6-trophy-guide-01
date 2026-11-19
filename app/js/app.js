// Platinum Road — boot, routing and views.
// Loads app/data/trophies.json (same-origin, works offline) and renders the
// checklist, roadmap, missables, planner and about views.

import {
  loadProgress,
  saveProgress,
  toggleEarned,
  setNote,
  exportProgress,
  importProgressFile,
  resetProgress,
} from "./store.js";
import {
  KIND_LABELS,
  filterTrophies,
  sortTrophies,
  countBy,
  nextUp,
  isSpoilerHidden,
} from "./filters.js";

const DATA_URL = "data/trophies.json";
const VIEWS = ["checklist", "roadmap", "missables", "planner", "about"];

const ROADMAP_PHASES = [
  {
    title: "Phase 1 — Play the story, save like it matters",
    time: "Chapters 1–2",
    text: "Play the story at your leisure and let the 12 story trophies come to you. Two habits in this phase save a whole second playthrough: keep one manual save at the start of every chapter, and do Lucia's balcony meditation in Chapter 1 the morning it appears.",
    trophyNames: [
      "Just Like Paradise",
      "Paradise Lost",
      "Trust",
      "Baited My Tackle",
      "Stick Fiddler",
    ],
  },
  {
    title: "Phase 2 — Open up Leonida",
    time: "Chapters 2–3",
    text: "Once switching unlocks, start the systems that take the whole game: scan every vehicle with WAiNK, tag locations, buy garages as you can afford them, and try one of each activity. Do the Yago race the moment it appears in Chapter 3.",
    trophyNames: [
      "T**s Ass Drug Money",
      "Vice City, Baby!",
      "Master of None",
      "Little Boxes",
      "On the Spot",
    ],
  },
  {
    title: "Phase 3 — Robberies and side stories",
    time: "Chapters 3–4",
    text: "Work the robbery set with your partner beside you, and finish the six side-story questlines (Andy, Kenton, Billy, Randy, Tyrone, Bret). The vault jobs open near the end of Chapter 4 — do them before the finale.",
    trophyNames: [
      "Sneakthief",
      "Retail Therapy",
      "Hot Together",
      "Maximum Withdrawal",
      "Strangers & Freaks",
      "Fair Game",
    ],
  },
  {
    title: "Phase 4 — The finale and the checklist",
    time: "Final mission, then post-story",
    text: "Keep an untouched save from just before the final mission, finish the story, then open the 100% checklist under Progress, Stats, 100% Completion. Everything outside the story stays available, so the real work starts now.",
    trophyNames: [
      "You Gotta Know When to Get Off",
      "Top Of The World, Ma",
      "A Long Road",
    ],
  },
  {
    title: "Phase 5 — The long grind",
    time: "Post-story cleanup",
    text: "Clear the checklist one category at a time: 300 stunts, 70 Challenges, 200 vehicles, all 8 vaults, all 39 illegal operations, the card sets and the 100 WAiNK tags. The Platinum pops with the last one.",
    trophyNames: [
      "Cunning Stunts",
      "The Shootist",
      "Top Fun",
      "Don't Touch My Deck",
      "You WAiNKer!",
      "One Last Thing",
    ],
  },
];

let trophies = [];
let sources = [];
let listNote = "";
let progress = loadProgress();
let currentView = "checklist";
let filters = {
  query: "",
  grade: "all",
  kind: "all",
  status: "all",
  missableOnly: false,
  hideSpoilers: true,
};

const viewRoot = document.getElementById("view");

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function difficultyStars(level) {
  return "★".repeat(level) + "☆".repeat(5 - level);
}

function trophyByName(name) {
  return trophies.find((trophy) => trophy.name === name);
}

function updateHeader() {
  const counts = countBy(trophies, progress);
  const earned = counts.earned;
  const total = counts.total || 55;
  const percent = total ? Math.round((earned / total) * 100) : 0;
  document.getElementById("earned-count").textContent = String(earned);
  document.getElementById("progress-fill").style.width = percent + "%";
  document.getElementById("progress-label").textContent =
    percent + "% to the Platinum";
}

function medalNode(trophy) {
  const medal = el("span", "medal " + trophy.grade);
  medal.textContent = trophy.grade === "platinum" ? "P" : trophy.grade[0].toUpperCase();
  medal.title = gradeLabel(trophy.grade);
  return medal;
}

function metaChips(trophy) {
  const wrap = el("span", "trophy-meta");
  const grade = el("span", "chip grade-" + trophy.grade, gradeLabel(trophy.grade));
  wrap.append(grade);
  wrap.append(el("span", "chip", KIND_LABELS[trophy.kind] || trophy.kind));
  if (trophy.target) {
    wrap.append(el("span", "chip", "Target: " + trophy.target.toLocaleString()));
  }
  wrap.append(el("span", "chip", "Difficulty " + difficultyStars(trophy.difficulty)));
  if (trophy.missable) wrap.append(el("span", "chip missable", "Missable"));
  if (trophy.guide.startsWith("UNCONFIRMED")) {
    wrap.append(el("span", "chip unconfirmed", "Unconfirmed method"));
  }
  return wrap;
}

function renderChecklist() {
  viewRoot.innerHTML = "";
  const head = el("div", "view-head");
  head.append(el("h2", "", "All 55 trophies"));
  head.append(
    el(
      "p",
      "",
      "Every trophy in Grand Theft Auto VI, with its official description and a guide in our own words. Tick a trophy when you earn it — your progress is saved in this browser. Use the spoiler switch to hide story trophies you have not earned yet."
    )
  );
  viewRoot.append(head);

  const toolbar = el("div", "toolbar");
  const search = el("input");
  search.type = "search";
  search.placeholder = "Search trophies, guides, places…";
  search.value = filters.query;
  search.setAttribute("aria-label", "Search trophies");
  search.addEventListener("input", () => {
    filters.query = search.value;
    renderChecklistResults();
  });
  toolbar.append(search);

  const gradeSelect = el("select");
  gradeSelect.setAttribute("aria-label", "Filter by grade");
  for (const [value, label] of [
    ["all", "All grades"],
    ["platinum", "Platinum"],
    ["gold", "Gold"],
    ["silver", "Silver"],
    ["bronze", "Bronze"],
  ]) {
    const option = el("option", "", label);
    option.value = value;
    if (filters.grade === value) option.selected = true;
    gradeSelect.append(option);
  }
  gradeSelect.addEventListener("change", () => {
    filters.grade = gradeSelect.value;
    renderChecklistResults();
  });
  toolbar.append(gradeSelect);

  const kindSelect = el("select");
  kindSelect.setAttribute("aria-label", "Filter by kind");
  const kindOption = el("option", "", "All kinds");
  kindOption.value = "all";
  kindSelect.append(kindOption);
  for (const [value, label] of Object.entries(KIND_LABELS)) {
    const option = el("option", "", label);
    option.value = value;
    if (filters.kind === value) option.selected = true;
    kindSelect.append(option);
  }
  kindSelect.addEventListener("change", () => {
    filters.kind = kindSelect.value;
    renderChecklistResults();
  });
  toolbar.append(kindSelect);

  const statusSelect = el("select");
  statusSelect.setAttribute("aria-label", "Filter by earned status");
  for (const [value, label] of [
    ["all", "All trophies"],
    ["todo", "Not earned yet"],
    ["earned", "Earned"],
  ]) {
    const option = el("option", "", label);
    option.value = value;
    if (filters.status === value) option.selected = true;
    statusSelect.append(option);
  }
  statusSelect.addEventListener("change", () => {
    filters.status = statusSelect.value;
    renderChecklistResults();
  });
  toolbar.append(statusSelect);

  const missableLabel = el("label", "check-inline");
  const missableBox = el("input");
  missableBox.type = "checkbox";
  missableBox.checked = filters.missableOnly;
  missableBox.addEventListener("change", () => {
    filters.missableOnly = missableBox.checked;
    renderChecklistResults();
  });
  missableLabel.append(missableBox, document.createTextNode(" Missable only"));
  toolbar.append(missableLabel);

  const spoilerLabel = el("label", "check-inline");
  const spoilerBox = el("input");
  spoilerBox.type = "checkbox";
  spoilerBox.checked = filters.hideSpoilers;
  spoilerBox.addEventListener("change", () => {
    filters.hideSpoilers = spoilerBox.checked;
    renderChecklistResults();
  });
  spoilerLabel.append(spoilerBox, document.createTextNode(" Hide story spoilers"));
  toolbar.append(spoilerLabel);

  viewRoot.append(toolbar);

  const counts = countBy(trophies, progress);
  const chips = el("div", "stat-chips");
  for (const grade of ["platinum", "gold", "silver", "bronze"]) {
    const stat = counts.byGrade[grade] || { total: 0, earned: 0 };
    const chip = el("span", "stat-chip");
    const dot = el("span", "dot");
    dot.style.background =
      grade === "platinum"
        ? "var(--platinum)"
        : grade === "gold"
          ? "var(--gold)"
          : grade === "silver"
            ? "var(--silver)"
            : "var(--bronze)";
    chip.append(dot);
    chip.append(
      document.createTextNode(
        gradeLabel(grade) + ": " + stat.earned + " / " + stat.total
      )
    );
    chips.append(chip);
  }
  const hiddenStat = el("span", "stat-chip");
  hiddenStat.append(
    document.createTextNode(
      "Hidden: " + trophies.filter((t) => t.hidden).length + " of 55"
    )
  );
  chips.append(hiddenStat);
  viewRoot.append(chips);

  const results = el("div", "trophy-grid");
  results.id = "checklist-results";
  viewRoot.append(results);
  renderChecklistResults();
}

function renderChecklistResults() {
  const results = document.getElementById("checklist-results");
  if (!results) return;
  results.innerHTML = "";
  const shown = sortTrophies(filterTrophies(trophies, progress, filters));
  if (shown.length === 0) {
    results.append(
      el(
        "p",
        "empty-note",
        "No trophies match those filters. Clear the search or widen the filters."
      )
    );
    return;
  }
  for (const trophy of shown) {
    const earned = progress.earned.includes(trophy.id);
    const hiddenSpoiler = isSpoilerHidden(trophy, progress, filters.hideSpoilers);
    const card = el("article", "trophy-card" + (earned ? " earned" : ""));
    card.append(medalNode(trophy));
    const body = el("div", "trophy-body");
    body.append(
      el(
        "h3",
        "trophy-name",
        hiddenSpoiler ? "Hidden trophy" : trophy.name
      )
    );
    const desc = el("p", "trophy-desc");
    if (hiddenSpoiler) {
      desc.textContent = "A story trophy — earn it to reveal its name and description.";
      desc.classList.add("hidden-mask");
    } else {
      desc.textContent = trophy.description;
    }
    body.append(desc);
    if (!hiddenSpoiler) body.append(metaChips(trophy));
    card.append(body);
    const toggle = el("button", "earn-toggle", earned ? "✓" : "");
    toggle.type = "button";
    toggle.setAttribute("aria-pressed", earned ? "true" : "false");
    toggle.setAttribute(
      "aria-label",
      (earned ? "Mark not earned: " : "Mark earned: ") + trophy.name
    );
    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      progress = toggleEarned(progress, trophy.id);
      updateHeader();
      renderChecklistResults();
    });
    card.append(toggle);
    card.addEventListener("click", () => openDetail(trophy));
    results.append(card);
  }
}

function renderRoadmap() {
  viewRoot.innerHTML = "";
  const head = el("div", "view-head");
  head.append(el("h2", "", "The road to the Platinum"));
  head.append(
    el(
      "p",
      "",
      "Five phases, in the order that wastes the least time. The whole list takes roughly 150 to 250 hours, and almost all of it is the 100% checklist in Phase 5 — the list is long, not hard. There are no online trophies, no difficulty trophies and no mission medals."
    )
  );
  viewRoot.append(head);
  for (const phase of ROADMAP_PHASES) {
    const box = el("section", "phase");
    const title = el("h3", "", phase.title);
    const time = el("span", "phase-time", phase.time);
    title.append(time);
    box.append(title);
    box.append(el("p", "", phase.text));
    const meta = el("div", "trophy-meta");
    for (const name of phase.trophyNames) {
      const trophy = trophyByName(name);
      if (!trophy) continue;
      const chip = el("span", "chip grade-" + trophy.grade, trophy.name);
      if (progress.earned.includes(trophy.id)) chip.textContent += " ✓";
      meta.append(chip);
    }
    box.append(meta);
    viewRoot.append(box);
  }
}

function renderMissables() {
  viewRoot.innerHTML = "";
  const head = el("div", "view-head");
  head.append(el("h2", "", "Missables — read this first"));
  head.append(
    el(
      "p",
      "",
      "GTA 6 has no mission replay and no New Game Plus, so a missed moment cannot be replayed. The good news: only one trophy is reported as missable, and one race is time-sensitive. Everything else stays available after the credits."
    )
  );
  viewRoot.append(head);

  const missable = trophies.find((trophy) => trophy.missable);
  if (missable) {
    const box = el("section", "phase");
    box.append(el("h3", "", "The one missable trophy: " + missable.name));
    const warn = el("p", "warn-box");
    warn.innerHTML = "";
    const bold = el("b", "", "Missable. ");
    warn.append(bold);
    warn.append(
      document.createTextNode(
        "In Chapter 1, after Lucia is home — a morning after the mission Down to Earth is the usual time — she walks out to the balcony of Jason's house to meditate. Follow her and accept the optional task. It is gone once Chapter 1 ends."
      )
    );
    box.append(warn);
    box.append(el("p", "", missable.guide));
    const open = el("button", "btn", "Open the full guide");
    open.type = "button";
    open.addEventListener("click", () => openDetail(missable));
    box.append(open);
    viewRoot.append(box);
  }

  const timed = el("section", "phase");
  timed.append(el("h3", "", "Time-sensitive: the race against Yago"));
  timed.append(
    el(
      "p",
      "",
      "In Chapter 3, a street race against Yago appears in the racing strand with an hourglass icon. It counts toward the Strangers & Freaks strand, so save first and race the moment it appears — do not leave it for later."
    )
  );
  viewRoot.append(timed);

  const saves = el("section", "phase");
  saves.append(el("h3", "", "The save strategy that covers everything"));
  const list = el("ol");
  for (const step of [
    "Keep one manual save at the start of every chapter. The game has 15 manual save slots plus one autosave — that is plenty.",
    "Keep one untouched manual save from just before the final mission.",
    "Never test cheats on your trophy save: cheats are expected to switch off trophies and saving.",
    "Keep your Chapter 1 save until Positive Mental Attitude pops, just in case the balcony meditation turns out to be required.",
  ]) {
    list.append(el("li", "", step));
  }
  saves.append(list);
  viewRoot.append(saves);
}

function renderPlanner() {
  viewRoot.innerHTML = "";
  const head = el("div", "view-head");
  head.append(el("h2", "", "Next up — the easiest trophies left"));
  head.append(
    el(
      "p",
      "",
      "The five easiest trophies you have not earned yet, excluding story trophies — the story takes care of itself. Pick one, do it, tick it off, and come back for the next five."
    )
  );
  viewRoot.append(head);

  const picks = nextUp(trophies, progress, 5);
  const list = el("div", "next-list");
  if (picks.length === 0) {
    list.append(
      el("p", "empty-note", "Nothing left but the story — or the Platinum itself. Congratulations.")
    );
  }
  for (const trophy of picks) {
    const item = el("button", "next-item");
    item.type = "button";
    item.append(medalNode(trophy));
    const body = el("div", "trophy-body");
    body.append(el("h3", "trophy-name", trophy.name));
    body.append(el("p", "trophy-desc", trophy.description));
    body.append(metaChips(trophy));
    item.append(body);
    const reason = el("span", "next-reason", "Difficulty " + difficultyStars(trophy.difficulty));
    item.append(reason);
    item.addEventListener("click", () => openDetail(trophy));
    list.append(item);
  }
  viewRoot.append(list);

  const counts = countBy(trophies, progress);
  const bars = el("div");
  bars.append(el("h3", "", "Progress by kind"));
  for (const [kind, label] of Object.entries(KIND_LABELS)) {
    const stat = counts.byKind[kind];
    if (!stat) continue;
    const percent = Math.round((stat.earned / stat.total) * 100);
    const bar = el("div", "kind-bar");
    const row = el("div", "kind-label");
    row.append(el("span", "", label));
    row.append(el("span", "", stat.earned + " / " + stat.total));
    bar.append(row);
    const track = el("div", "progress-bar");
    const fill = el("div", "progress-fill");
    fill.style.width = percent + "%";
    track.append(fill);
    bar.append(track);
    bars.append(bar);
  }
  viewRoot.append(bars);
}

function renderAbout() {
  viewRoot.innerHTML = "";
  const head = el("div", "view-head");
  head.append(el("h2", "", "About this guide"));
  head.append(
    el(
      "p",
      "",
      "Platinum Road is a free, open-source, offline trophy guide for Grand Theft Auto VI. It runs entirely from its own files — no network, no account, no ads — and your progress never leaves this browser."
    )
  );
  viewRoot.append(head);

  const honest = el("section", "phase");
  honest.append(el("h3", "", "What is confirmed, and what is not"));
  honest.append(
    el(
      "p",
      "",
      "The trophy names, descriptions, grades and PSN progress targets are the official list as published at launch week. The step-by-step guides are our own writing, built from those official descriptions and launch-week reporting. Five trophies had no confirmed unlock method at launch — In The Beginning…, Capital Offense, Bad Luck, I Guess, The Truth Is Out There and Ten Pin — plus Personal Best, whose method is reported but not proven. Those entries say so plainly instead of inventing a method. Where a place or step is not pinned down, the guide says so."
    )
  );
  viewRoot.append(honest);

  const how = el("section", "phase");
  how.append(el("h3", "", "How to use it"));
  const list = el("ol");
  for (const step of [
    "Start on the Checklist tab and tick trophies off as you earn them.",
    "Read the Missables tab before you finish Chapter 1 — it takes two minutes and saves a replay.",
    "Follow the Roadmap tab in order; it puts the long grinds last, when they are cheapest.",
    "Use the Next up tab when you have an hour and want the easiest win available.",
    "Export your progress from the footer before you clear your browser data.",
  ]) {
    list.append(el("li", "", step));
  }
  how.append(list);
  viewRoot.append(how);

  const src = el("section", "phase");
  src.append(el("h3", "", "Sources"));
  const listEl = el("ul", "sources");
  for (const source of sources) {
    listEl.append(el("li", "", source));
  }
  listEl.append(
    el(
      "li",
      "",
      "Guide text: written for this guide from the official descriptions above. No guide text is copied from any other site."
    )
  );
  src.append(listEl);
  viewRoot.append(src);

  const note = el("section", "phase");
  note.append(el("h3", "", "A note on the list itself"));
  note.append(
    el(
      "p",
      "",
      listNote ||
        "55 trophies: 1 Platinum, 2 Gold, 6 Silver, 46 Bronze. 28 are hidden until earned."
    )
  );
  viewRoot.append(note);
}

function renderView() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === currentView);
  });
  if (currentView === "roadmap") renderRoadmap();
  else if (currentView === "missables") renderMissables();
  else if (currentView === "planner") renderPlanner();
  else if (currentView === "about") renderAbout();
  else renderChecklist();
}

function openDetail(trophy) {
  const backdrop = document.getElementById("detail-backdrop");
  const pane = document.getElementById("detail-pane");
  pane.innerHTML = "";
  const close = el("button", "detail-close", "Close ✕");
  close.type = "button";
  close.addEventListener("click", closeDetail);
  pane.append(close);

  const earned = progress.earned.includes(trophy.id);
  pane.append(medalNode(trophy));
  pane.append(el("h2", "", trophy.name));
  pane.append(el("p", "detail-official", "Official description: “" + trophy.description + "”"));
  pane.append(metaChips(trophy));

  if (trophy.missable) {
    const warn = el("p", "warn-box");
    const bold = el("b", "", "Missable. ");
    warn.append(bold);
    warn.append(
      document.createTextNode(
        "This is the only trophy in the game reported as missable. Do the Chapter 1 balcony meditation and keep a Chapter 1 save until it pops."
      )
    );
    pane.append(warn);
  }
  if (trophy.guide.startsWith("UNCONFIRMED")) {
    const note = el("p", "note-box");
    const bold = el("b", "", "Not yet confirmed in the game. ");
    note.append(bold);
    note.append(
      document.createTextNode(
        "No verified unlock method exists yet at launch. The guide below is the best reading of the official description, not a proven route."
      )
    );
    pane.append(note);
  }

  pane.append(el("h3", "", "How to unlock it"));
  const guideText = trophy.guide.replace(/^UNCONFIRMED at launch — /, "");
  pane.append(el("p", "", guideText));
  if (trophy.tip) {
    pane.append(el("h3", "", "Tip"));
    pane.append(el("p", "", trophy.tip));
  }
  pane.append(el("h3", "", "At a glance"));
  const glance = el("ul");
  glance.append(el("li", "", "Grade: " + gradeLabel(trophy.grade)));
  glance.append(el("li", "", "Kind: " + (KIND_LABELS[trophy.kind] || trophy.kind)));
  if (trophy.target) {
    glance.append(
      el("li", "", "PSN target: " + trophy.target.toLocaleString())
    );
  }
  glance.append(el("li", "", "Difficulty: " + difficultyStars(trophy.difficulty)));
  glance.append(el("li", "", "Rough time: " + trophy.time));
  glance.append(el("li", "", trophy.hidden ? "Hidden until earned." : "Visible from the start."));
  pane.append(glance);

  pane.append(el("h3", "", "Your notes"));
  const notesField = el("textarea", "notes-field");
  notesField.value = progress.notes[trophy.id] || "";
  notesField.placeholder = "Your own notes for this trophy — a location, a loadout, a reminder…";
  notesField.setAttribute("aria-label", "Your notes for " + trophy.name);
  notesField.addEventListener("change", () => {
    progress = setNote(progress, trophy.id, notesField.value);
  });
  pane.append(notesField);

  pane.append(el("h3", "", "Sources"));
  const srcList = el("ul", "sources");
  srcList.append(
    el(
      "li",
      "",
      "Name, description and grade: the official list on Exophase; PSN target: PSNProfiles."
    )
  );
  srcList.append(
    el("li", "", "Guide: our own advice from the official description, not yet checked in the game.")
  );
  pane.append(srcList);

  const actions = el("div", "detail-actions");
  const earnButton = el(
    "button",
    "btn",
    earned ? "✓ Earned — mark not earned" : "Mark as earned"
  );
  earnButton.type = "button";
  earnButton.addEventListener("click", () => {
    progress = toggleEarned(progress, trophy.id);
    updateHeader();
    closeDetail();
    renderView();
  });
  actions.append(earnButton);
  pane.append(actions);

  backdrop.hidden = false;
  close.focus();
}

function closeDetail() {
  document.getElementById("detail-backdrop").hidden = true;
}

function routeFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  currentView = VIEWS.includes(hash) ? hash : "checklist";
  closeDetail();
  window.scrollTo(0, 0);
  renderView();
}

async function boot() {
  const response = await fetch(DATA_URL);
  const data = await response.json();
  trophies = data.trophies;
  sources = data.sources || [];
  listNote = data.list || "";

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      window.location.hash = "#/" + tab.dataset.view;
    });
  });
  window.addEventListener("hashchange", routeFromHash);
  document
    .getElementById("detail-backdrop")
    .addEventListener("click", (event) => {
      if (event.target.id === "detail-backdrop") closeDetail();
    });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDetail();
  });

  document.getElementById("export-btn").addEventListener("click", () => {
    exportProgress(progress);
  });
  document.getElementById("reset-btn").addEventListener("click", () => {
    if (window.confirm("Clear all earned trophies and notes in this browser?")) {
      progress = resetProgress();
      updateHeader();
      renderView();
    }
  });
  document
    .getElementById("import-file")
    .addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        progress = await importProgressFile(file);
        updateHeader();
        renderView();
      } catch (error) {
        window.alert(error.message);
      }
      event.target.value = "";
    });

  updateHeader();
  routeFromHash();
  saveProgress(progress);
}

boot().catch((error) => {
  viewRoot.innerHTML = "";
  viewRoot.append(
    el(
      "p",
      "empty-note",
      "The trophy list could not be loaded. Check that app/data/trophies.json is present next to this page. (" +
        error.message +
        ")"
    )
  );
});
