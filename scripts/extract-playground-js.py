from pathlib import Path

root = Path(__file__).resolve().parent.parent
html_path = root / "test" / "playground.html"
js_path = root / "test" / "playground.js"

lines = html_path.read_text(encoding="utf-8").splitlines()

# Extract inline script body (between <script> and </script> in head)
start = next(i for i, line in enumerate(lines) if line.strip() == '<script type="text/javascript">')
end = next(i for i, line in enumerate(lines) if i > start and line.strip() == "</script>")
js_path.write_text("\n".join(lines[start + 1 : end]) + "\n", encoding="utf-8")

new_lines = (
    lines[:start]
    + ['        <script src="playground.js"></script>']
    + lines[end + 1 :]
)

# Fix APRender bundle path for dist/ deployment (sibling of playground.html)
for i, line in enumerate(new_lines):
    if "APRender.min.js" in line and "playground.js" not in line:
        new_lines[i] = '        <script src="APRender.min.js"></script>'
        break

html_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
print(f"Wrote {js_path.name} ({end - start - 1} lines), trimmed {html_path.name} to {len(new_lines)} lines")
