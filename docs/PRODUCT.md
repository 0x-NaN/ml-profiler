# PRODUCT.md - ml-profiler

## Vision
`ml-profiler` is a lightweight, high-performance tool for analyzing PyTorch training traces. It bridges the gap between raw chrome-trace data and actionable engineering insights, helping developers identify bottlenecks like data loading stalls and GPU under-utilization without getting lost in the weeds.

## Users
- **Researchers & Data Scientists:** Local profiling of training runs to ensure efficient hardware usage.
- **MLOps & Platform Engineers:** Identifying systemic inefficiencies across distributed training clusters.
- **Framework & Library Authors:** Low-level kernel performance optimization and PyTorch op analysis.

## Core Principles
- **Clarity over Complexity:** Distill thousands of trace events into a handful of critical bottlenecks.
- **Actionable Insights:** Don't just show the problem; use LLM-driven analysis to suggest specific PyTorch API changes.
- **Speed:** Minimal overhead from trace upload to report generation.
- **Warmth:** A technical tool that feels approachable and "human," avoiding the cold, sterile aesthetic of traditional profilers.

## Features (v0.1)
- **Trace Parsing:** Support for PyTorch chrome-trace JSON format.
- **Automated Analysis:** Detection of dataloader bottlenecks, GPU utilization issues, and memory peaks.
- **LLM Suggester:** Integration with `ollama` (phi3:mini) for senior-engineer-level optimization reports.
- **Web UI:** Fast, responsive interface for uploading and viewing results.
