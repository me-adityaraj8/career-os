/**
 * Compute a 0-100 resume-match score by comparing the skills a job requires
 * against the skills present on the user's selected resume.
 *
 * The score is the percentage of required skills that the resume covers, matched
 * case-insensitively and tolerant of substrings (so "React" matches "React.js"
 * and "Node" matches "Node.js"). This is deliberately simple and explainable —
 * the same function grounds both the live-LLM and mock code paths so the number
 * never comes purely from the model.
 *
 * Returns null when there are no required skills to compare against.
 */
export function computeMatchScore(
  requiredSkills: string[],
  resumeSkills: string[],
): number | null {
  if (requiredSkills.length === 0) return null;

  const normalizedResume = resumeSkills.map((s) => s.toLowerCase().trim()).filter(Boolean);

  let matched = 0;
  for (const req of requiredSkills) {
    const needle = req.toLowerCase().trim();
    if (!needle) continue;
    const isCovered = normalizedResume.some(
      (have) => have.includes(needle) || needle.includes(have),
    );
    if (isCovered) matched += 1;
  }

  return Math.round((matched / requiredSkills.length) * 100);
}
