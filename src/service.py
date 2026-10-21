# =========================================================
# J.A.R.V.I.S. Python Auxiliary Background Service
# Standard Python worker process communicating with Electron
# =========================================================

import sys
import json
import time
import base64
import io
import contextlib
import traceback

def handle_message(payload):
    """
    Handle incoming JSON messages from Electron main process
    """
    action = payload.get("action", "")

    if action == "ping":
        return {"status": "ok", "response": "pong", "timestamp": time.time()}
    elif action == "echo":
        return {"status": "ok", "echo": payload.get("data")}
    elif action == "run_code":
        return run_encoded_code(payload)
    else:
        return {"status": "unknown_action", "action": action}


def run_encoded_code(payload):
    """
    base64로 인코딩된 코드를 디코딩하여 실행하고 결과를 반환
    - payload: {"action": "run_code", "code": "<base64 문자열>"}
    """
    encoded = payload.get("code", "")
    if not encoded:
        return {"status": "error", "message": "No code provided"}

    try:
        code = base64.b64decode(encoded).decode('utf-8')
    except Exception as e:
        return {"status": "error", "message": f"Base64 decode failed: {e}"}

    stdout_buffer = io.StringIO()
    stderr_buffer = io.StringIO()
    result_value = None

    try:
        with contextlib.redirect_stdout(stdout_buffer), \
             contextlib.redirect_stderr(stderr_buffer):
            # exec의 반환값을 얻기 위해 마지막 표현식은 eval로 처리
            try:
                compiled = compile(code, "<jarvis_code>", "eval")
                result_value = eval(compiled)
            except SyntaxError:
                exec(compiled := compile(code, "<jarvis_code>", "exec"), {})
    except Exception:
        return {
            "status": "error",
            "stdout": stdout_buffer.getvalue(),
            "stderr": stderr_buffer.getvalue(),
            "traceback": traceback.format_exc(),
            "timestamp": time.time(),
        }

    return {
        "status": "ok",
        "stdout": stdout_buffer.getvalue(),
        "stderr": stderr_buffer.getvalue(),
        "result": repr(result_value) if result_value is not None else None,
        "timestamp": time.time(),
    }


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
