# Product: Instagram Profile Optimizer

An AI-powered SaaS tool that analyzes Instagram profiles against competitors and generates actionable optimization guides. Targeted at the Brazilian market (content generated in pt-BR).

## Core Flow

1. User signs up/logs in
2. Submits their Instagram username + up to 5 competitor usernames
3. System scrapes profiles via Apify, analyzes data with LLMs (OpenAI), and generates a structured optimization guide
4. An LLM judge scores the guide quality (0–100); if below threshold, the guide is regenerated with feedback
5. User receives a PDF guide covering: bio clarity, content strategy, posting consistency, value proposition, and highlights/links usage

## Business Model

Credit-based system with Mercado Pago Pix payments. Each evaluation consumes credits.
