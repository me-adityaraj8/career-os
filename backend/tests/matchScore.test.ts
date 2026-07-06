import { describe, it, expect } from 'vitest';
import { computeMatchScore } from '../src/services/ai/matchScore';

describe('computeMatchScore', () => {
  it('returns null when there are no required skills', () => {
    expect(computeMatchScore([], ['React'])).toBeNull();
  });

  it('returns 100 when the resume covers every required skill', () => {
    expect(
      computeMatchScore(['React', 'Node.js'], ['React', 'Node.js', 'PostgreSQL']),
    ).toBe(100);
  });

  it('returns 0 when nothing matches', () => {
    expect(computeMatchScore(['Rust', 'Go'], ['React', 'Python'])).toBe(0);
  });

  it('computes a rounded percentage of covered skills', () => {
    // 2 of 3 covered -> 67
    expect(computeMatchScore(['React', 'Node', 'Kubernetes'], ['React', 'Node.js'])).toBe(67);
  });

  it('matches case-insensitively and on substrings', () => {
    // "node" required, resume has "Node.js"; "react" required, resume has "React"
    expect(computeMatchScore(['node', 'REACT'], ['Node.js', 'React'])).toBe(100);
  });
});
