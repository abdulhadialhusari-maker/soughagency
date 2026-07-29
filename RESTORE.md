# Restore and verify SOGH Public Website v1.0 r2

The archive is self-contained and uses relative paths only.

## Restore source

1. Extract the archive to a new empty directory.
2. Open `01-source/`.
3. Use Node.js 20 or newer.
4. Run `npm ci`.
5. Run `npm run build`.
6. Run `npm run preview` and open `http://localhost:5181/`.

The ready production output is also available in `02-production-dist/` and can
be served as a static site. Keep `noindex, nofollow` until an official domain is
registered and launch metadata is explicitly approved.

## Verify integrity

- Compare packaged artifact hashes with `SHA256SUMS.txt`.
- Compare the archive hash with the sibling `.zip.sha256` file generated after
  the archive was closed.
- Review `FILE-MANIFEST.txt` for the complete relative file inventory.
- Review `04-documentation/FINAL-QA.md` before any release action.

## Exclusions

`node_modules`, `.env.local`, caches, local deployment state, previous release
packages, and temporary screenshots are intentionally excluded. No secret is
required to build or preview the website.

No deployment command is part of this restore procedure.
