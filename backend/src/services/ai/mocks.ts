import type { InterviewQuestionItem } from '../../data/ai';

/**
 * MOCK AI generators — used only when ANTHROPIC_API_KEY is not set.
 * Every response produced here is stored with is_mock = true so the UI can label
 * it honestly as a placeholder. These are deterministic heuristics, not an LLM.
 */

// A small dictionary of skills/keywords to detect inside a job description.
const KNOWN_SKILLS = [
  'TypeScript', 'JavaScript', 'Python', 'Go', 'Java', 'C++', 'Rust', 'Ruby',
  'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Next.js', 'Django', 'Flask',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'GraphQL', 'REST', 'gRPC',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD',
  'System Design', 'Microservices', 'Distributed Systems', 'Data Structures',
  'Algorithms', 'Machine Learning', 'SQL', 'Git', 'Agile', 'Testing',
];

export function mockAnalyzeJob(jobDescription: string): {
  summary: string;
  requiredSkills: string[];
  atsKeywords: string[];
} {
  const lower = jobDescription.toLowerCase();
  const found = KNOWN_SKILLS.filter((skill) => lower.includes(skill.toLowerCase()));

  // Fall back to a sensible default set if nothing matched.
  const requiredSkills = found.length > 0 ? found.slice(0, 12) : ['Communication', 'Problem Solving'];

  // ATS keywords: skills plus a few common role/soft-skill terms present in the JD.
  const extraKeywords = ['collaboration', 'ownership', 'scalable', 'mentorship', 'stakeholders']
    .filter((k) => lower.includes(k))
    .map((k) => k[0].toUpperCase() + k.slice(1));
  const atsKeywords = Array.from(new Set([...requiredSkills, ...extraKeywords]));

  const firstSentence = jobDescription.trim().split(/(?<=[.!?])\s+/)[0]?.slice(0, 200) ?? '';
  const summary = `[Mock] This role emphasizes ${requiredSkills.slice(0, 3).join(', ')}${
    requiredSkills.length > 3 ? ', and related technologies' : ''
  }. ${firstSentence}`.trim();

  return { summary, requiredSkills, atsKeywords };
}

export function mockCoverLetter(input: {
  company: string;
  role: string;
  skills: string[];
}): string {
  const skills = input.skills.length ? input.skills.slice(0, 4).join(', ') : 'full-stack development';
  return `[This is a mock draft — add an ANTHROPIC_API_KEY to generate a real, tailored cover letter.]

Dear Hiring Manager,

I'm excited to apply for the ${input.role} position at ${input.company}. The opportunity to contribute to your team strongly aligns with my background and the problems I most enjoy solving.

In my previous work I've focused on ${skills}, shipping reliable software and collaborating closely with cross-functional teams. I'm drawn to ${input.company} because of the impact and quality of the products you build, and I'm confident I can add value quickly.

I would welcome the chance to discuss how my experience maps to what your team needs. Thank you for your time and consideration.

Sincerely,
[Your Name]`;
}

export function mockInterviewQuestions(company: string, role: string): InterviewQuestionItem[] {
  return [
    { category: 'technical', question: `Walk me through how you would design a scalable system for a core ${role} responsibility.` },
    { category: 'technical', question: 'Describe a challenging bug you debugged. How did you isolate the root cause?' },
    { category: 'technical', question: 'How do you decide between different data storage options for a new feature?' },
    { category: 'behavioral', question: 'Tell me about a time you disagreed with a teammate. How did you resolve it?' },
    { category: 'behavioral', question: 'Describe a project you owned end-to-end. What was the outcome?' },
    { category: 'behavioral', question: 'How do you prioritize when everything feels urgent?' },
    { category: 'company', question: `Why do you want to work at ${company} specifically?` },
    { category: 'company', question: `What do you know about ${company}'s products, and what would you improve?` },
    { category: 'company', question: `How would you contribute to ${company}'s engineering culture as a ${role}?` },
  ];
}
