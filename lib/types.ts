export type ProfileMetric = {
  label: string;
  value: string;
};

export type Profile = {
  name: string;
  role: string;
  institution: string;
  location: string;
  summary: string;
  email: string;
  interests: string[];
  metrics: ProfileMetric[];
};

export type TimelineEvent = {
  id: string;
  year: string;
  title: string;
  type: string;
  description: string;
};

export type Course = {
  code: string;
  name: string;
  period: string;
  status: "Actual" | "Historico";
  school: string;
  files: number;
  description: string;
};

export type CourseFile = {
  id: string;
  courseCode: string;
  title: string;
  type: string;
  visibility: "Publico" | "Privado";
  uploadedAt: string;
  category?: string;
  fileUrl?: string;
  storagePath?: string;
};

export type ForumReply = {
  id: string;
  author: string;
  body: string;
  likes: number;
  level: 1 | 2 | 3;
  parentId?: string;
};

export type CourseForum = {
  id: string;
  courseCode: string;
  courseName: string;
  title: string;
  status: "Abierto" | "Cerrado" | "Solo lectura";
  replies: number;
  likes: number;
  lastActivity: string;
  excerpt: string;
  thread: ForumReply[];
};

export type Publication = {
  id: string;
  title: string;
  year: string;
  type: string;
  venue: string;
  authors: string;
  status: string;
};

export type AcademicData = {
  profile: Profile;
  timeline: TimelineEvent[];
  courses: Course[];
  courseFiles: CourseFile[];
  courseForums: CourseForum[];
  publications: Publication[];
};

export type DataMode = "local" | "supabase";
