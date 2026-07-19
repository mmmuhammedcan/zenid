from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

_env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(["html"]),
)


class CVDataException(Exception):
    pass


def generate_cv_pdf(data: dict) -> bytes:
    if not data.get("full_name", "").strip():
        raise CVDataException("Ad Soyad alanı zorunlu")

    template = _env.get_template("cv_classic.html")
    html_content = template.render(**data)
    return HTML(string=html_content, base_url=str(TEMPLATES_DIR)).write_pdf()
