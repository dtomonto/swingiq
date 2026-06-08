# File Upload Security

SwingVantage accepts user images/video for swing analysis, so upload handling
is a security domain. This is the Phase-1 reference; the dedicated Upload
Security Center is Phase 2.

## Controls to verify

- **Type validation** — accept only expected image/video MIME types; validate
  MIME *and* extension, don't trust the client.
- **Size limits** — enforce a maximum file size; reject oversized uploads.
- **Upload rate limits** — throttle uploads per user/IP to prevent abuse.
- **Storage permissions** — buckets are private by default; serve via
  short-lived signed URLs, not public ACLs.
- **Path safety** — generate server-side object keys; never build paths from
  raw user input (path-traversal).
- **Metadata** — strip EXIF/location metadata where not needed.
- **Retention/deletion** — honor deletion requests; don't keep media longer
  than needed.

## Gaps tracked in securityOS

- Malware / content-safety scanning of uploaded media (Phase 2 adapter).
- Automated MIME/extension mismatch detection.

## Checklist when touching uploads

- [ ] Validate type + size server-side.
- [ ] Rate-limit the upload endpoint.
- [ ] Confirm storage objects are private + signed-URL accessed.
- [ ] No user input flows into a storage path unsanitized.
- [ ] Deletion removes the underlying object, not just a DB row.
