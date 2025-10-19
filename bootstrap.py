import os
import platform
import subprocess
from pathlib import Path

VENV_PATH = Path("venv")  # Assuming the script is executed at the repository root

OS_NAME = platform.system()
SHELL_BIN_PATH = os.environ.get("SHELL")

match OS_NAME:
	case "Windows":
		pip_path = VENV_PATH / "Scripts" / "pip.exe"
		python_cmd = "python"
	case _:
		pip_path = VENV_PATH / "bin" / "pip"
		python_cmd = "python3"

if not VENV_PATH.exists():
	subprocess.run([python_cmd, "-m", "venv", str(VENV_PATH)], check=True)

subprocess.run(
	[pip_path, "install", "-e", ".[dev]"],
	check=True,
)

subprocess.run(["npm", "install"], cwd="./client/")
