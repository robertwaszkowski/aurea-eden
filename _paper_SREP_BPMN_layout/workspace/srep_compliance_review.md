# Scientific Reports — Compliance Review
**Paper:** *Dynamic Topological Layout and Orthogonal Routing Algorithm for BPMN Diagrams*
**Reviewed against:** [Submission Guidelines](https://www.nature.com/srep/author-instructions/submission-guidelines) · [Aims & Scope](https://www.nature.com/srep/about/aims)

---

## 1. Scope / Fit for the Journal

> [!IMPORTANT]
> **Borderline fit.** Scientific Reports' Engineering scope covers "all aspects of engineering, technology, and applied science." A graph layout algorithm for BPMN diagrams qualifies as applied computer science / software engineering, so the topic is acceptable. However, the paper must be framed as reporting **original empirical results** — not just a design proposal. Currently the empirical validation study is only *proposed* (future work), which significantly weakens the case for acceptance.

---

## 2. Abstract

| Criterion | Requirement | Status |
|---|---|---|
| Max length | ≤ 200 words | ⚠️ **~185 words** — just within limit, but very tight |
| No references | References prohibited in abstract | ✅ Compliant |
| Unstructured | No headings/subheadings | ✅ Compliant |
| General intro + result summary | Must serve as brief summary of *results* | ❌ **No concrete results reported** — the abstract describes a proposed system and future benchmark plan, not actual findings |
| No graphical abstract | N/A for LaTeX | ✅ |

**Action needed:** The abstract must report actual results or findings. Phrases like *"is outlined to formally validate"* signal that the work is not complete.

---

## 3. Keywords

> [!NOTE]
> The paper currently has **no `\keywords{}` command**. SREP allows up to 6 keywords for indexing. This field is missing entirely.

---

## 4. Article Structure

SREP's recommended structure is **Introduction → Results → Discussion → Methods**. The paper currently uses:

`Introduction → State of the Art → Algorithm Architecture (Phases 1–7) → Discussion & Empirical Plan → Phases 8–12 → Conclusion`

| Issue | Detail |
|---|---|
| ❌ No `Results` section | The algorithm description acts as a Methods/Architecture section, but there are no actual results (no experiment run, no benchmark data) |
| ❌ No `Methods` section | Required for reproducibility — the algorithm phases are written discursively, not as a formal Methods section |
| ❌ No `Data Availability Statement` | **Mandatory** — must appear at end of main text before References |
| ❌ No `Author Contributions` statement | **Mandatory** |
| ❌ No `Competing Interests` statement | **Mandatory** |
| ❌ No `Acknowledgements` | Optional, but its absence alongside the missing mandatory sections is notable |
| ⚠️ Phases 8–12 are speculative | Sections on WebAssembly, CRDTs, ML overlay, and real-time debugging are entirely future/aspirational — not results |

---

## 5. Word Count & Page Length

SREP recommends:
- Main text ≤ **4,500 words** (excluding Abstract, Methods, References, figure legends)
- Article ≤ **11 typeset pages**
- Display items ≤ **8** (figures + tables combined)

| Criterion | Estimate | Status |
|---|---|---|
| Main text word count | ~6,000–7,000 words (estimated from 621 lines, excluding preamble) | ❌ **Likely exceeds 4,500 word recommendation** |
| Typeset pages | 18 pages (from PDF) | ❌ **Exceeds 11-page recommendation by ~7 pages** |
| Display items | 5 figures (TikZ) + 2 tables + 3 algorithms = **10+ display items** | ❌ **Exceeds 8-item limit** |

> [!WARNING]
> The 18-page PDF is a serious concern. Phases 8–12 alone contribute at least 6–7 pages of speculative content that could be moved to Supplementary Information or removed.

---

## 6. References

| Criterion | Requirement | Status |
|---|---|---|
| Numerical, sequential | Square-bracket numbering | ⚠️ The [naturemag-doi.bst](file:///Users/robert/Documents/VSCodeProjects/aurea-eden/paper_SREP/SREP_2026_Waszkowski/naturemag-doi.bst) style should produce numerical refs, but the **`ref_*` BibTeX keys are non-sequential labels** — verify the rendered numbering in the PDF |
| Max ~60 references | Soft limit | ✅ 33 entries — well within limit |
| No [.bib](file:///Users/robert/Documents/VSCodeProjects/aurea-eden/paper_SREP/SREP_2026_Waszkowski/sample.bib) file submission | Submit [.bbl](file:///Users/robert/Documents/VSCodeProjects/aurea-eden/paper_SREP/SREP_2026_Waszkowski/main.bbl) file instead | ⚠️ **Important:** SREP *cannot* accept [.bib](file:///Users/robert/Documents/VSCodeProjects/aurea-eden/paper_SREP/SREP_2026_Waszkowski/sample.bib) files; submit the compiled [2026_Waszkowski_BPMN_layout.bbl](file:///Users/robert/Documents/VSCodeProjects/aurea-eden/paper_SREP/SREP_2026_Waszkowski/2026_Waszkowski_BPMN_layout.bbl) as a LaTeX supplementary file |
| Author list format | ≤5 authors → list all; ≥6 → first author + *et al.* | ⚠️ Several entries use `and others` in BibTeX which may not render correctly; verify in [.bbl](file:///Users/robert/Documents/VSCodeProjects/aurea-eden/paper_SREP/SREP_2026_Waszkowski/main.bbl) |
| Journal names abbreviated | Italicised and abbreviated per usage | ⚠️ Several entries use full journal names (e.g. *Information and Software Technology*) — should be abbreviated |

---

## 7. Writing Style

> [!CAUTION]
> Several sections contain severely inflated, repetitive language that violates SREP's plain-language requirement ("write concisely", "avoid technical jargon", "communicate findings as clearly as possible"). Specific examples:
> - **Metric 4 description** (line ~450): a single bullet point runs to ~400 words of recursive filler text.
> - **Phases 9, 10, 12** contain paragraphs of near-meaningless word-salad prose that must be rewritten entirely.
> - Table captions are excessively verbose (e.g. the complexity table caption is ~60 words).

---

## 8. Missing Mandatory Declarations (Checklist)

The following are **required** by SREP and currently absent from the paper:

- [ ] **Keywords** (≤ 6) — add `\keywords{}` command
- [ ] **Author Contributions statement** — describe each author's role
- [ ] **Data Availability statement** — must appear before References; for a purely computational paper, a statement like *"No datasets were generated or analysed"* or a link to a code repository is required
- [ ] **Competing Interests statement** — even if none, state *"The author declares no competing interests."*
- [ ] **Affiliation** — currently placeholder: `Affiliation, department, city, postcode, country`
- [ ] **Corresponding author email** — currently placeholder: `corresponding.author@example.com`
- [ ] **Cover letter** — required for submission (separate document)

---

## 9. LaTeX / Technical

| Item | Status |
|---|---|
| [wlscirep.cls](file:///Users/robert/Documents/VSCodeProjects/aurea-eden/paper_SREP/SREP_2026_Waszkowski/wlscirep.cls) used | ✅ Correct template class |
| [.bbl](file:///Users/robert/Documents/VSCodeProjects/aurea-eden/paper_SREP/SREP_2026_Waszkowski/main.bbl) file exists and compiles | ✅ [2026_Waszkowski_BPMN_layout.bbl](file:///Users/robert/Documents/VSCodeProjects/aurea-eden/paper_SREP/SREP_2026_Waszkowski/2026_Waszkowski_BPMN_layout.bbl) generated |
| [.bib](file:///Users/robert/Documents/VSCodeProjects/aurea-eden/paper_SREP/SREP_2026_Waszkowski/sample.bib) file must not be submitted | ⚠️ Submit [.bbl](file:///Users/robert/Documents/VSCodeProjects/aurea-eden/paper_SREP/SREP_2026_Waszkowski/main.bbl) instead |
| Backtick `` ` `` in `\lstlisting` | ⚠️ Compile log shows `Missing character: There is no `` ` `` in font nullfont` — use `\textasciigrave` or verbatim mode |
| Broken TikZ UML diagram (line 398) | ⚠️ A stray triple-backtick ` ``` ` appears in the source at line ~398 inside a `tikzpicture`, which may cause rendering issues |
| Phase 4 missing from complexity table | ⚠️ Table 1 lists phases 1, 2, 3, 5, 6, 7 — Phase 4 is skipped |

---

## Summary Prioritised Action List

| Priority | Issue |
|---|---|
| 🔴 Critical | No actual results — the paper is currently a *design proposal*, not a completed study |
| 🔴 Critical | Missing mandatory sections: Data Availability, Author Contributions, Competing Interests |
| 🔴 Critical | Placeholder affiliation and email must be filled in |
| 🟠 High | 18 pages / ~7,000 words — needs major trimming; Phases 8–12 should move to Supplementary Info or be removed |
| 🟠 High | Word-salad paragraphs in Phases 9, 10, 12 must be rewritten |
| 🟠 High | Display items likely exceed 8 (combine or move figures to SI) |
| 🟡 Medium | Missing `\keywords{}` |
| 🟡 Medium | Submit [.bbl](file:///Users/robert/Documents/VSCodeProjects/aurea-eden/paper_SREP/SREP_2026_Waszkowski/main.bbl) not [.bib](file:///Users/robert/Documents/VSCodeProjects/aurea-eden/paper_SREP/SREP_2026_Waszkowski/sample.bib) |
| 🟡 Medium | Fix stray backtick ` ``` ` in TikZ source (line ~398) |
| 🟡 Medium | Fix `Missing character` warnings for backticks in lstlisting |
| 🟢 Low | Abbreviate journal names in bibliography |
| 🟢 Low | Phase 4 missing from complexity table |
