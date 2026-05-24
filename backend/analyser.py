def analyse(parsed: dict) -> dict:
    cpu_ops = parsed["cpu_ops"]
    gpu_ops = parsed["gpu_ops"]
    dataloader_events = parsed["dataloader_events"]
    memory_events = parsed["memory_events"]

    # total times
    total_cpu_time = sum(op["duration_us"] for op in cpu_ops)
    total_gpu_time = sum(op["duration_us"] for op in gpu_ops)
    total_dataloader_time = sum(op["duration_us"] for op in dataloader_events)

    # top 10 slowest cpu ops
    top_cpu_ops = sorted(cpu_ops, key=lambda x: x["duration_us"], reverse=True)[:10]

    # top 10 slowest gpu ops
    top_gpu_ops = sorted(gpu_ops, key=lambda x: x["duration_us"], reverse=True)[:10]

    # dataloader bottleneck — if dataloader time is >20% of total cpu time it's a problem
    total_time = total_cpu_time + total_gpu_time
    dataloader_ratio = (total_dataloader_time / total_time * 100) if total_time > 0 else 0

    # gpu utilization — ratio of gpu time to total time
    gpu_utilization = (total_gpu_time / total_time * 100) if total_time > 0 else 0

    # cpu vs gpu balance
    cpu_gpu_ratio = (total_cpu_time / total_gpu_time) if total_gpu_time > 0 else 0

    # memory peak
    peak_memory = max((e["bytes"] for e in memory_events), default=0)
    peak_memory_mb = peak_memory / (1024 * 1024)

    # flag bottlenecks
    bottlenecks = []

    if dataloader_ratio > 20:
        bottlenecks.append({
            "type": "dataloader",
            "severity": "high",
            "message": f"DataLoader is consuming {dataloader_ratio:.1f}% of total time. Consider increasing num_workers or using prefetch_factor.",
        })

    if gpu_utilization < 50:
        bottlenecks.append({
            "type": "low_gpu_utilization",
            "severity": "high",
            "message": f"GPU utilization is only {gpu_utilization:.1f}%. Your training is likely CPU bottlenecked.",
        })

    if cpu_gpu_ratio > 3:
        bottlenecks.append({
            "type": "cpu_gpu_imbalance",
            "severity": "medium",
            "message": f"CPU time is {cpu_gpu_ratio:.1f}x greater than GPU time. Consider moving more operations to GPU.",
        })

    if peak_memory_mb > 0:
        bottlenecks.append({
            "type": "memory",
            "severity": "info",
            "message": f"Peak memory usage: {peak_memory_mb:.1f} MB.",
        })

    return {
        "summary": {
            "total_cpu_time_ms": round(total_cpu_time / 1000, 2),
            "total_gpu_time_ms": round(total_gpu_time / 1000, 2),
            "total_dataloader_time_ms": round(total_dataloader_time / 1000, 2),
            "gpu_utilization_pct": round(gpu_utilization, 2),
            "dataloader_ratio_pct": round(dataloader_ratio, 2),
            "cpu_gpu_ratio": round(cpu_gpu_ratio, 2),
            "peak_memory_mb": round(peak_memory_mb, 2),
        },
        "bottlenecks": bottlenecks,
        "top_cpu_ops": top_cpu_ops,
        "top_gpu_ops": top_gpu_ops,
    }