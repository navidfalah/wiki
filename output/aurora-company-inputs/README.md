# Aurora Labs company input pack

125 fictional source files in 17 formats, spanning September 2026.
All companies, employees, contacts, transactions, images and measurements in this pack are synthetic. These are ingestion fixtures, not Wissensbau research findings. Contacts use reserved `.example` domains.

## Files to ingest

`inputs/` contains the actual company sources, organized by department. The sibling `manifest.*` and `reference/` files describe the dataset; keep them out of normal ingestion so expected answers do not contaminate evaluation.

| Format | Source files |
| --- | ---: |
| `.csv` | 12 |
| `.docx` | 6 |
| `.eml` | 18 |
| `.html` | 4 |
| `.json` | 6 |
| `.log` | 6 |
| `.md` | 12 |
| `.pdf` | 10 |
| `.png` | 10 |
| `.pptx` | 2 |
| `.rtf` | 2 |
| `.tsv` | 6 |
| `.txt` | 18 |
| `.xlsx` | 4 |
| `.xml` | 4 |
| `.yaml` | 3 |
| `.zip` | 2 |

## Using the pack

1. Select individual files from `inputs/` in the project's upload/import flow, or manually copy the chosen files into `data/raw/` while preserving subdirectories. Repository policy reserves raw-source changes for humans.
2. Start with the small starter archive. Extract it locally before uploading its contents.
3. For a full run, extract the full archive and select the source files. Uploading the ZIP itself only tests archive listing.
4. Run the existing compiler through the project UI or its normal command once the desired files have been added.
5. Compare the resulting pages with `reference/expected-answers.json` and check the source registry against `manifest.json`.

## Expected limitations and deliberate disagreements

- Images exercise vision captioning. Small or handwritten text may be transcribed imperfectly; compare against the visible image.
- Two PDFs are image-only scans. The current PDF extractor has no OCR, so they intentionally expose an extraction gap. Their corresponding PNGs test the vision path separately.
- ZIP inputs produce an entry listing, not recursive ingestion. RTF inputs are downloadable opaque attachments.
- The historical kickoff says hourly and a two-year battery target. The later requirement says 15 minutes and describes an 18-month engineering estimate at ten nodes, without a measured lifetime.
- A six-node baseline is distinct from the blocked eight-node rejoin retest. Firmware receipt and Ethernet PASS do not establish an overall release approval.
- Repeated references across emails, office documents and exports are intentional. Archive entries duplicate separately supplied records.
- No compiler run or external API processing is triggered by creating this pack.

`reference/image-prompts.json` records the prompts used with the built-in image generation tool. Generated images should be retained with their manifest checksums if the text fixtures are regenerated.
