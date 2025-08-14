# The Steward Session 2: Smart Learning Engine
**Claude Code Development Task**  
**Target Duration:** 45-60 minutes  
**Status:** Phase 2B - Intelligence Amplification  
**Project Root:** `/Users/chip/-WORKROOM-/- Projects/The Steward/The-Steward/`

---

## Mission: Transform Static Tool Into Learning Partner

Build the learning engine that makes The Steward progressively smarter about Chip's workflow patterns. Transform from "smart routing" to "adaptive intelligence" that improves accuracy over time.

---

## Context: What's Already Built

**✅ Foundation Complete (Session 1):**
- **Analytics Infrastructure:** 4-tab dashboard with Recharts visualization
- **Feedback System:** Thumbs up/down + detailed rating dialogs
- **Database Schema:** SQLite with performance tracking and learning tables
- **API Endpoints:** 8+ analytics routes with data processing
- **Web Interface:** Beautiful Material-UI with response copying

**📁 Key Files Ready:**
- `steward-web-app/src/components/PerformanceDashboard.js` - Analytics UI
- `steward-web-app/src/components/FeedbackInterface.js` - User feedback
- `steward-web-app/api/analytics.js` - Analytics API endpoints
- `character-sheet.yaml` - User preferences and routing rules
- `steward-web-app/database/` - SQLite schema with learning tables

---

## Core Implementation: 4 Learning Components

### 1. Preference Drift Detection Algorithm
**Goal:** Identify when actual usage diverges from character sheet defaults

**Implementation Requirements:**
- **Data Analysis:** Compare routing decisions vs character sheet preferences
- **Pattern Recognition:** Detect systematic deviations ("always picks Claude for explanations despite GPT-4 preference")
- **Confidence Scoring:** Quantify drift significance and consistency
- **API Endpoint:** `POST /api/learning/analyze-drift` returning drift patterns

**Expected Output:**
```javascript
{
  "driftPatterns": [
    {
      "taskType": "debug",
      "characterSheetPreference": "gpt-4",
      "actualUsagePattern": "claude",
      "confidence": 0.85,
      "occurrences": 12,
      "timespan": "2 weeks"
    }
  ]
}
```

### 2. Confidence Calibration System
**Goal:** Learn when high-confidence routing decisions are actually wrong

**Implementation Requirements:**
- **Feedback Correlation:** Map user feedback to routing confidence scores
- **Accuracy Tracking:** Identify systematic overconfidence patterns
- **Calibration Adjustment:** Develop confidence scaling algorithms
- **Learning Loop:** Update routing confidence based on validation feedback

**Expected Behavior:**
- Track when 95% confidence decisions get negative feedback
- Adjust confidence algorithms to improve prediction accuracy
- Provide "learning confidence" scores that improve over time

### 3. Character Sheet Evolution Engine
**Goal:** Generate smart suggestions for updating user preferences

**Implementation Requirements:**
- **Smart Suggestions API:** `GET /api/learning/character-sheet-suggestions`
- **Change Recommendation Logic:** Analyze patterns and propose specific updates
- **Impact Estimation:** Predict improvement from suggested changes
- **UI Integration:** Beautiful suggestion cards in dashboard

**Expected Suggestions Format:**
```javascript
{
  "suggestions": [
    {
      "type": "task_preference_update",
      "current": "debug: gpt-4",
      "suggested": "debug: claude",
      "reasoning": "85% of debug tasks routed to Claude with positive feedback",
      "confidence": 0.92,
      "estimatedImprovement": "15% faster routing, 23% better accuracy"
    }
  ]
}
```

### 4. Learning Progress Visualization
**Goal:** Show how The Steward is getting smarter about workflow patterns

**Implementation Requirements:**
- **Learning Metrics Dashboard:** New tab in PerformanceDashboard
- **Progress Indicators:** Visual charts showing accuracy improvement over time
- **Achievement System:** ADHD-friendly milestones and progress unlocks
- **Intelligence Growth Charts:** Routing accuracy, preference learning, confidence calibration

**Visual Components:**
- **Learning Curve Chart:** Routing accuracy improvement over time
- **Preference Alignment Score:** How well current routing matches actual usage
- **Smart Suggestions Accepted:** Track when user adopts system recommendations
- **Achievement Badges:** "Week 1 Learning Complete", "Preference Master", etc.

---

## Technical Implementation Strategy

### Database Schema Extensions
**Enhance existing SQLite schema with learning tables:**

