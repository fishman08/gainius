import type {
  ActivityLevel,
  Equipment,
  ExperienceLevel,
  Injury,
  PreferredStyle,
  PrimaryGoal,
  SessionMinutes,
  SexAtBirth,
  TrainingLocation,
} from './schema';

export const primaryGoalLabels: Record<PrimaryGoal, string> = {
  lose_fat: 'Lose fat',
  build_muscle: 'Build muscle',
  get_stronger: 'Get stronger',
  improve_endurance: 'Improve endurance',
  general_fitness: 'General fitness',
  mobility: 'Mobility & flexibility',
};

export const experienceLabels: Record<ExperienceLevel, string> = {
  beginner: 'Beginner — new to training, or returning after a long break',
  intermediate: 'Intermediate — consistent for 6+ months',
  advanced: 'Advanced — years of structured training',
};

export const preferredStyleLabels: Record<PreferredStyle, string> = {
  strength: 'Strength training',
  hypertrophy: 'Hypertrophy / bodybuilding',
  hiit: 'HIIT / metabolic conditioning',
  calisthenics: 'Calisthenics / bodyweight',
  yoga_mobility: 'Yoga / mobility',
  mix: 'Mix of styles',
};

export const sessionMinutesLabels: Record<SessionMinutes, string> = {
  '20-30': '20–30 minutes',
  '30-45': '30–45 minutes',
  '45-60': '45–60 minutes',
  '60+': '60+ minutes',
};

export const trainingLocationLabels: Record<TrainingLocation, string> = {
  home_no_equipment: 'Home — no equipment',
  home_with_equipment: 'Home — with equipment',
  gym: 'Gym',
  mix: 'A mix',
};

export const equipmentLabels: Record<Equipment, string> = {
  dumbbells: 'Dumbbells',
  barbell: 'Barbell',
  kettlebell: 'Kettlebell',
  bands: 'Resistance bands',
  pullup_bar: 'Pull-up bar',
  bench: 'Bench',
  cable_machines: 'Cable / weight machines',
  cardio_machines: 'Cardio machines',
};

export const injuryLabels: Record<Injury, string> = {
  none: 'None',
  lower_back: 'Lower back',
  knee: 'Knee',
  shoulder: 'Shoulder',
  wrist: 'Wrist',
  neck: 'Neck',
  hip: 'Hip',
  ankle: 'Ankle',
  other: 'Other',
};

export const sexAtBirthLabels: Record<SexAtBirth, string> = {
  male: 'Male',
  female: 'Female',
};

export const activityLevelLabels: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary — desk job, little exercise',
  light: 'Lightly active — light walking or activity most days',
  moderate: 'Moderately active — on your feet or active most days',
  very_active: 'Very active — physical job or hard daily exercise',
};
