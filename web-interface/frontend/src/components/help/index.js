// #region start: Help Components Index
// Centralized export for all self-documentation help components
// Provides easy imports for the help system components

export { default as HelpCenter } from './HelpCenter';
export { default as InteractiveQueryInterface } from './InteractiveQueryInterface';
export { default as FeatureDiscoveryPanel } from './FeatureDiscoveryPanel';
export { default as SystemStatusOverview } from './SystemStatusOverview';
export { default as CapabilityExplorer } from './CapabilityExplorer';

// Re-export for convenience
export default {
  HelpCenter: require('./HelpCenter').default,
  InteractiveQueryInterface: require('./InteractiveQueryInterface').default,
  FeatureDiscoveryPanel: require('./FeatureDiscoveryPanel').default,
  SystemStatusOverview: require('./SystemStatusOverview').default,
  CapabilityExplorer: require('./CapabilityExplorer').default
};

// #endregion end: Help Components Index