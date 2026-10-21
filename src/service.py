# =========================================================
# J.A.R.V.I.S. Python Auxiliary Background Service
# Standard Python worker process communicating with Electron
# =========================================================

import sys
import json
import time

def handle_message(payload):
    """
    Handle incoming JSON messages from Electron main process
    """
    action = payload.get("action", "")
    
    if action == "ping":
        return {"status": "ok", "response": "pong", "timestamp": time.time()}
    elif action == "echo":
        return {"status": "ok", "echo": payload.get("data")}
    else:
        return {"status": "unknown_action", "action": action}

def main():
    print("[JARVIS Python Service] Auxiliary worker started.", flush=True)
    
    try:
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            
            try:
                payload = json.loads(line)
                res = handle_message(payload)
                print(json.dumps(res, ensure_ascii=False), flush=True)
            except json.JSONDecodeError:
                print(json.dumps({"status": "error", "message": "Invalid JSON input"}), flush=True)
    except KeyboardInterrupt:
        pass
    finally:
        print("[JARVIS Python Service] Auxiliary worker stopped.", flush=True)

if __name__ == "__main__":
    main()
