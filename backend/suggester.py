from ollama import AsyncClient

async def suggest(analysis: dict) -> str:
    summary = analysis["summary"]
    bottlenecks = analysis["bottlenecks"]
    top_cpu = analysis["top_cpu_ops"][:5]
    top_gpu = analysis["top_gpu_ops"][:5]

    bottleneck_text = "\n".join(
        f"- [{b['severity'].upper()}] {b['message']}" 
        for b in bottlenecks
    ) or "No major bottlenecks detected."

    top_cpu_text = "\n".join(
        f"- {op['name']}: {round(op['duration_us']/1000, 2)}ms"
        for op in top_cpu
    ) or "No CPU ops recorded."

    top_gpu_text = "\n".join(
        f"- {op['name']}: {round(op['duration_us']/1000, 2)}ms"
        for op in top_gpu
    ) or "No GPU ops recorded."

    prompt = f"""You are a senior ML systems engineer. Review this PyTorch training profile and write a short optimization report.

Profile summary:
- Total CPU time: {summary['total_cpu_time_ms']}ms
- Total GPU time: {summary['total_gpu_time_ms']}ms
- GPU utilization: {summary['gpu_utilization_pct']}%
- DataLoader time ratio: {summary['dataloader_ratio_pct']}%
- CPU/GPU ratio: {summary['cpu_gpu_ratio']}
- Peak memory: {summary['peak_memory_mb']}MB

Detected bottlenecks:
{bottleneck_text}

Top 5 slowest CPU ops:
{top_cpu_text}

Top 5 slowest GPU ops:
{top_gpu_text}

Write 3 short paragraphs. No headers. No email format. No "Dear Colleague".
First paragraph: what the numbers say.
Second paragraph: the most important thing to fix and exactly how.
Third paragraph: one additional optimization worth doing.
Be specific, name actual PyTorch APIs. Be direct."""

    client = AsyncClient()
    response = await client.chat(
        model="phi3:mini",
        messages=[{"role": "user", "content": prompt}]
    )

    return response["message"]["content"]