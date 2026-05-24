import torch
import torchvision.models as models
from torch.profiler import profile, record_function, ProfilerActivity, tensorboard_trace_handler
import torch._C._profiler
import os

device = torch.device("cuda")
model = models.resnet18().to(device)
inputs = torch.randn(8, 3, 224, 224).to(device)

for _ in range(3):
    model(inputs)
torch.cuda.synchronize()

os.makedirs("tb_trace", exist_ok=True)

with profile(
    activities=[ProfilerActivity.CPU, ProfilerActivity.CUDA],
    record_shapes=True,
    profile_memory=True,
    on_trace_ready=tensorboard_trace_handler("./tb_trace"),
    experimental_config=torch._C._profiler._ExperimentalConfig(verbose=True)
) as prof:
    with record_function("model_inference"):
        model(inputs)
        torch.cuda.synchronize()

# also export chrome trace for comparison
prof.export_chrome_trace("trace_cuda.json")
print("done")