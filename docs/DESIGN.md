# DESIGN.md - ml-profiler

## Visual Vibe
**"Gen Z Tech / Warm & Clean"**
The interface should feel inviting, modern, and human. It avoids "AI slop" (over-saturated gradients, generic robot icons) in favor of intentional whitespace, soft shadows, and a sophisticated color palette.

## Typography
- **Headings:** Inter or Lexend (Clean, modern, legible).
- **Body:** Inter (Standard, high readability).
- **Code:** JetBrains Mono or Fira Code (Technical, pro).

## Color Palette
- **Primary (Warm/Accents):** Amber/Orange (`#F59E0B`) for highlights, suggesting performance and energy without being aggressive.
- **Backgrounds:** Off-white (`#F9FAFB`) and soft grays (`#F3F4F6`).
- **Text:** Deep Slate (`#1E293B`) for high contrast and readability.
- **Success:** Emerald (`#10B981`).
- **Warning:** Amber (`#F59E0B`).
- **Critical:** Rose (`#F43F5E`).

## Key UI Components
- **The "Pulse" Header:** A thin, animated line or indicator showing the profiler is active/ready.
- **Metric Cards:** Large, readable numbers with soft rounded corners (24px+ radius) and subtle borders.
- **The Report Card:** A long-form text area for the LLM output, styled like a markdown document but with "warm" padding and font sizes.
- **Bottleneck Badges:** Pill-shaped badges with soft background colors (e.g., light rose background with deep rose text).

## Layout
- **Minimalist Upload:** A prominent, friendly "Drop Trace Here" area.
- **Dashboard Layout:** Summary stats at the top, followed by the LLM optimization report, and detailed tables at the bottom.
