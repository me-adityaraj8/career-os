# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Instead, report privately via GitHub's [security advisories](https://github.com/me-adityaraj8/rys/security/advisories/new). If that's unavailable, email the maintainer listed on the GitHub profile.

Include, where possible:

- A description of the issue and its impact
- Steps to reproduce (a proof of concept helps)
- Affected component (frontend, backend, or infrastructure)

You can expect an initial acknowledgement within a few days. Once a fix is prepared, we'll coordinate a disclosure timeline with you.

## Scope

In scope: the application code in this repository (frontend, backend API, and the deployment configuration).

Out of scope: vulnerabilities in third-party dependencies (please report those upstream), and issues that require a compromised device or a self-XSS.

## Handling of secrets

No secrets are committed to this repository. API keys and database credentials are supplied at runtime through environment variables (see `backend/.env.example`). If you believe a secret has been committed, please report it as a vulnerability.
