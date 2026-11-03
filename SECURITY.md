# Security policy

## Reporting a vulnerability

Please report a suspected vulnerability privately. Do not open a public issue, pull request or discussion about it.

- **Once the repository is public:** use GitHub private vulnerability reporting ("Report a vulnerability" on the
  repository's Security tab). It is switched on when the repository goes public with release 1.0.0 (#11).
- **Until then:** contact the repository owner, @MOES-Media (the owner in `.github/CODEOWNERS`), directly and
  privately on GitHub, not through an issue.

## What to include

- The package (`@ocelle/tokens`, `@ocelle/styles` or `@ocelle/elements`) and the version or commit affected.
- What the vulnerability is and what an attacker could do with it.
- Steps to reproduce it: a minimal page or test case, the browser and its version, and the Content Security Policy
  in force, if any.
- Any fix or mitigation you know of.
- Whether, and how, you would like to be credited.

Leave out secrets, access tokens and personal data that are not needed to show the problem.

## What happens next

- You receive an acknowledgement within 3 working days of your report.
- You receive a status update within 10 working days of your report: whether the report is confirmed, and the
  planned fix or the reason no fix is planned.
- The fix is released before the vulnerability is disclosed publicly, and the disclosure is agreed with you.
