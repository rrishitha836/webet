# This function is for loading file data.

import os

def load_file(file: str, default: str = "" ) -> str:
    try:
        with open(file, 'r') as f:
            return f.read()
    except FileNotFoundError:
        print(f"File {file} not found")
    except Exception as e:
        print(f"Error while loading file {file}: {e}")
    return default