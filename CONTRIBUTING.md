# Contributing

## Development

```bash
npm install
npm run build
npm pack --dry-run
```

## Expectations

- Keep the public API small and stable.
- Prefer boring, explicit shell and process behavior over clever abstractions.
- Preserve action pinning and least-privilege permissions in GitHub Actions.
- If you change packaging, verify the tarball contents with `npm pack --dry-run`.
- If you change launch behavior, test both success and failure paths.

## Release Model

- CI validates build and package shape on pushes and pull requests.
- Publishing is driven by version tags like `v0.1.0`.
- The publish workflow verifies that the git tag matches `package.json` before publishing.
