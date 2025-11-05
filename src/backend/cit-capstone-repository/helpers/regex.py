import re

FIELD_LABELS = {
    "title":       re.compile(r"^\s*Title\s*:\s*(.+)$", re.I),
    "researchers": re.compile(r"^\s*Researchers?\s*:\s*(.+)$", re.I),
    "course":      re.compile(r"^\s*Course\s*:\s*(.+)$", re.I),
    "host":        re.compile(r"^\s*Host\s*:\s*(.+)$", re.I),
    "doc_type":    re.compile(r"^\s*Type of Documents?\s*:\s*(.+)$", re.I),
    "keywords":    re.compile(r"^\s*Keywords?\s*:\s*(.+)$", re.I),
    "year":    re.compile(r"^\s*Year?\s*:\s*(.+)$", re.I),
}
