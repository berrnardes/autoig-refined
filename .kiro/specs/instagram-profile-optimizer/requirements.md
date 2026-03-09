# Requirements Document

## Introduction

The Instagram Profile Optimizer is an MVP web application targeted at Brazilian businesses and creators who want to improve their Instagram presence. The system scrapes Instagram profile data (bio, posts, engagement metrics), allows comparison against competitor profiles, and uses an AI agent to generate a comprehensive optimization guide. The guide includes actionable tasks, key weaknesses, and improvement strategies. The application uses a credit-based payment model via Stripe, where each profile evaluation costs 1 credit (R$ 5.00). Built with Next.js, better-auth, Drizzle/Postgres, Apify, Stripe, LangChain, TanStack React Query, and Axios.

## Glossary

- **System**: The Instagram Profile Optimizer web application
- **User**: An authenticated person using the application
- **Profile_Scraper**: The component responsible for fetching Instagram profile data via Apify's `apify/instagram-profile-scraper`
- **Scrape_Cache**: The database layer that stores previously scraped profile data for reuse and performance
- **Competitor_Analyzer**: The component that scrapes and aggregates data from user-provided competitor profiles
- **AI_Agent**: The LangChain-based agent that evaluates a user's profile against high-performing profiles and generates the optimization guide
- **Guide**: The comprehensive PDF-downloadable report containing profile analysis, weaknesses, and improvement tasks
- **LLM_Judge**: The LLM-based evaluator that scores the quality of a generated Guide
- **Credit_System**: The component managing user credits for profile evaluations
- **Credit**: A unit of payment; 1 credit = R$ 5.00 (BRL), consumed per profile evaluation
- **Profile_Data**: The standardized data object containing bio, username, posts, captions, hashtags, engagement metrics, followers/following count, and posting frequency
- **Competitor_Data**: The aggregated data object containing bio patterns, posting frequency, content types, hashtags, and engagement metrics from competitor profiles

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to sign up and log in to the application, so that I can access profile optimization features securely.

#### Acceptance Criteria

1. THE System SHALL provide sign-up and login functionality using better-auth
2. WHEN a User successfully authenticates, THE System SHALL create a session and redirect the User to the dashboard
3. WHEN a User provides invalid credentials, THE System SHALL display a descriptive error message without revealing whether the email or password was incorrect
4. IF an unauthenticated User attempts to access a protected route, THEN THE System SHALL redirect the User to the login page

### Requirement 2: Instagram Profile Scraping

**User Story:** As a user, I want to scrape an Instagram profile by providing a username, so that I can collect data for analysis.

#### Acceptance Criteria

1. WHEN a User submits an Instagram username for scraping, THE Profile_Scraper SHALL fetch Profile_Data using the `apify/instagram-profile-scraper` actor
2. WHEN the Profile_Scraper successfully fetches data, THE System SHALL store the Profile_Data in the Scrape_Cache in a standardized format
3. WHEN a User requests a scrape for a username, THE System SHALL first check the Scrape_Cache for existing data for that username
4. WHILE a cached Profile_Data entry exists for the requested username, THE System SHALL return the cached data instead of performing a new scrape
5. WHEN the Profile_Scraper receives an invalid or non-existent username, THE Profile_Scraper SHALL return a descriptive error message to the User
6. THE Profile_Data SHALL contain: bio, username, posts (with captions), hashtags, engagement metrics (likes, comments), follower count, following count, and posting frequency

### Requirement 3: Competitor Profile Scraping

**User Story:** As a user, I want to input competitor Instagram profiles in my niche, so that I can compare my profile against high-performing accounts.

#### Acceptance Criteria

1. WHEN a User submits a list of competitor usernames, THE Competitor_Analyzer SHALL scrape Profile_Data for each competitor using the Profile_Scraper
2. WHEN all competitor profiles are scraped, THE Competitor_Analyzer SHALL aggregate the data into a Competitor_Data object containing bio patterns, posting frequency, content types, hashtags, and engagement metrics
3. THE System SHALL allow a User to input between 1 and 5 competitor usernames per evaluation
4. WHEN a competitor username is invalid or non-existent, THE Competitor_Analyzer SHALL skip that profile and notify the User which profiles could not be scraped
5. WHEN competitor profiles are scraped, THE System SHALL store each competitor's Profile_Data in the Scrape_Cache following the same caching rules as Requirement 2

