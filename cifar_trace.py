"""
cifar_trace.py — trains a small CNN on CIFAR-10 for one epoch
and exports a PyTorch chrome trace for use with ml-profiler.

Usage:
    python cifar_trace.py

Output:
    cifar_trace.json — upload this to ml-profiler

Requirements:
    pip install torch torchvision
"""

import torch
import torch.nn as nn
import torch.optim as optim
import torchvision
import torchvision.transforms as transforms
from torch.profiler import profile, record_function, ProfilerActivity


# simple CNN — small enough to run on any machine
class SmallCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1), nn.ReLU(),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(),
            nn.MaxPool2d(2),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 8 * 8, 256), nn.ReLU(),
            nn.Linear(256, 10),
        )

    def forward(self, x):
        return self.classifier(self.features(x))


def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"device: {device}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")

    # dataset — downloads automatically on first run (~170MB)
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5)),
    ])

    trainset = torchvision.datasets.CIFAR10(
        root="./data", train=True, download=True, transform=transform
    )
    # small subset — enough to profile DataLoader + training ops
    subset = torch.utils.data.Subset(trainset, range(512))
    loader = torch.utils.data.DataLoader(
        subset,
        batch_size=32,
        shuffle=True,
        num_workers=2,        # increase to test DataLoader bottleneck
        pin_memory=device.type == "cuda",
    )

    model = SmallCNN().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.parameters(), lr=0.01, momentum=0.9)

    # warmup — avoid profiling cold-start overhead
    print("warming up...")
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        loss = criterion(model(images), labels)
        loss.backward()
        optimizer.step()
        break

    if device.type == "cuda":
        torch.cuda.synchronize()

    # profile one full pass over the subset
    print("profiling...")
    activities = [ProfilerActivity.CPU]
    if device.type == "cuda":
        activities.append(ProfilerActivity.CUDA)

    with profile(
        activities=activities,
        record_shapes=True,
        profile_memory=True,
    ) as prof:
        with record_function("training_epoch"):
            for images, labels in loader:
                with record_function("data_to_device"):
                    images, labels = images.to(device), labels.to(device)

                with record_function("forward"):
                    outputs = model(images)
                    loss = criterion(outputs, labels)

                with record_function("backward"):
                    optimizer.zero_grad()
                    loss.backward()
                    optimizer.step()

            if device.type == "cuda":
                torch.cuda.synchronize()

    prof.export_chrome_trace("cifar_trace.json")
    print("done — cifar_trace.json saved")
    print("\ntop ops by CPU time:")
    print(prof.key_averages().table(sort_by="cpu_time_total", row_limit=8))


if __name__ == "__main__":
    main()