import ijson
import io

def parse_trace(file_bytes: bytes) -> dict:
    f = io.BytesIO(file_bytes)
    
    cpu_ops = []
    gpu_ops = []
    dataloader_events = []
    memory_events = []
    total_events = 0

    # Using ijson.items to stream through the traceEvents list
    events = ijson.items(f, 'traceEvents.item')
    
    found_events = False
    try:
        for e in events:
            found_events = True
            total_events += 1
            
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
    except ijson.common.IncompleteJSONError:
        raise ValueError("Invalid JSON format")

    if not found_events:
        # Check if traceEvents key exists but is empty or missing
        # ijson.items will just finish if the key is missing or not a list
        f.seek(0)
        parser = ijson.parse(f)
        has_trace_events = False
        for prefix, event, value in parser:
            if prefix == 'traceEvents' and event == 'start_array':
                has_trace_events = True
                break
        if not has_trace_events:
            raise ValueError("Missing or invalid 'traceEvents' in trace file")

    return {
        "cpu_ops": cpu_ops,
        "gpu_ops": gpu_ops,
        "dataloader_events": dataloader_events,
        "memory_events": memory_events,
        "total_events": total_events,
    }