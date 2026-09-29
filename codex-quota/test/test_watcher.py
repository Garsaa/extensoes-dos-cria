import importlib.util
import sqlite3
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "watch-completed-turns.py"
SPEC = importlib.util.spec_from_file_location("watch_completed_turns", SCRIPT)
WATCHER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(WATCHER)


class CompletedTurnsTest(unittest.TestCase):
    def test_only_returns_recent_completed_turns(self):
        connection = sqlite3.connect(":memory:")
        connection.execute(
            "CREATE TABLE thread_turns (turn_id TEXT, status TEXT, completed_at INTEGER)"
        )
        connection.executemany(
            "INSERT INTO thread_turns VALUES (?, ?, ?)",
            [
                ("old", "completed", 10),
                ("running", "inProgress", None),
                ("done", "completed", 100),
            ],
        )

        self.assertEqual(WATCHER.completed_turns(connection, 50), [("done", 100)])
        connection.execute(
            "UPDATE thread_turns SET status = 'completed', completed_at = 101 "
            "WHERE turn_id = 'running'"
        )
        self.assertEqual(
            WATCHER.completed_turns(connection, 50),
            [("done", 100), ("running", 101)],
        )


if __name__ == "__main__":
    unittest.main()
