# Product Overview

ig-consulting is an Instagram Profile Optimizer — an MVP web app targeting Brazilian businesses and creators who want to improve their Instagram presence.

Core flow:

1. User authenticates and purchases credits (R$ 5.00 each via Stripe)
2. User submits their Instagram username + up to 5 competitor usernames
3. System scrapes profile data via Apify (with 24h caching)
4. A LangChain AI agent compares the user's profile against competitors
5. Agent generates a downloadable PDF optimization guide (bio, content strategy, posting consistency, etc.)
6. An LLM Judge quality-checks the guide (score 0–100, regenerates if < 60)
7. Dashboard shows credit balance, evaluation history, and past guides
