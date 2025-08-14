// Learning Progress Visualization Component
// Shows how The Steward is getting smarter about workflow patterns

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Badge,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Psychology as BrainIcon,
  EmojiEvents as AchievementIcon,
  Lightbulb as InsightIcon,
  AutoAwesome as MagicIcon,
  Speed as PerformanceIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { ApiService } from '../services/api';

const LearningProgress = () => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    fetchLearningProgress();
  }, [timeframe]);

  const fetchLearningProgress = async () => {
    try {
      setLoading(true);
      const data = await ApiService.request('GET', `/api/analytics/learning/progress-metrics?timeframe=${timeframe}`);
      setProgressData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching learning progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIntelligenceLevel = (score) => {
    if (score >= 90) return { level: 'Genius', color: '#9c27b0' };
    if (score >= 80) return { level: 'Expert', color: '#3f51b5' };
    if (score >= 70) return { level: 'Advanced', color: '#2196f3' };
    if (score >= 60) return { level: 'Proficient', color: '#009688' };
    if (score >= 50) return { level: 'Learning', color: '#4caf50' };
    return { level: 'Novice', color: '#ff9800' };
  };

  const formatPercentage = (value) => `${Math.round(value * 100)}%`;

  const formatLearningCurveData = (progress) => {
    return progress.map(p => ({
      date: new Date(p.date).toLocaleDateString(),
      intelligence: p.intelligence_score || 50,
      accuracy: (p.routing_accuracy || 0) * 100,
      alignment: (p.preference_alignment_score || 0) * 100
    }));
  };

  const getAchievementIcon = (achievementType) => {
    const iconMap = {
      'first_pattern': '🔍',
      'preference_master': '👑',
      'week_streak': '🔥',
      'accuracy_boost': '🎯'
    };
    return iconMap[achievementType] || '🏆';
  };

  const getAchievementColor = (rarity) => {
    const colorMap = {
      'common': '#4caf50',
      'rare': '#2196f3',
      'epic': '#9c27b0',
      'legendary': '#ff9800'
    };
    return colorMap[rarity] || '#757575';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Analyzing learning progress...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={fetchLearningProgress}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  const { progress, achievements, summary } = progressData.data;
  const intelligenceInfo = getIntelligenceLevel(summary.currentIntelligenceScore);
  const learningCurveData = formatLearningCurveData(progress);

  return (
    <Box>
      {/* Header with Refresh */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            🧠 Learning Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Watch The Steward get smarter about your workflow patterns
          </Typography>
        </Box>
        <IconButton onClick={fetchLearningProgress} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Intelligence Score Card */}
      <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${intelligenceInfo.color}20 0%, ${intelligenceInfo.color}10 100%)` }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box display="flex" alignItems="center" mb={2}>
                <BrainIcon sx={{ fontSize: 40, color: intelligenceInfo.color, mr: 2 }} />
                <Box>
                  <Typography variant="h3" sx={{ color: intelligenceInfo.color, fontWeight: 'bold' }}>
                    {Math.round(summary.currentIntelligenceScore)}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Intelligence Score
                  </Typography>
                </Box>
                <Chip 
                  label={intelligenceInfo.level}
                  sx={{ 
                    ml: 2, 
                    backgroundColor: intelligenceInfo.color,
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
              <Typography variant="body1" color="text.secondary">
                The Steward learns from every interaction, getting better at choosing the right models 
                and adapting to your preferences over time.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <ResponsiveContainer width="100%" height={120}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[
                    { value: summary.currentIntelligenceScore, fill: intelligenceInfo.color }
                  ]}>
                    <RadialBar dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <PerformanceIcon sx={{ color: '#4caf50', mr: 1 }} />
                <Typography variant="h6">Routing Accuracy</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#4caf50', mb: 1 }}>
                {formatPercentage(summary.routingAccuracy)}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={summary.routingAccuracy * 100}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                How often routing decisions match your preferences
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <MagicIcon sx={{ color: '#2196f3', mr: 1 }} />
                <Typography variant="h6">Preference Alignment</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#2196f3', mb: 1 }}>
                {formatPercentage(summary.preferenceAlignment)}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={summary.preferenceAlignment * 100}
                sx={{ mb: 1 }}
                color="info"
              />
              <Typography variant="body2" color="text.secondary">
                How well routing matches your actual usage patterns
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <InsightIcon sx={{ color: '#ff9800', mr: 1 }} />
                <Typography variant="h6">Learning Insights</Typography>
              </Box>
              <Typography variant="h4" sx={{ color: '#ff9800', mb: 1 }}>
                {summary.totalPatternsDetected}
              </Typography>
              <Box display="flex" alignItems="center">
                <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                  Patterns discovered in your workflow
                </Typography>
                <Chip size="small" label={`${summary.acceptedSuggestions} applied`} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Learning Curve Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📈 Learning Curve Over Time
          </Typography>
          {learningCurveData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={learningCurveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Line 
                  type="monotone" 
                  dataKey="intelligence" 
                  stroke="#9c27b0" 
                  strokeWidth={3}
                  name="Intelligence Score"
                />
                <Line 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#4caf50" 
                  strokeWidth={2}
                  name="Routing Accuracy %"
                />
                <Line 
                  type="monotone" 
                  dataKey="alignment" 
                  stroke="#2196f3" 
                  strokeWidth={2}
                  name="Preference Alignment %"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                Keep using The Steward to see your learning curve develop!
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <AchievementIcon sx={{ color: '#ff9800', mr: 1 }} />
            <Typography variant="h6">
              Achievement Progress
            </Typography>
            <Chip 
              size="small" 
              label={`${achievements.filter(a => a.unlocked).length}/${achievements.length}`}
              sx={{ ml: 2 }}
            />
          </Box>
          
          <Grid container spacing={2}>
            {achievements.map((achievement) => (
              <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    opacity: achievement.unlocked ? 1 : 0.6,
                    borderColor: achievement.unlocked ? getAchievementColor(achievement.rarity) : 'grey.300',
                    borderWidth: achievement.unlocked ? 2 : 1
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Typography variant="h4" sx={{ mr: 1 }}>
                        {getAchievementIcon(achievement.achievement_type)}
                      </Typography>
                      <Box flexGrow={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {achievement.achievement_name}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={achievement.rarity}
                          sx={{ 
                            backgroundColor: getAchievementColor(achievement.rarity),
                            color: 'white',
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {achievement.achievement_description}
                    </Typography>
                    
                    {achievement.unlocked ? (
                      <Box display="flex" alignItems="center">
                        <Typography variant="caption" sx={{ color: getAchievementColor(achievement.rarity) }}>
                          ✓ Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(achievement.progress_current / achievement.progress_target) * 100}
                          sx={{ mb: 0.5 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {achievement.progress_current} / {achievement.progress_target}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {achievements.length === 0 && (
            <Box textAlign="center" py={3}>
              <Typography variant="body1" color="text.secondary">
                🎯 Start using The Steward to unlock achievements!
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default LearningProgress;