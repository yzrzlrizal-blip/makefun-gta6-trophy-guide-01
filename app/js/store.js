// Progress store: earned trophies and per-trophy notes, saved in localStorage only.
// Nothing leaves the browser; export and import are plain JSON files the user moves.

export const STORAGE_KEY = "gta6-platinum-road-v1";

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { earned: [], notes: {} };
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      notes:
        parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
    };
  } catch {
    return { earned: [], notes: {} };
  }
}

export function saveProgress(progress) {
  const clean = {
    earned: [...new Set(progress.earned)].sort(),
    notes: progress.notes || {},
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  return clean;
}

export function isEarned(progress, trophyId) {
  return progress.earned.includes(trophyId);
}

export function toggleEarned(progress, trophyId) {
  const earned = new Set(progress.earned);
  if (earned.has(trophyId)) earned.delete(trophyId);
  else earned.add(trophyId);
  return saveProgress({ ...progress, earned: [...earned] });
}

export function setNote(progress, trophyId, text) {
  const notes = { ...(progress.notes || {}) };
  const trimmed = text.trim();
  if (trimmed) notes[trophyId] = trimmed;
  else delete notes[trophyId];
  return saveProgress({ ...progress, notes });
}

export function exportProgress(progress) {
  const blob = new Blob([JSON.stringify(progress, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "gta6-platinum-road-progress.json";
  link.click();
  URL.revokeObjectURL(url);
}

export async function importProgressFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.earned)) {
    throw new Error("That file does not look like a Platinum Road export.");
  }
  const notes =
    parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {};
  return saveProgress({ earned: parsed.earned, notes });
}

export function resetProgress() {
  localStorage.removeItem(STORAGE_KEY);
  return { earned: [], notes: {} };
}
