// Filtering, searching and the spoiler rule for the trophy list.
// The spoiler rule: with spoilers hidden, a hidden trophy the player has not
// earned yet shows no name, description or guide — only that it exists.

export const KIND_LABELS = {
  platinum: "Platinum & 100%",
  story: "Story",
  side: "Side stories",
  robbery: "Robbery",
  activity: "Activities",
  collectible: "Collectibles",
  exploration: "Exploration",
  money: "Money & property",
  combat: "Combat",
  misc: "Oddities",
};

export const GRADE_ORDER = ["platinum", "gold", "silver", "bronze"];

export function isSpoilerHidden(trophy, progress, hideSpoilers) {
  return hideSpoilers && trophy.hidden && !progress.earned.includes(trophy.id);
}

export function filterTrophies(trophies, progress, options) {
  const query = (options.query || "").trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (options.grade !== "all" && trophy.grade !== options.grade) return false;
    if (options.kind !== "all" && trophy.kind !== options.kind) return false;
    if (options.status === "earned" && !progress.earned.includes(trophy.id))
      return false;
    if (options.status === "todo" && progress.earned.includes(trophy.id))
      return false;
    if (options.missableOnly && !trophy.missable) return false;
    if (query) {
      const haystack = [
        trophy.name,
        trophy.description,
        trophy.guide,
        KIND_LABELS[trophy.kind] || trophy.kind,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function sortTrophies(trophies) {
  const byGrade = new Map(GRADE_ORDER.map((grade, index) => [grade, index]));
  return [...trophies].sort((a, b) => {
    const gradeDiff = (byGrade.get(a.grade) ?? 9) - (byGrade.get(b.grade) ?? 9);
    if (gradeDiff !== 0) return gradeDiff;
    return a.name.localeCompare(b.name);
  });
}

export function countBy(trophies, progress) {
  const counts = { total: trophies.length, earned: 0, byGrade: {}, byKind: {} };
  for (const trophy of trophies) {
    const earned = progress.earned.includes(trophy.id);
    if (earned) counts.earned += 1;
    counts.byGrade[trophy.grade] = counts.byGrade[trophy.grade] || {
      total: 0,
      earned: 0,
    };
    counts.byGrade[trophy.grade].total += 1;
    if (earned) counts.byGrade[trophy.grade].earned += 1;
    counts.byKind[trophy.kind] = counts.byKind[trophy.kind] || {
      total: 0,
      earned: 0,
    };
    counts.byKind[trophy.kind].total += 1;
    if (earned) counts.byKind[trophy.kind].earned += 1;
  }
  return counts;
}

// "Next up": the easiest unearned trophies, story trophies excluded — the
// story takes care of itself. Easiest first, then shortest time, then name.
export function nextUp(trophies, progress, limit = 5) {
  return trophies
    .filter(
      (trophy) =>
        !progress.earned.includes(trophy.id) && trophy.kind !== "story"
    )
    .sort((a, b) => {
      if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
      if (a.grade !== b.grade)
        return GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade);
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}
