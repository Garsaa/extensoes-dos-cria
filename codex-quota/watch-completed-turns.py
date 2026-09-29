#!/usr/bin/env python3
"""Play the completion sound for local Codex turns recorded in its history."""

import logging
import os
import shutil
import sqlite3
import subprocess
import time
from pathlib import Path


CODEX_HOME = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex"))
HISTORY_DB = CODEX_HOME / "thread_history_1.sqlite"
PLAYER = Path(__file__).with_name("notify-turn-complete.js")
NODE = os.environ.get("CODEX_QUOTA_NODE") or shutil.which("node")
LOOKBACK_SECONDS = 300
POLL_SECONDS = 1


def completed_turns(connection, since):
    return connection.execute(
        "SELECT turn_id, completed_at FROM thread_turns "
        "WHERE status = 'completed' AND completed_at >= ? "
        "ORDER BY completed_at, turn_id",
        (since,),
    ).fetchall()


def play_sound():
    result = subprocess.run(
        [NODE, str(PLAYER), '{"type":"agent-turn-complete"}'],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        timeout=15,
        check=False,
    )
    if result.returncode:
        logging.warning("Audio player exited with code %s", result.returncode)
    else:
        logging.info("Completion sound finished")


def watch():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
    while not HISTORY_DB.exists():
        time.sleep(POLL_SECONDS)

    connection = sqlite3.connect(f"file:{HISTORY_DB}?mode=ro", uri=True)
    # Existing completions should not play again when the monitor starts.
    now = int(time.time())
    seen = dict(completed_turns(connection, now - LOOKBACK_SECONDS))
    logging.info("Watching Codex turn completions")

    while True:
        time.sleep(POLL_SECONDS)
        now = int(time.time())
        try:
            recent = completed_turns(connection, now - LOOKBACK_SECONDS)
        except sqlite3.Error:
            logging.exception("Could not read Codex history; reconnecting")
            connection.close()
            connection = sqlite3.connect(f"file:{HISTORY_DB}?mode=ro", uri=True)
            continue

        seen = {turn_id: completed_at for turn_id, completed_at in seen.items()
                if completed_at >= now - LOOKBACK_SECONDS}
        for turn_id, completed_at in recent:
            if turn_id in seen:
                continue
            seen[turn_id] = completed_at
            logging.info("Playing completion sound for turn %s", turn_id)
            try:
                play_sound()
            except (OSError, subprocess.TimeoutExpired):
                logging.exception("Could not play completion sound")


if __name__ == "__main__":
    watch()
