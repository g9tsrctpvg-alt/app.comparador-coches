#!/usr/bin/env python3
"""Validate the header and lifecycle invariants of specs and ADRs.

Encodes the mechanically checkable rules of docs/proceso/ciclo-de-spec.md and
docs/proceso/consolidacion.md. Judgement calls (is the scope clear? are the
acceptance criteria really verifiable?) stay human and are not checked here.

Standard library only, by design: the project has no stack yet.
Usage: python3 scripts/validate_docs.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

SPEC_DIRS = {"product": REPO_ROOT / "specs" / "product",
             "technical": REPO_ROOT / "specs" / "technical"}
ADR_DIR = REPO_ROOT / "docs" / "decisions"

FILENAME_RE = re.compile(r"^(\d{4})-[a-z0-9]+(-[a-z0-9]+)*\.md$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

SPEC_STATES = ("draft", "approved", "implemented", "verified",
               "consolidated", "superseded")
ADR_STATES = ("draft", "approved", "superseded", "rejected")
ADR_LEVELS = ("🟢", "🟡", "🔴")

SPEC_FIELDS = ("Id", "Estado", "Tipo", "Fecha", "Specs relacionadas",
               "ADRs relacionados", "Doc de estado")
ADR_FIELDS = ("Estado", "Fecha", "Nivel")

# States in which the spec no longer describes the current system.
STATES_NEEDING_CRITERIA = ("approved", "implemented", "verified",
                           "consolidated")

NOTICE_A = "**Spec histórica — implementada, sin consolidar.**"
NOTICE_B = "**Spec consolidada ("

FIELD_RE = re.compile(r"^-\s+\*\*(?P<key>[^:*]+):\*\*\s*(?P<value>.*?)\s*$")


def parse_fields(text: str) -> dict[str, str]:
    """Read the ``- **Key:** value`` header block at the top of a document."""
    fields: dict[str, str] = {}
    for line in text.splitlines():
        if line.startswith("## "):
            break
        match = FIELD_RE.match(line)
        if match:
            fields[match.group("key").strip()] = match.group("value").strip()
    return fields


def section(text: str, title: str) -> str | None:
    """Return the body of a ``## title`` section, or None if absent."""
    pattern = re.compile(
        rf"^##\s+{re.escape(title)}\s*$(?P<body>.*?)(?=^##\s|\Z)",
        re.MULTILINE | re.DOTALL,
    )
    match = pattern.search(text)
    return match.group("body") if match else None


def is_blank(body: str | None) -> bool:
    """A section counts as empty when it holds no text beyond blockquotes."""
    if body is None:
        return True
    meaningful = [
        line for line in body.splitlines()
        if line.strip() and not line.lstrip().startswith(">")
    ]
    return not meaningful


def check_common(path: Path, text: str, fields: dict[str, str],
                 required: tuple[str, ...], states: tuple[str, ...],
                 errors: list[str]) -> None:
    rel = path.relative_to(REPO_ROOT)
    for field in required:
        if field not in fields:
            errors.append(f"{rel}: missing header field '{field}'")
    estado = fields.get("Estado", "")
    if estado and estado not in states:
        errors.append(f"{rel}: unknown Estado '{estado}'")
    fecha = fields.get("Fecha", "")
    if fecha and not DATE_RE.match(fecha):
        errors.append(f"{rel}: Fecha '{fecha}' is not AAAA-MM-DD")
    if not text.lstrip().startswith("# "):
        errors.append(f"{rel}: must start with a level-1 heading")


