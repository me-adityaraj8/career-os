/** Normalized result of importing a job posting, used to pre-fill an application. */
export interface JobImport {
  company: string;
  role: string;
  location: string | null;
  salary: string | null;
  employmentType: string | null;
  skills: string[];
  description: string;
  /** ISO date (YYYY-MM-DD) the posting closes, when the source provides it. */
  deadline: string | null;
  jobUrl: string;
  /** Provider id that produced this result (e.g. "greenhouse", "json-ld"). */
  source: string;
  /** True when we recognized the site but couldn't fully extract the posting. */
  partial: boolean;
  /** User-facing guidance shown for partial/fallback imports. */
  notice?: string;
}

export interface Provider {
  id: string;
  /** Human label for messages ("Greenhouse", "SmartRecruiters"…). */
  label: string;
  /** True if this provider should handle the given URL. */
  match(url: URL): boolean;
  /** Parse the posting or throw ApiError.badRequest with a user-facing message. */
  parse(url: URL): Promise<JobImport>;
}

export const MAX_DESCRIPTION = 5_000;
