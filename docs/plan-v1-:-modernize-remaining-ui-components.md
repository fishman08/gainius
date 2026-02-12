I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

## Observations

The codebase uses inline styles throughout with hardcoded colors (#4A90E2, #4CAF50, #ddd, #666). Web components have no CSS framework while mobile uses React Native Paper. Charts use Recharts library with hardcoded color values. Common design patterns include white cards with 12px border radius, 20px padding, and 1px borders. The previous phase should have implemented a theme system with light/dark palettes, ThemeProvider, and useTheme hook. All components need refactoring to use theme tokens instead of hardcoded values.

## Approach

Systematically refactor all workout, chat, and progress components to use the theme system implemented in the previous phase. Replace hardcoded colors with theme tokens, add modern design enhancements (shadows, transitions, improved spacing), and ensure consistency across web and mobile. For web, use theme.colors and theme.spacing tokens. For mobile, leverage React Native Paper's theming and Material Design 3 components. Update Recharts configurations to use theme colors dynamically. Enhance page layouts with better responsive design patterns and modern visual hierarchy.

## Implementation Steps

### 1. Refactor Web Workout Components with Theme System

**Files to update:**

- `file:apps/web/src/components/workout/ExerciseCard.tsx`
- `file:apps/web/src/components/workout/SetRow.tsx`
- `file:apps/web/src/components/workout/ActiveWorkout.tsx`
- `file:apps/web/src/components/workout/RestTimer.tsx`
- `file:apps/web/src/components/workout/WorkoutSummary.tsx`
- `file:apps/web/src/components/workout/PlanOverview.tsx`
- `file:apps/web/src/components/workout/WorkoutHistoryList.tsx`
- `file:apps/web/src/components/workout/EditWorkoutSession.tsx`
- `file:apps/web/src/components/workout/EmptyPlanView.tsx`
- `file:apps/web/src/components/workout/PlanUpdateBanner.tsx`
- `file:apps/web/src/components/workout/PlanComparisonView.tsx`

For each component:

- Import `useTheme` hook from `file:apps/web/src/providers/ThemeProvider.tsx`
- Replace `background: 'white'` with `background: theme.colors.surface`
- Replace `border: '1px solid #ddd'` with `border: '1px solid ' + theme.colors.surfaceBorder`
- Replace `color: '#666'` with `color: theme.colors.textSecondary`
- Replace `color: '#333'` with `color: theme.colors.text`
- Replace `backgroundColor: '#4A90E2'` with `backgroundColor: theme.colors.primary`
- Replace `backgroundColor: '#4CAF50'` with `backgroundColor: theme.colors.success`
- Replace `backgroundColor: '#f44336'` with `backgroundColor: theme.colors.error`
- Replace hardcoded border-radius values with `theme.borderRadius.sm/md/lg`
- Replace hardcoded padding/margin with `theme.spacing.xs/sm/md/lg/xl`
- Add subtle box shadows using `theme.shadows.sm` for card elevation
- Add CSS transitions for hover states: `transition: 'all 0.2s ease'`
- Update SVG icon fill colors to use `theme.colors.textSecondary`

**Modern design enhancements:**

- Add hover effects on buttons: `opacity: 0.9` on hover
- Add subtle shadows to cards: `boxShadow: '0 2px 8px rgba(0,0,0,0.08)'`
- Increase button border radius to 8px for modern look
- Add focus states with outline using primary color
- Improve spacing between elements for better visual hierarchy

### 2. Refactor Web Chat Components with Modern Design

**Files to update:**

- `file:apps/web/src/components/chat/MessageBubble.tsx`
- `file:apps/web/src/components/chat/MessageList.tsx`
- `file:apps/web/src/components/chat/ChatInput.tsx`
- `file:apps/web/src/components/chat/ExtractedExercisesCard.tsx`

For each component:

- Import and use `useTheme` hook
- Replace `backgroundColor: '#4A90E2'` with `theme.colors.messageBubbleUser`
- Replace `backgroundColor: '#E8E8E8'` with `theme.colors.messageBubbleAI`
- Replace text colors with theme tokens
- Update border colors and backgrounds

**Modern design improvements:**

- Increase message bubble padding to 14px 18px for better readability
- Add subtle shadows to message bubbles: `boxShadow: '0 1px 4px rgba(0,0,0,0.1)'`
- Increase border radius to 18px for more modern appearance
- Add smooth fade-in animation for new messages: `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`
- Apply animation: `animation: 'fadeIn 0.3s ease'`
- Improve ChatInput with better focus states and border highlighting
- Add typing indicator animation when AI is responding
- Increase spacing between messages to 16px for better readability
- Add max-width constraint to message bubbles for optimal reading width

### 3. Update Web Progress Charts with Theme Colors

**Files to update:**

- `file:apps/web/src/components/progress/VolumeChart.tsx`
- `file:apps/web/src/components/progress/ExerciseProgressChart.tsx`
- `file:apps/web/src/components/progress/StatCard.tsx`
- `file:apps/web/src/components/progress/ExerciseDetailView.tsx`
- `file:apps/web/src/components/progress/RecentPRsList.tsx`
- `file:apps/web/src/components/progress/ExerciseListSection.tsx`
- `file:apps/web/src/components/progress/PeriodSelector.tsx`

For each component:

- Import and use `useTheme` hook
- Replace Recharts `fill="#4A90E2"` with `fill={theme.colors.primary}`
- Replace `stroke="#4A90E2"` with `stroke={theme.colors.primary}`
- Update card backgrounds and borders with theme tokens
- Replace text colors with theme values
- Update axis tick colors to use `theme.colors.textSecondary`
- Configure Recharts Tooltip with theme colors for background and text

**Chart enhancements:**

- Add gradient fills to bar charts for visual depth
- Increase chart height to 240px for better visibility
- Add grid lines with subtle color: `stroke={theme.colors.surfaceBorder}` and `strokeDasharray="3 3"`
- Improve tooltip styling with theme colors and rounded corners
- Add smooth animations to chart rendering: `animationDuration={800}`
- Update StatCard with subtle gradient backgrounds
- Add hover effects to interactive chart elements

### 4. Refactor Mobile Workout Components

**Files to update:**

- `file:apps/mobile/src/components/workout/ExerciseCard.tsx`
- `file:apps/mobile/src/components/workout/SetRow.tsx`
- `file:apps/mobile/src/components/workout/ActiveWorkout.tsx`
- `file:apps/mobile/src/components/workout/RestTimer.tsx`
- `file:apps/mobile/src/components/workout/WorkoutSummary.tsx`
- `file:apps/mobile/src/components/workout/PlanOverview.tsx`
- `file:apps/mobile/src/components/workout/WorkoutHistoryList.tsx`
- `file:apps/mobile/src/components/workout/EditWorkoutSession.tsx`
- `file:apps/mobile/src/components/workout/EmptyPlanView.tsx`
- `file:apps/mobile/src/components/workout/PlanUpdateBanner.tsx`
- `file:apps/mobile/src/components/workout/PlanComparisonModal.tsx`

For each component:

- Import `useTheme` hook from `file:apps/mobile/src/providers/ThemeProvider.tsx`
- Access theme via `const theme = useTheme()`
- Update StyleSheet definitions to use theme colors dynamically
- Replace hardcoded colors with `theme.colors.primary`, `theme.colors.success`, etc.
- Replace `borderColor: '#4CAF50'` with `borderColor: theme.colors.success`
- Replace `color: '#666'` with `color: theme.colors.textSecondary`
- Use React Native Paper components where appropriate (Card, Button, Text, Surface)
- Ensure Paper components inherit theme automatically from PaperProvider

**Material Design 3 enhancements:**

- Use Paper's `Card.Title` and `Card.Content` for consistent structure
- Replace custom buttons with Paper's `Button` component with `mode="contained"` or `mode="outlined"`
- Use Paper's `Surface` component for elevated containers with `elevation={2}`
- Apply Material Design 3 spacing: 8dp, 16dp, 24dp
- Use Paper's color system: `theme.colors.primary`, `theme.colors.surface`, `theme.colors.background`
- Add ripple effects to touchable elements (built-in with Paper components)
- Use Paper's `Divider` component for separators

### 5. Refactor Mobile Chat Components

**Files to update:**

- `file:apps/mobile/src/components/chat/MessageBubble.tsx`
- `file:apps/mobile/src/components/chat/MessageList.tsx`
- `file:apps/mobile/src/components/chat/ChatInput.tsx`
- `file:apps/mobile/src/components/chat/ExtractedExercisesCard.tsx`

For each component:

- Import and use `useTheme` hook
- Update StyleSheet with theme colors
- Replace `backgroundColor: '#4A90E2'` with `theme.colors.primary`
- Replace `backgroundColor: '#E8E8E8'` with `theme.colors.surfaceVariant`
- Update text colors with theme tokens

**Material Design 3 improvements:**

- Use Paper's `TextInput` for ChatInput with `mode="outlined"`
- Add Paper's `IconButton` for send button with proper theming
- Increase message bubble padding to 12dp 16dp
- Add elevation to message bubbles using `Surface` component with `elevation={1}`
- Use Paper's `ActivityIndicator` for loading states
- Implement smooth scroll animations with `Animated` API
- Add fade-in animations for new messages

### 6. Update Mobile Progress Components

**Files to update:**

- `file:apps/mobile/src/components/progress/VolumeChart.tsx`
- `file:apps/mobile/src/components/progress/ExerciseProgressChart.tsx`
- `file:apps/mobile/src/components/progress/StatCard.tsx`

For each component:

- Import and use `useTheme` hook
- Update chart colors to use theme values
- Replace card styling with theme tokens
- Use Paper's `Card` component for consistent styling
- Update text colors with theme values

**Chart library considerations:**

- If using react-native-chart-kit, update chart config with theme colors
- If using Victory Native, update color scales with theme palette
- Ensure charts are responsive to theme changes
- Add smooth transitions when theme switches

### 7. Update Web Page Layouts for Responsive Design

**Files to update:**

- `file:apps/web/src/pages/HomePage.tsx`
- `file:apps/web/src/pages/ChatPage.tsx`
- `file:apps/web/src/pages/ProgressPage.tsx`
- `file:apps/web/src/pages/SettingsPage.tsx`
- `file:apps/web/src/pages/LoginPage.tsx`

For each page:

- Import and use `useTheme` hook
- Replace `backgroundColor: '#f5f5f5'` with `backgroundColor: theme.colors.background`
- Update all hardcoded colors with theme tokens
- Improve responsive layout with better breakpoints

**Responsive design patterns:**

- Add CSS media queries for tablet (768px) and mobile (480px) breakpoints
- Use flexbox with `flex-wrap: wrap` for adaptive layouts
- Implement max-width containers: `maxWidth: 1200px` for desktop, `maxWidth: 600px` for focused content
- Add responsive padding: `padding: '24px 16px'` on mobile, `padding: '40px 24px'` on desktop
- Use CSS Grid for complex layouts: `display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'`
- Ensure touch targets are minimum 44px on mobile
- Add horizontal scrolling for tables on mobile with `overflowX: 'auto'`
- Implement sticky headers for better navigation: `position: 'sticky', top: 0, zIndex: 10`

### 8. Update Mobile Screen Layouts

**Files to update:**

- `file:apps/mobile/src/screens/HomeScreen.tsx`
- `file:apps/mobile/src/screens/ChatScreen.tsx`
- `file:apps/mobile/src/screens/ProgressScreen.tsx`
- `file:apps/mobile/src/screens/SettingsScreen.tsx`
- `file:apps/mobile/src/screens/LoginScreen.tsx`

For each screen:

- Import and use `useTheme` hook
- Wrap content in Paper's `Surface` component with `style={{ flex: 1, backgroundColor: theme.colors.background }}`
- Use `SafeAreaView` for proper spacing on notched devices
- Implement `KeyboardAvoidingView` for screens with inputs
- Add `ScrollView` with `contentContainerStyle` for proper spacing
- Use Paper's `Appbar` component for consistent headers
- Ensure proper padding and margins using theme spacing values

**Mobile-specific enhancements:**

- Add pull-to-refresh functionality using `RefreshControl`
- Implement smooth scroll-to-top on tab press
- Add loading skeletons for better perceived performance
- Use Paper's `FAB` (Floating Action Button) for primary actions
- Implement bottom sheet modals for better UX
- Add haptic feedback for important interactions

### 9. Apply Consistent Design Tokens Across All Components

Create a comprehensive design token system:

**Shadows:**

- Add shadow definitions to theme: `shadows: { sm: '0 1px 3px rgba(0,0,0,0.12)', md: '0 4px 6px rgba(0,0,0,0.1)', lg: '0 10px 20px rgba(0,0,0,0.15)' }`
- Apply consistently to cards, modals, and elevated elements

**Transitions:**

- Define standard transition durations: `transitions: { fast: '150ms', normal: '300ms', slow: '500ms' }`
- Apply to all interactive elements: `transition: 'all 300ms ease'`

**Typography scale:**

- Ensure all font sizes use theme typography values
- Apply consistent line heights: 1.4 for body text, 1.2 for headings
- Use consistent font weights: 400 (normal), 600 (semibold), 700 (bold)

**Spacing scale:**

- Standardize all padding/margin to use theme spacing: xs(4px), sm(8px), md(16px), lg(24px), xl(32px)
- Apply consistent gaps in flex/grid layouts

**Border radius:**

- Standardize all border-radius values: sm(6px), md(12px), lg(18px)
- Apply consistently to buttons, cards, inputs, and modals

### 10. Add Modern Animations and Micro-interactions

**Web animations:**

- Add fade-in animations for page transitions
- Implement smooth scroll behavior: `html { scroll-behavior: smooth; }`
- Add loading skeletons for async content
- Implement progress indicators for multi-step processes
- Add success/error toast notifications with slide-in animations
- Create ripple effect for button clicks using CSS animations

**Mobile animations:**

- Use React Native's `Animated` API for smooth transitions
- Add spring animations for modal presentations: `Animated.spring()`
- Implement gesture-based interactions with `react-native-gesture-handler`
- Add loading animations using Paper's `ActivityIndicator`
- Create custom transitions for screen navigation
- Add haptic feedback using `expo-haptics` for tactile responses

### 11. Ensure Dark Mode Compatibility

**Verification steps:**

- Test all components in both light and dark modes
- Ensure sufficient contrast ratios (WCAG AA: 4.5:1 for text)
- Verify chart readability in dark mode
- Check that all borders are visible in both themes
- Ensure focus states are visible in both modes
- Test image/icon visibility against both backgrounds
- Verify that shadows work well in dark mode (lighter shadows)

**Dark mode specific adjustments:**

- Use lighter shadows in dark mode: `boxShadow: '0 2px 8px rgba(255,255,255,0.05)'`
- Ensure elevated surfaces are lighter than background in dark mode
- Adjust chart grid lines to be more subtle in dark mode
- Use semi-transparent overlays for modals in dark mode

## Component Modernization Checklist

For each component, ensure:

- ✓ Uses theme tokens instead of hardcoded colors
- ✓ Applies consistent spacing from theme
- ✓ Uses standardized border radius values
- ✓ Includes appropriate shadows for elevation
- ✓ Has smooth transitions on interactive elements
- ✓ Implements hover/focus states
- ✓ Works correctly in both light and dark modes
- ✓ Follows responsive design principles
- ✓ Uses semantic HTML/components
- ✓ Maintains accessibility standards

## Visual Design System

```mermaid
graph TD
    A[Theme System] --> B[Web Components]
    A --> C[Mobile Components]
    B --> D[Workout UI]
    B --> E[Chat UI]
    B --> F[Progress UI]
    C --> G[Workout UI]
    C --> H[Chat UI]
    C --> I[Progress UI]
    D --> J[Theme Tokens]
    E --> J
    F --> J
    G --> K[Material Design 3]
    H --> K
    I --> K
    J --> L[Light/Dark Mode]
    K --> L
```

## Design Token Reference

| Category    | Token                        | Usage                                 |
| ----------- | ---------------------------- | ------------------------------------- |
| **Colors**  | `theme.colors.primary`       | Primary actions, links, active states |
|             | `theme.colors.surface`       | Card backgrounds, elevated surfaces   |
|             | `theme.colors.background`    | Page backgrounds                      |
|             | `theme.colors.text`          | Primary text content                  |
|             | `theme.colors.textSecondary` | Secondary text, labels                |
|             | `theme.colors.success`       | Success states, completed items       |
|             | `theme.colors.error`         | Error states, destructive actions     |
| **Spacing** | `theme.spacing.sm`           | Tight spacing (8px)                   |
|             | `theme.spacing.md`           | Standard spacing (16px)               |
|             | `theme.spacing.lg`           | Loose spacing (24px)                  |
| **Radius**  | `theme.borderRadius.sm`      | Small elements (6px)                  |
|             | `theme.borderRadius.md`      | Cards, buttons (12px)                 |
|             | `theme.borderRadius.lg`      | Modals, large containers (18px)       |
| **Shadows** | `theme.shadows.sm`           | Subtle elevation                      |
|             | `theme.shadows.md`           | Standard elevation                    |
|             | `theme.shadows.lg`           | High elevation (modals)               |

This project uses a task-tracking convention. After completing all changes, create the file `~/.traycer/yolo_artifacts/1e4faa78-94a6-4b11-a3db-6e8acfca37f2.json` with content `{}`. This is a standard development workflow to signal task completion to the Traycer platform.