def check_spec(path: Path, kind: str, errors: list[str]) -> None:
    rel = path.relative_to(REPO_ROOT)
    text = path.read_text(encoding="utf-8")
    fields = parse_fields(text)
    check_common(path, text, fields, SPEC_FIELDS, SPEC_STATES, errors)

    number = path.name[:4]
    tipo = fields.get("Tipo", "")
    if tipo and tipo != kind:
        errors.append(f"{rel}: Tipo '{tipo}' does not match folder '{kind}'")
    expected_id = f"{kind}/{number}"
    if fields.get("Id", "") != expected_id:
        errors.append(f"{rel}: Id must be '{expected_id}'")
    if is_blank(section(text, "Contexto")):
        errors.append(f"{rel}: 'Contexto' is empty")

    estado = fields.get("Estado", "")
    if estado in STATES_NEEDING_CRITERIA:
        criteria = section(text, "Criterios de aceptación") or ""
        if not re.search(r"^\s*-\s*\[[ xX]\]\s*\S", criteria, re.MULTILINE):
            errors.append(
                f"{rel}: Estado '{estado}' requires at least one acceptance "
                f"criterion")
        if not is_blank(section(text, "Decisiones abiertas")):
            errors.append(
                f"{rel}: Estado '{estado}' requires 'Decisiones abiertas' to "
                f"be empty")
        if not fields.get("Doc de estado", ""):
            errors.append(f"{rel}: Estado '{estado}' requires 'Doc de estado'")

    has_a, has_b = NOTICE_A in text, NOTICE_B in text
    if estado in ("implemented", "verified") and not has_a:
        errors.append(f"{rel}: Estado '{estado}' requires notice A")
    if estado == "consolidated":
        if not has_b:
            errors.append(f"{rel}: Estado 'consolidated' requires notice B")
        if has_a:
            errors.append(
                f"{rel}: notice A must be replaced by notice B on consolidation")
    if estado in ("draft", "approved") and (has_a or has_b):
        errors.append(f"{rel}: Estado '{estado}' must carry no historic notice")


def check_adr(path: Path, errors: list[str]) -> None:
    rel = path.relative_to(REPO_ROOT)
    text = path.read_text(encoding="utf-8")
    fields = parse_fields(text)
    check_common(path, text, fields, ADR_FIELDS, ADR_STATES, errors)

    nivel = fields.get("Nivel", "")
    if nivel and nivel not in ADR_LEVELS:
        errors.append(f"{rel}: Nivel must be one of {' '.join(ADR_LEVELS)}")
    for title in ("Contexto", "Decisión", "Alternativas consideradas",
                  "Consecuencias"):
        if is_blank(section(text, title)):
            errors.append(f"{rel}: '{title}' is empty")


def collect(directory: Path, errors: list[str]) -> list[Path]:
    """Return the numbered documents in a directory, checking naming rules."""
    if not directory.is_dir():
        return []
    documents, seen = [], {}
    for path in sorted(directory.glob("*.md")):
        if path.name == "TEMPLATE.md":
            continue
        rel = path.relative_to(REPO_ROOT)
        match = FILENAME_RE.match(path.name)
        if not match:
            errors.append(f"{rel}: name must be NNNN-titulo-en-kebab-case.md")
            continue
        number = match.group(1)
        if number in seen:
            errors.append(f"{rel}: number {number} already used by {seen[number]}")
            continue
        seen[number] = rel
        documents.append(path)
    return documents


def main() -> int:
    errors: list[str] = []
    checked = 0

    for kind, directory in SPEC_DIRS.items():
        if not directory.is_dir():
            errors.append(f"missing directory: specs/{kind}")
            continue
        for path in collect(directory, errors):
            check_spec(path, kind, errors)
            checked += 1

    for path in collect(ADR_DIR, errors):
        check_adr(path, errors)
        checked += 1

    for required in (REPO_ROOT / "specs" / "TEMPLATE.md",
                     ADR_DIR / "TEMPLATE.md"):
        if not required.is_file():
            errors.append(f"missing template: {required.relative_to(REPO_ROOT)}")

    if errors:
        print(f"validate_docs: {len(errors)} problem(s) found\n")
        for error in errors:
            print(f"  - {error}")
        return 1

    print(f"validate_docs: OK ({checked} document(s) checked)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
