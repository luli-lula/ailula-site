---
title: CELPIP12 - From Personal Pain Point to Full-Stack AI Solution
date: 2025-08-13T12:00:00.000Z
lang: en
summary: >-
  A product manager's journey from identifying personal pain points to building
  a full-stack AI-powered CELPIP writing practice platform
status: live
tags:
  - Next.js 14
  - OpenAI API
  - TypeScript
  - Clerk Auth
  - Vercel Postgres
  - Tailwind CSS
links:
  - label: Demo
    url: 'https://celpip12.vercel.app/'
  - label: GitHub
    url: 'https://github.com/luli-lula/celpip'
legacyPaths:
  - /projects/celpip12/
---
## Why - Product Thinking from Personal Pain Points

As someone preparing for CELPIP, I experienced firsthand the pain points of existing learning tools:

**Repetitive Manual Processes**: Having to copy-paste the same prompts to ChatGPT every time, then paste essays back and forth - the entire workflow was tedious and interrupted my focus.

**Lack of Specificity**: Generic AI tools couldn't provide CELPIP-specific scoring standards and feedback formats.

**Scattered Resources**: Official sample answers, practice questions, and scoring criteria were scattered across different sources without a unified practice environment.

As a former product manager at a major tech company, my first instinct wasn't to find better alternatives, but to think: could I build a product that truly solves these problems?

Once this idea emerged, I realized this was an excellent learning opportunity - to experience the complete web development process while building something I actually needed.

## What - From Requirements to Implementation

Based on my own pain points, I outlined the core requirements:

### 🎯 Core Features
- **Unified Writing Environment**: Question selection, writing, scoring, and feedback all in one page
- **Intelligent AI Scoring**: Using OpenAI API to provide 1-12 scale evaluation based on CELPIP standards
- **Real-time Writing Suggestions**: Direct highlighting in text for areas needing improvement
- **Official Sample Reference**: 90+ sample answers across different score ranges for comparison learning

### 📊 Data Management
- **Practice Records**: Save each writing session and scores for progress tracking
- **User System**: Simple authentication to manage personal learning data
- **Question Bank**: Categorization and search functionality for 46+ official questions

### 💡 Product Details
From a product manager's perspective, I particularly focused on experience details:
- Auto-save functionality to prevent content loss
- Responsive design for consistent experience across devices
- Loading states and error handling to keep users informed
- Clear information hierarchy with important details at a glance

## How - Technical Implementation & Architecture

While my primary background is product management, I took on the full-stack development role in this project, handling everything from product design to technical implementation.

### 🏗 Technical Architecture Design

#### Frontend Tech Stack
- **Next.js 14**: Chose App Router architecture for unified frontend/backend handling
- **TypeScript**: Full type safety to reduce runtime errors
- **Tailwind CSS**: Rapid responsive interface construction
- **Slate.js**: Rich text editor supporting real-time correction highlighting

#### Backend & Data
- **API Routes**: Next.js native API routing for business logic
- **Vercel Postgres**: Cloud-native database with auto-scaling
- **Clerk Authentication**: Enterprise-grade authentication solution
- **OpenAI Integration**: AI evaluation service integration

#### Database Design
```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT,
  usage_count INTEGER DEFAULT 30
);

-- Score history table
CREATE TABLE score_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  question TEXT,
  essay TEXT,
  ai_response JSONB,
  ai_corrections JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 🔧 Core Feature Implementation

#### Dual-Phase AI Assessment System
Based on product requirements, I designed a separated scoring and suggestion system:

```typescript
// Phase 1: CELPIP Standard Scoring
const scoreResponse = await openai.chat.completions.create({
  model: "o1-mini",
  messages: [{
    role: "user", 
    content: celpipTeacherPrompt + userEssay
  }]
});