### Requirement 4: AI Agent Profile Analysis

**User Story:** As a user, I want an AI agent to evaluate my Instagram profile against competitors, so that I receive a comprehensive guide on how to improve.

#### Acceptance Criteria

1. WHEN a User requests a profile evaluation, THE AI_Agent SHALL compare the User's Profile_Data against the Competitor_Data using LangChain
2. THE AI_Agent SHALL evaluate the following criteria: bio clarity and positioning, content strategy, posting consistency, value proposition, and use of highlights/links
3. WHEN the analysis is complete, THE AI_Agent SHALL generate a Guide containing: a summary of key weaknesses, specific improvement recommendations for each evaluation criterion, and a prioritized task list
4. THE Guide SHALL be available for download as a PDF document
5. WHEN the AI_Agent fails to generate a Guide, THE System SHALL notify the User with a descriptive error message and refund the consumed credit

### Requirement 5: Guide Quality Evaluation (LLM as Judge)

**User Story:** As a user, I want the generated guide to be quality-checked, so that I receive reliable and actionable recommendations.

#### Acceptance Criteria

1. WHEN the AI_Agent generates a Guide, THE LLM_Judge SHALL evaluate the Guide for completeness, actionability, and relevance
2. THE LLM_Judge SHALL produce a quality score between 0 and 100 for the generated Guide
3. IF the LLM_Judge assigns a quality score below 60, THEN THE AI_Agent SHALL regenerate the Guide with adjusted parameters
4. THE LLM_Judge SHALL use a separate LLM call from the AI_Agent to ensure independent evaluation
5. WHEN the LLM_Judge completes evaluation, THE System SHALL store the quality score alongside the Guide

### Requirement 6: Credit-Based Payment System

**User Story:** As a user, I want to purchase credits to pay for profile evaluations, so that I can use the optimization service.

#### Acceptance Criteria

1. THE Credit_System SHALL charge 1 credit per profile evaluation
2. THE Credit_System SHALL price each credit at R$ 5.00 (BRL)
3. WHEN a User initiates a credit purchase, THE Credit_System SHALL process the payment through Stripe
4. WHEN Stripe confirms a successful payment, THE Credit_System SHALL add the purchased credits to the User's account balance
5. IF a Stripe payment fails, THEN THE Credit_System SHALL display a descriptive error message to the User and add zero credits
6. WHEN a User requests a profile evaluation, THE Credit_System SHALL verify the User has at least 1 credit before proceeding
7. IF a User has zero credits and requests an evaluation, THEN THE System SHALL prompt the User to purchase credits
8. WHEN an evaluation begins, THE Credit_System SHALL deduct 1 credit from the User's balance

### Requirement 7: Scrape Cache Freshness

**User Story:** As a user, I want scraped data to be reasonably fresh, so that my analysis is based on current profile information.

#### Acceptance Criteria

1. THE Scrape_Cache SHALL store a timestamp with each cached Profile_Data entry
2. WHEN a User requests a scrape and the cached data is older than 24 hours, THE System SHALL perform a new scrape and update the Scrape_Cache
3. THE System SHALL allow a User to force a fresh scrape regardless of cache age
4. WHEN a fresh scrape is performed, THE System SHALL replace the existing cached entry with the new Profile_Data

### Requirement 8: Dashboard and Evaluation History

**User Story:** As a user, I want to see my past evaluations and credit balance, so that I can track my optimization progress.

#### Acceptance Criteria

1. WHEN a User navigates to the dashboard, THE System SHALL display the User's current credit balance
2. WHEN a User navigates to the dashboard, THE System SHALL display a list of past evaluations with dates and quality scores
3. WHEN a User selects a past evaluation, THE System SHALL allow the User to view and download the associated Guide as a PDF
4. THE System SHALL display evaluation history in reverse chronological order
