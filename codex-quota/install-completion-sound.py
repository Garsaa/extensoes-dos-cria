#!/usr/bin/env python3
"""Install the local Codex completion sound as a Linux user service."""

import sys
import subprocess
import shutil
from pathlib import Path


UNIT_NAME = "codex-prompt-sound.service"
MARKER = "# Installed by codex-quota/install-completion-sound.py"


def systemd_quote(value):
    return '"' + str(value).replace("\\", "\\\\").replace('"', '\\"').replace("%", "%%") + '"'


def main():
    if sys.platform != "linux":
        raise SystemExit("Este instalador funciona apenas no Linux.")
    node = shutil.which("node")
    if not node:
        raise SystemExit("Node.js não foi encontrado no PATH.")
    if not (shutil.which("ffplay") or shutil.which("mpv")):
        raise SystemExit("Instale ffplay ou mpv antes de ativar o som.")

    script = Path(__file__).resolve().with_name("watch-completed-turns.py")
    unit = Path.home() / ".config" / "systemd" / "user" / UNIT_NAME
    if unit.exists() and MARKER not in unit.read_text():
        raise SystemExit(f"Serviço existente não foi alterado: {unit}")

    unit.parent.mkdir(parents=True, exist_ok=True)
    unit.write_text(
        f"{MARKER}\n"
        "[Unit]\n"
        "Description=Play a sound when a local Codex turn completes\n\n"
        "[Service]\n"
        "Type=simple\n"
        f"Environment={systemd_quote('CODEX_QUOTA_NODE=' + node)}\n"
        f"ExecStart=/usr/bin/python3 {systemd_quote(script)}\n"
        "Restart=on-failure\n"
        "RestartSec=2\n\n"
        "[Install]\n"
        "WantedBy=default.target\n"
    )
    subprocess.run(["systemctl", "--user", "daemon-reload"], check=True)
    subprocess.run(["systemctl", "--user", "enable", "--now", UNIT_NAME], check=True)
    subprocess.run(["systemctl", "--user", "restart", UNIT_NAME], check=True)
    print(f"Som de conclusão ativado. Serviço: {unit}")


if __name__ == "__main__":
    main()
