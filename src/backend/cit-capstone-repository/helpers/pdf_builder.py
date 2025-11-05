from __future__ import annotations

import io
import re
from typing import Iterable, List, Optional, Sequence, Tuple

import fitz


def _clean_text_blocks(blocks: Iterable[str]) -> List[str]:
    cleaned: List[str] = []
    for block in blocks:
        if not block:
            continue
        text = str(block).strip()
        if text:
            cleaned.append(text)
    return cleaned


def build_capstone_pdf(
    *,
    title: Optional[str],
    year: Optional[int],
    course: Optional[str],
    host: Optional[str],
    doc_type: Optional[str],
    authors: Sequence[str],
    keywords: Sequence[str],
    abstract: Optional[str],
    sections: Sequence[Tuple[Optional[str], Optional[str]]],
) -> bytes:
    """Render a simple PDF document summarizing the provided capstone details."""
    meta_lines: List[str] = []
    if year:
        meta_lines.append(f"Year: {year}")
    if course:
        meta_lines.append(f"Course: {course}")
    if host:
        meta_lines.append(f"Host: {host}")
    if doc_type:
        meta_lines.append(f"Document Type: {doc_type}")

    blocks: List[str] = []
    if title:
        blocks.append(title.strip())
    if meta_lines:
        blocks.append("\n".join(meta_lines))
    if authors:
        blocks.append("Authors: " + ", ".join(a for a in authors if a))
    if keywords:
        blocks.append("Keywords: " + ", ".join(k for k in keywords if k))
    if abstract:
        blocks.append("Abstract\n" + abstract.strip())

    if sections:
        section_lines: List[str] = ["Sections"]
        for heading, content in sections:
            heading_text = (heading or "").strip()
            content_text = (content or "").strip()
            if heading_text:
                section_lines.append(heading_text)
            if content_text:
                section_lines.append(content_text)
        blocks.append("\n\n".join(_clean_text_blocks(section_lines)))

    text_blocks = _clean_text_blocks(blocks)
    document_text = "\n\n".join(text_blocks) if text_blocks else "No content available for this capstone."
    doc = fitz.open()

    margin = 54
    font_size = 11
    line_spacing = font_size * 1.5
    paragraph_spacing = line_spacing * 0.6
    font_name = "helv"

    def new_page(state: dict) -> None:
        state["page"] = doc.new_page()
        state["y"] = margin

    state = {"page": None, "y": margin}
    new_page(state)
    max_width_value = state["page"].rect.width - 2 * margin

    def ensure_room(state: dict) -> None:
        page = state["page"]
        if state["y"] + line_spacing > page.rect.height - margin:
            new_page(state)

    def write_line(text: str, align: int, state: dict) -> None:
        ensure_room(state)
        page = state["page"]
        max_width = page.rect.width - 2 * margin
        rect = fitz.Rect(margin, state["y"], margin + max_width, state["y"] + line_spacing)
        page.insert_textbox(
            rect,
            text,
            fontsize=font_size,
            fontname=font_name,
            color=(0, 0, 0),
            align=align,
        )
        state["y"] += line_spacing

    space_width = fitz.get_text_length(" ", fontname=font_name, fontsize=font_size)

    def wrap_paragraph(paragraph: str) -> List[Tuple[str, bool]]:
        words = paragraph.split()
        if not words:
            return []
        lines: List[List[str]] = []
        current: List[str] = []
        current_width = 0.0
        for word in words:
            word_width = fitz.get_text_length(word, fontname=font_name, fontsize=font_size)
            prospective = word_width if not current else current_width + space_width + word_width
            if current and prospective > max_width_value and current_width > 0:
                lines.append(current)
                current = [word]
                current_width = word_width
            else:
                current.append(word)
                current_width = prospective if current_width else word_width
        if current:
            lines.append(current)

        wrapped: List[Tuple[str, bool]] = []
        for idx, line_words in enumerate(lines):
            is_last = idx == len(lines) - 1
            line_text = " ".join(line_words)
            wrapped.append((line_text, is_last or len(line_words) == 1))
        return wrapped

    for block in text_blocks:
        segments = [seg.strip() for seg in block.split("\n")]
        segments = [seg for seg in segments if seg]
        if not segments:
            continue
        for segment in segments:
            for line_text, is_last in wrap_paragraph(segment):
                align = fitz.TEXT_ALIGN_LEFT if is_last else fitz.TEXT_ALIGN_JUSTIFY
                write_line(line_text, align, state)
            state["y"] += paragraph_spacing
        state["y"] += paragraph_spacing

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer.read()


def build_download_filename(title: Optional[str], project_id: int) -> str:
    """Generate a user-friendly PDF filename derived from the capstone title."""
    if title:
        cleaned = re.sub(r'[\\/*?:"<>|]', "", title)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
    else:
        cleaned = ""
    if not cleaned:
        cleaned = f"capstone-{project_id}"
    return f"{cleaned}.pdf"
