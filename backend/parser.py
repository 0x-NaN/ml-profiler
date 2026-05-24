import json

def parse_trace(file_bytes: bytes) -> dict:
    data = json.loads(file_bytes)
    events = data.get("traceEvents", [])

    cpu_ops = []
    gpu_ops = []
    dataloader_events = []
    memory_events = []

    for e in events:
        if not isinstance(e, dict):
            continue

        cat = e.get("cat", "")
        name = e.get("name", "")
        dur = e.get("dur", 0)  # microseconds
        ts = e.get("ts", 0)

        if cat == "cpu_op":
            cpu_ops.append({
                "name": name,
                "duration_us": dur,
                "timestamp": ts,
            })

        elif cat in ("kernel", "gpu_memcpy", "gpu_user_annotation", "cuda_runtime", "gpu_memset"):
            gpu_ops.append({
                "name": name,
                "duration_us": dur,
                "timestamp": ts,
            })

        elif "DataLoader" in name or "data" in name.lower():
            dataloader_events.append({
                "name": name,
                "duration_us": dur,
                "timestamp": ts,
            })

        elif cat == "memory":
            memory_events.append({
                "name": name,
                "timestamp": ts,
                "bytes": e.get("args", {}).get("Bytes", 0),
            })

    return {
        "cpu_ops": cpu_ops,
        "gpu_ops": gpu_ops,
        "dataloader_events": dataloader_events,
        "memory_events": memory_events,
        "total_events": len(events),
    }