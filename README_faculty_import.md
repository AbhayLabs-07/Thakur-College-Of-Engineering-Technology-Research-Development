# TCET Faculty Data — Import Notes for Antigravity

## File
`tcet_faculty.csv` — one row per faculty member, columns:

| Column | Notes |
|---|---|
| Name | As printed on department page |
| Designation | Rank/role, includes extra titles (HOD, Dy. HOD, coordinator roles) where stated |
| Department | Full department name |
| Area of Specialization | Only populated where the source page listed one explicitly (IT, EXTC, ES&H, E&CS depts). Blank elsewhere — only qualifications were listed, not a specialization field, for those departments. |
| Email | Intentionally left empty — placeholder column for a future pass once addresses are collected |
| Note | Flags rows pulled from a source PDF that only included some of its pages (see below) |

Total rows: 134 across 12 departments.

## Known gaps
Several of the uploaded PDFs were partial exports (e.g. "page 1 of 9") that only captured
the first page(s) and the contact/footer page, so these department lists are almost
certainly incomplete versus the live site:
- AI&ML (only 5 of a longer list)
- Civil Engineering
- Computer Engineering (Comps) — only 4 of what's likely a large department
- CSE (Cyber Security) — rows 6–10 missing
- Engineering Sciences & Humanities — likely many rows missing (only page 1 of 8)
- EXTC — page 2 missing
- Mechanical Engineering — rows 7–10 missing
- Mechanical & Mechatronics (Additive Mfg) — rows 4–9 missing

Rows from these departments are flagged in the `Note` column. Re-export/re-upload the
missing pages if a complete roster is needed.

## What to ask Antigravity to do
1. Create/update a `faculty` table with columns: `name`, `designation`, `department`,
   `specialization`, `email` (nullable/empty for now).
2. Import `tcet_faculty.csv` into that table (upsert on name + department to avoid dupes
   on re-import).
3. On the faculty dashboard, render each faculty card/row showing: **name**,
   **department**, **area of specialization**.
4. Add an **Email** field/column to the dashboard UI now, left blank — to be populated
   in a later pass once email addresses are sourced.