// Phase 2: Detailed Correction Suggestions
const correctionResponse = await openai.chat.completions.create({
  model: "o1-mini",
  messages: [{
    role: "user",
    content: celpipCommentsPrompt + userEssay
  }]
});
```

#### Intelligent State Management
Implemented global user state management to avoid duplicate API calls:
- Context-based state management
- Intelligent caching mechanism (30-second cache window)
- Automated user initialization

#### Rich Text Editor Integration
Used Slate.js to implement complex text highlighting functionality:
- Character index-based precise positioning
- Dynamic style rendering
- Real-time feedback display

### 🎯 From Product Design to Technical Implementation

From a product manager's perspective, I paid special attention to several technical implementation details:

**User Experience Optimization**:
- Proactive user initialization to eliminate new user errors
- Auto-save mechanism to prevent content loss
- Graceful error handling and loading states
- Responsive design for consistent cross-device experience

**Performance Optimization**:
- Global state caching to reduce API call frequency
- Component-level lazy loading
- Database query optimization
- CDN static asset deployment

**System Architecture**:
```
celpip/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # Backend API routes
│   │   ├── writing/        # Writing practice page
│   │   └── history/        # History page
│   ├── components/         # React component library
│   │   ├── Essay.tsx       # Core editor component
│   │   ├── Score.tsx       # Score display component
│   │   └── SampleAnswersPanel.tsx # Sample comparison panel
│   ├── contexts/           # Global state management
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # API wrappers and utilities
│   └── data/               # Static data and configuration
├── public/                 # Static assets
└── vercel.json            # Deployment configuration
```

### 🎯 Technical Challenges & Solutions

**Challenge 1: AI Scoring Accuracy & Stability**
OpenAI API response format instability was the biggest challenge. Through careful prompt engineering and JSON schema validation, I achieved stable structured output:
- Designed detailed scoring standard prompts
- Implemented JSON parsing fallback mechanisms
- Added retry logic with exponential backoff strategy

**Challenge 2: Complex State Management**
Multi-component state synchronization required architectural-level solutions:
- Implemented Context-based global state management
- Designed single source of truth architecture to avoid state desynchronization
- Introduced intelligent caching strategy to optimize API call frequency

**Challenge 3: Rich Text Editor Complex Interactions**
Implementing real-time highlighting for writing suggestions required deep Slate.js integration:
- Character index-based precise text positioning algorithm
- Custom renderer for dynamic styling
- Optimized rendering performance for large texts

**Challenge 4: UX Technical Implementation**
Converting product design to technical implementation with attention to detail:
- Designed proactive initialization architecture to eliminate new user error prompts
- Implemented auto-save mechanism and offline state handling
- Optimized loading states and error boundary user feedback

## 🚀 Project Results

### Technical Metrics
- **Build Performance**: Homepage 6.68KB, Writing page 80.8KB
- **Response Time**: AI scoring 15-30s, Interface response <100ms
- **System Availability**: 99.9% uptime
- **Data Processing**: Real-time search support for 90+ samples, 46+ questions

### Core Feature Implementation

**Intelligent Scoring Engine**:
Based on OpenAI o1-mini model, implemented dual-phase assessment system:
1. Comprehensive Scoring: Four-dimensional assessment following CELPIP 1-12 standards
2. Detailed Corrections: Word-by-word analysis providing specific improvement suggestions

**Smart Sample Matching**:
- Automatic user question identification with relevant official sample matching
- Support for score range filtering and dynamic sorting
- Implemented efficient text retrieval algorithm

**User System**:
- Integrated Clerk enterprise authentication solution
- Designed complete user lifecycle management
- Implemented learning progress tracking and historical data analysis

### 💡 Learning Outcomes from Product Manager Perspective

**Complete Requirements-to-Implementation Loop**:
Experienced the full product development process from user pain point identification, to product requirements definition, to technical architecture design and code implementation.

**Technical Decision-Making Ability**:
Learned to balance between functional requirements, development costs, and maintenance complexity, such as choosing Clerk over building custom authentication.

**Full-Stack Development Capability**:
Mastered the complete modern web development stack, capable of independently completing all development work from database to frontend.

**Systems Thinking**:
Understanding of software system complexity, including the importance of non-functional requirements like state management, error handling, and performance optimization.

## 💼 Technical Value & Skills Demonstration

This project fully demonstrates my comprehensive capabilities in the following technical areas:

### Full-Stack Development Capability
- **Frontend Architecture**: Deep application of React ecosystem, including state management, component design, performance optimization
- **Backend Development**: API design, database operations, third-party service integration
- **System Design**: Complete capability from requirements analysis to architectural design
- **DevOps Practices**: Modern deployment processes and production environment management

### AI/ML Integration Capability
- **Prompt Engineering**: Deep understanding of large language model usage methods and limitations
- **API Integration**: Complex third-party AI service integration and error handling
- **Data Processing**: Robust implementation of JSON parsing, formatting, and validation

### Product-Technology Integration
- **User Experience Design**: Translating product thinking into technical implementation details
- **Performance Optimization**: Technology optimization decisions based on user experience
- **Error Handling**: Product-level exception handling and user feedback

### Learning & Adaptation Capability
- **Quick Mastery**: Ability to rapidly master new technology stacks and apply them to real projects
- **Problem Solving**: Systematic debugging capabilities and systematic approach to complex technical problems
- **Technical Selection**: Making reasonable technical architecture decisions based on project requirements

## 🔍 Product Manager's Technical Decision Making

From a product manager's perspective, I paid special attention to:

**Development Efficiency vs Learning Cost**:
- Next.js provides full-stack solution, reducing technology stack complexity
- TypeScript provides type safety, reducing runtime errors

**User Experience vs Implementation Complexity**:
- Slate.js is complex but enables precise text highlighting effects
- Clerk authentication service ensures security and user experience

**Maintainability vs Feature Completeness**:
- Modular component design for future feature expansion
- Unified state management to reduce system complexity

## 🎯 Future Plans

This project gave me a taste of the joy of implementing ideas hands-on. Next, I plan to:

**Short-term Optimization**:
- Add support for more question types
- Optimize AI scoring accuracy
- Add learning progress analysis features

**Skill Enhancement**:
- Learn more frontend frameworks (Vue, Svelte, etc.)
- Understand backend development best practices
- Master data analysis and visualization skills

**Product Reflection**:
This project also made me reflect on the value of product managers. In the AI era, the ability to quickly transform ideas into prototypes becomes increasingly important. Product managers don't necessarily need to become technical experts, but understanding the basic principles of technical implementation enables better product decisions.

## 🤝 Final Thoughts

This project started from personal pain points, learned technical knowledge, and ultimately implemented a complete product. While the code might not be elegant enough and the architecture not perfect, it solved my actual problem and became a valuable experience in learning new skills.

For other product managers wanting to learn technology, my advice is: don't be intimidated by technical complexity, start by solving your own small problems, stay curious, and dare to try. Development tools and learning resources today are more friendly than ever - with ideas, you can make them reality.

**Impact & Results**:
- **Problem Solving**: Addressed a real market gap in CELPIP preparation tools
- **Technical Innovation**: Novel application of AI in language learning assessment
- **User Value**: Provided accessible, high-quality language learning assistance
- **Code Quality**: Production-ready codebase demonstrating professional development standards

This project represents a comprehensive demonstration of modern full-stack development capabilities, AI integration expertise, and user-centered design principles—essential skills for senior positions in today's technology landscape.

**Project Links**: [GitHub](https://github.com/luli-lula/celpip) | [Live Demo](https://celpip12.vercel.app/)

Welcome to try it out and provide feedback!
