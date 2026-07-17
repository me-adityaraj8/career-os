/**
 * Founder contact config — one place to edit.
 *
 * Only links with a non-empty value are rendered anywhere in the UI, so it's
 * safe to leave a channel blank until you have it. Fill in the handles below
 * and they'll appear automatically in Settings, the landing page, and the footer.
 */
export const founder = {
  name: 'Aditya',
  /** Repo used for "Report a Bug" / "Request a Feature" issue links. */
  repo: 'https://github.com/me-adityaraj8/career-os',

  email: 'me.adityaraj8@gmail.com',
  github: 'https://github.com/me-adityaraj8',

  // Optional — add when available; blank links are hidden.
  linkedin: '',
  x: '',
  discord: '',
  /** A scheduling link (Cal.com / Calendly / …) for "Book a Call". */
  bookACall: '',
} as const;

const encode = encodeURIComponent;

/** Prefilled links for the quick actions. */
export const founderLinks = {
  reportBug: `${founder.repo}/issues/new?labels=bug&title=${encode('[Bug] ')}`,
  requestFeature: `${founder.repo}/issues/new?labels=enhancement&title=${encode('[Feature] ')}`,
  sendFeedback: `mailto:${founder.email}?subject=${encode('Rys — feedback')}`,
  contact: `mailto:${founder.email}?subject=${encode('Hello from a Rys user')}`,
};
