import type { Profile } from "./schema";
import {
  activityLevelLabels,
  equipmentLabels,
  experienceLabels,
  injuryLabels,
  preferredStyleLabels,
  primaryGoalLabels,
  sessionMinutesLabels,
  sexAtBirthLabels,
  trainingLocationLabels,
} from "./copy";

type Option<V extends string> = { value: V; label: string };

function asOptions<T extends Record<string, string>>(
  labels: T,
): Option<Extract<keyof T, string>>[] {
  return (Object.keys(labels) as Extract<keyof T, string>[]).map((value) => ({
    value,
    label: labels[value] as string,
  }));
}

export type QuestionId = keyof Pick<
  Profile,
  | "primary_goal"
  | "experience_level"
  | "preferred_style"
  | "days_per_week"
  | "session_minutes"
  | "training_location"
  | "available_equipment"
  | "injuries"
  | "date_of_birth"
  | "sex_at_birth"
  | "height_cm"
  | "weight_kg"
  | "activity_level"
>;

export type SingleChoiceQuestion = {
  kind: "single";
  id: QuestionId;
  title: string;
  help?: string;
  options: Option<string>[];
  required: true;
};

export type NumberChoiceQuestion = {
  kind: "number_choice";
  id: QuestionId;
  title: string;
  help?: string;
  options: { value: number; label: string }[];
  required: true;
};

export type MultiChoiceQuestion = {
  kind: "multi";
  id: QuestionId;
  title: string;
  help?: string;
  options: Option<string>[];
  freeTextField?: keyof Profile;
  freeTextLabel?: string;
  required: true;
};

export type DateQuestion = {
  kind: "date";
  id: QuestionId;
  title: string;
  help?: string;
  required: true;
};

export type MeasurementQuestion = {
  kind: "measurement";
  id: QuestionId;
  title: string;
  help?: string;
  metric: "height" | "weight";
  required: true;
};

export type Question =
  | SingleChoiceQuestion
  | NumberChoiceQuestion
  | MultiChoiceQuestion
  | DateQuestion
  | MeasurementQuestion;

export const onboardingQuestions: Question[] = [
  {
    kind: "single",
    id: "primary_goal",
    title: "What's your primary goal?",
    help: "We'll bias the plan toward this. You can change it later.",
    options: asOptions(primaryGoalLabels),
    required: true,
  },
  {
    kind: "single",
    id: "experience_level",
    title: "What's your training experience?",
    options: asOptions(experienceLabels),
    required: true,
  },
  {
    kind: "single",
    id: "preferred_style",
    title: "Preferred training style?",
    help: "Pick what you'd most enjoy spending time on.",
    options: asOptions(preferredStyleLabels),
    required: true,
  },
  {
    kind: "number_choice",
    id: "days_per_week",
    title: "How many days per week can you train?",
    options: [2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n} days` })),
    required: true,
  },
  {
    kind: "single",
    id: "session_minutes",
    title: "How long is each session?",
    options: asOptions(sessionMinutesLabels),
    required: true,
  },
  {
    kind: "single",
    id: "training_location",
    title: "Where will you train?",
    options: asOptions(trainingLocationLabels),
    required: true,
  },
  {
    kind: "multi",
    id: "available_equipment",
    title: "What equipment is available?",
    help: "Select everything you have access to.",
    options: asOptions(equipmentLabels),
    required: true,
  },
  {
    kind: "multi",
    id: "injuries",
    title: "Any injuries or areas to work around?",
    help: "We'll keep these in mind when programming exercises.",
    options: asOptions(injuryLabels),
    freeTextField: "injury_notes",
    freeTextLabel: "Anything else we should know? (optional)",
    required: true,
  },
  {
    kind: "date",
    id: "date_of_birth",
    title: "When were you born?",
    help: "Used to set training intensity and recovery defaults.",
    required: true,
  },
  {
    kind: "single",
    id: "sex_at_birth",
    title: "Sex (for training defaults)",
    help: "Used to set baseline strength and energy needs. This is a medical context question.",
    options: asOptions(sexAtBirthLabels),
    required: true,
  },
  {
    kind: "measurement",
    id: "height_cm",
    title: "How tall are you?",
    metric: "height",
    required: true,
  },
  {
    kind: "measurement",
    id: "weight_kg",
    title: "How much do you weigh?",
    metric: "weight",
    required: true,
  },
  {
    kind: "single",
    id: "activity_level",
    title: "Day-to-day activity level outside training?",
    options: asOptions(activityLevelLabels),
    required: true,
  },
];

export function isQuestionVisible(
  q: Question,
  answers: Partial<Profile>,
): boolean {
  if (q.id === "available_equipment") {
    return answers.training_location !== "home_no_equipment";
  }
  return true;
}

export function isAnswered(
  q: Question,
  answers: Partial<Profile>,
): boolean {
  const value = answers[q.id];
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.length > 0;
  return true;
}

export function visibleQuestions(answers: Partial<Profile>): Question[] {
  return onboardingQuestions.filter((q) => isQuestionVisible(q, answers));
}

export function nextUnansweredIndex(answers: Partial<Profile>): number {
  const visible = visibleQuestions(answers);
  for (let i = 0; i < visible.length; i++) {
    if (!isAnswered(visible[i]!, answers)) return i;
  }
  return visible.length;
}