```sql
-- Add to existing database
CREATE TABLE learning_patterns (
    id INTEGER PRIMARY KEY,
    pattern_type TEXT,
    pattern_data JSON,
    confidence REAL,
    created_at TIMESTAMP,
    validated_at TIMESTAMP
);

CREATE TABLE confidence_calibration (
    id INTEGER PRIMARY KEY,
    routing_decision_id INTEGER,
    predicted_confidence REAL,
    actual_feedback_score REAL,
    calibration_error REAL,
    created_at TIMESTAMP
);

CREATE TABLE character_sheet_suggestions (
    id INTEGER PRIMARY KEY,
    suggestion_type TEXT,
    current_value TEXT,
    suggested_value TEXT,
    reasoning TEXT,
    confidence REAL,
    status TEXT, -- pending, accepted, rejected
    created_at TIMESTAMP
);
```

### API Endpoints to Build
**Add to `steward-web-app/api/analytics.js`:**

```javascript
// Learning analysis endpoints
app.post('/api/learning/analyze-drift', analyzeDriftPatterns);
app.get('/api/learning/confidence-calibration', getConfidenceCalibration);
app.get('/api/learning/character-sheet-suggestions', getCharacterSheetSuggestions);
app.post('/api/learning/accept-suggestion', acceptSuggestion);
app.get('/api/learning/progress-metrics', getLearningProgressMetrics);
```

### Frontend Integration
**Enhance `PerformanceDashboard.js` with new Learning tab:**

```javascript
// Add 5th tab: Learning Progress
const dashboardTabs = [
  'Routing Trends',
  'Model Performance', 
  'Cognitive Patterns',
  'Learning Insights',
  'Learning Progress'  // NEW TAB
];
```

---

## Success Metrics

### Week 1 Targets:
- **Preference Drift Detection:** Functional algorithm identifying usage patterns
- **Confidence Calibration:** Basic feedback correlation working
- **Character Sheet Suggestions:** At least 3 smart recommendations generated
- **Learning Visualization:** Progress charts displaying improvement metrics

### Week 2 Validation:
- **Improved Routing Accuracy:** Measurable increase in correct model selection
- **Preference Learning:** System adapts to real usage vs. character sheet defaults
- **User Adoption:** Chip accepts suggested character sheet improvements
- **ADHD Alignment:** Reduced context switching, better hyperfocus support

---

## ADHD-Aware Development Notes

### Cognitive Load Management:
- **Progressive Disclosure:** Don't overwhelm with all learning insights at once
- **Visual Progress:** Clear charts showing improvement over time
- **Achievement Unlocks:** Gamify learning milestones for dopamine hits
- **Simple Decisions:** Make suggestion acceptance/rejection effortless

### Hyperfocus Optimization:
- **Context Preservation:** Learn when Chip is in deep work mode
- **Flow State Protection:** Avoid disruptive routing changes during focus sessions
- **Energy Level Adaptation:** Different routing for high vs. low cognitive capacity

---

## Implementation Priority

### Session Focus (45-60 minutes):
1. **Start:** Preference drift detection algorithm (20 minutes)
2. **Core:** Character sheet suggestions engine (25 minutes)  
3. **Polish:** Learning progress visualization (15 minutes)
4. **Stretch:** Confidence calibration if time permits

### Technical Approach:
- **Build incrementally:** Each component should work independently
- **Test continuously:** Verify with existing analytics data
- **UI integration:** Ensure new features fit seamlessly into dashboard
- **Database first:** Set up learning tables before building algorithms

---

## Files to Modify/Create

**Backend:**
- `steward-web-app/api/analytics.js` - Add learning endpoints
- `steward-web-app/database/learning-schema.sql` - New learning tables
- `steward-web-app/src/learning/` - New directory for learning algorithms

**Frontend:**
- `steward-web-app/src/components/PerformanceDashboard.js` - Add Learning tab
- `steward-web-app/src/components/LearningSuggestions.js` - NEW component
- `steward-web-app/src/components/LearningProgress.js` - NEW component

**Configuration:**
- `character-sheet.yaml` - Potentially auto-updated by suggestions

---

## Expected Magic ✨

After Session 2 completion:
- **The Steward suggests:** "You always pick Claude for debugging - update character sheet?"
- **Visual learning curves:** Charts showing routing accuracy improving over time
- **Smart adaptation:** System learns Chip's actual preferences vs. stated ones
- **Achievement unlocks:** "Preference Master" badge when suggestions are adopted
- **Earned autonomy foundation:** Measurable improvement creates trust for future autonomy

---

## Ready to Build Intelligence That Learns! 🧠🚀

Transform The Steward from smart tool to learning partner in one focused session. The infrastructure is ready - now let's add the algorithms that make it progressively smarter about Chip's unique workflow patterns.