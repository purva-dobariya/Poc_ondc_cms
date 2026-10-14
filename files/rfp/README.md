# files/rfp/

Where RFP and RFQ documents uploaded through the CMS land.

CloudCannon puts them here because the **Upload the document** field on each
tender is configured with `path: files/rfp` in `cloudcannon.config.yml`.
Everything in `files/` is copied to the site root, so a file here is served at
`/files/rfp/<name>.pdf`.

A tender document can instead be a link to a file already online — the **…or
link to a file already online** field. Uploading wins when both are filled in.

Keep an eye on size. These are committed to Git, so a 30 MB PDF slows every
clone and every build for everyone, forever. Anything above roughly 10 MB is
better hosted on ONDC's S3 with the link pasted in instead — the same reasoning
as the newsletter PDFs described in `files/README.md`.
