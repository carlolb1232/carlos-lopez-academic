"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  courseFiles,
  courseForums,
  courses,
  profile,
  publications,
  timeline,
} from "@/lib/data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  AcademicData,
  Course,
  CourseFile,
  CourseForum,
  DataMode,
  ForumReply,
  Profile,
  Publication,
  TimelineEvent,
} from "@/lib/types";

const STORAGE_KEY = "carlos-lopez-academic-data-v2";
const FILE_BUCKET = "academic-files";

const initialData: AcademicData = {
  profile,
  timeline,
  courses,
  courseFiles,
  courseForums,
  publications,
};

type UploadCourseFileInput = {
  courseCode: string;
  file: File;
  category: string;
  visibility: CourseFile["visibility"];
};

type AcademicDataContextValue = AcademicData & {
  loading: boolean;
  error: string | null;
  mode: DataMode;
  refreshData: () => Promise<void>;
  updateProfile: (profile: Profile) => Promise<void>;
  addCourse: (course: Course) => Promise<void>;
  deleteCourse: (code: string) => Promise<void>;
  addCourseFile: (file: CourseFile) => Promise<void>;
  uploadCourseFile: (input: UploadCourseFileInput) => Promise<void>;
  deleteCourseFile: (id: string) => Promise<void>;
  addPublication: (publication: Publication) => Promise<void>;
  deletePublication: (id: string) => Promise<void>;
  addTimelineEvent: (event: TimelineEvent) => Promise<void>;
  deleteTimelineEvent: (id: string) => Promise<void>;
  addForum: (forum: CourseForum) => Promise<void>;
  addForumReply: (forumId: string, reply: ForumReply) => Promise<void>;
  likeForum: (forumId: string) => Promise<void>;
  likeReply: (forumId: string, replyId: string) => Promise<void>;
  resetData: () => void;
};

const AcademicDataContext = createContext<AcademicDataContextValue | null>(null);

export function AcademicDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AcademicData>(initialData);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const mode: DataMode = isSupabaseConfigured ? "supabase" : "local";

  const refreshData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);

    const [
      profileResult,
      coursesResult,
      filesResult,
      publicationsResult,
      timelineResult,
      forumsResult,
      repliesResult,
    ] = await Promise.all([
      supabase!.from("profiles").select("*").eq("id", "main").maybeSingle(),
      supabase!.from("courses").select("*").order("period", { ascending: false }),
      supabase!.from("academic_files").select("*").order("uploaded_at", { ascending: false }),
      supabase!.from("publications").select("*").order("publication_year", { ascending: false }),
      supabase!.from("timeline_events").select("*").order("event_year", { ascending: true }),
      supabase!.from("course_forums").select("*").order("created_at", { ascending: false }),
      supabase!.from("forum_replies").select("*").order("created_at", { ascending: true }),
    ]);

    const firstError = [
      profileResult.error,
      coursesResult.error,
      filesResult.error,
      publicationsResult.error,
      timelineResult.error,
      forumsResult.error,
      repliesResult.error,
    ].find(Boolean);

    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    const remoteCourses: Course[] = (coursesResult.data ?? []).map((row) => ({
      code: row.code,
      name: row.name,
      period: row.period,
      status: row.status,
      school: row.school ?? "",
      files: 0,
      description: row.description ?? "",
    }));

    const publicPaths = (filesResult.data ?? [])
      .filter((row) => row.visibility === "Publico" && row.storage_path)
      .map((row) => row.storage_path as string);
    const signedUrls = publicPaths.length
      ? await supabase!.storage.from(FILE_BUCKET).createSignedUrls(publicPaths, 60 * 60)
      : { data: [], error: null };
    const signedUrlByPath = new Map(
      (signedUrls.data ?? []).map((item, index) => [publicPaths[index], item.signedUrl]),
    );

    const remoteFiles: CourseFile[] = (filesResult.data ?? []).map((row) => ({
      id: row.id,
      courseCode: row.course_code,
      title: row.title,
      type: row.file_type ?? "FILE",
      visibility: row.visibility,
      uploadedAt: row.uploaded_at,
      category: row.category ?? "Otro",
      fileUrl: row.storage_path ? signedUrlByPath.get(row.storage_path) : row.file_url ?? undefined,
      storagePath: row.storage_path ?? undefined,
    }));

    const coursesWithCounts = remoteCourses.map((course) => ({
      ...course,
      files: remoteFiles.filter((file) => file.courseCode === course.code).length,
    }));

    const remoteReplies: Array<ForumReply & { forumId: string }> = (repliesResult.data ?? []).map(
      (row) => ({
        id: row.id,
        forumId: row.forum_id,
        author: row.author_name,
        body: row.body,
        likes: row.likes ?? 0,
        level: row.depth,
        parentId: row.parent_reply_id ?? undefined,
      }),
    );

    const remoteForums: CourseForum[] = (forumsResult.data ?? []).map((row) => {
      const thread = remoteReplies
        .filter((reply) => reply.forumId === row.id)
        .map(({ forumId: _forumId, ...reply }) => reply);
      const course = coursesWithCounts.find((item) => item.code === row.course_code);
      return {
        id: row.id,
        courseCode: row.course_code,
        courseName: course?.name ?? row.course_code,
        title: row.title,
        status: row.status,
        replies: thread.length,
        likes: row.likes ?? 0,
        lastActivity: formatDate(row.updated_at),
        excerpt: row.description ?? "",
        thread,
      };
    });

    setData({
      profile: profileResult.data
        ? {
            name: profileResult.data.full_name,
            role: profileResult.data.role ?? "",
            institution: profileResult.data.institution ?? "",
            location: profileResult.data.location ?? "",
            summary: profileResult.data.bio ?? "",
            email: profileResult.data.email ?? "",
            interests: profileResult.data.interests ?? [],
            metrics: profileResult.data.metrics ?? [],
          }
        : initialData.profile,
      courses: coursesWithCounts,
      courseFiles: remoteFiles,
      publications: (publicationsResult.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        year: String(row.publication_year),
        type: row.publication_type,
        venue: row.venue ?? "",
        authors: row.authors ?? "",
        status: row.status ?? "",
      })),
      timeline: (timelineResult.data ?? []).map((row) => ({
        id: row.id,
        year: row.event_year,
        title: row.title,
        type: row.category,
        description: row.description ?? "",
      })),
      courseForums: remoteForums,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (supabase) {
      void refreshData();
      return;
    }
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setData(JSON.parse(saved) as AcademicData);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, [refreshData]);

  useEffect(() => {
    if (!supabase) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data]);

  const runRemote = useCallback(async (operation: () => Promise<{ error: { message: string } | null }>) => {
    const result = await operation();
    if (result.error) {
      setError(result.error.message);
      throw new Error(result.error.message);
    }
  }, []);

  const value = useMemo<AcademicDataContextValue>(
    () => ({
      ...data,
      loading,
      error,
      mode,
      refreshData,
      updateProfile: async (nextProfile) => {
        if (supabase) {
          await runRemote(async () =>
            supabase!.from("profiles").upsert({
              id: "main",
              full_name: nextProfile.name,
              role: nextProfile.role,
              institution: nextProfile.institution,
              location: nextProfile.location,
              email: nextProfile.email,
              bio: nextProfile.summary,
              interests: nextProfile.interests,
              metrics: nextProfile.metrics,
              updated_at: new Date().toISOString(),
            }),
          );
        }
        setData((current) => ({ ...current, profile: nextProfile }));
      },
      addCourse: async (course) => {
        if (supabase) {
          await runRemote(async () =>
            supabase!.from("courses").upsert({
              code: course.code,
              name: course.name,
              school: course.school,
              period: course.period,
              status: course.status,
              description: course.description,
              updated_at: new Date().toISOString(),
            }),
          );
        }
        setData((current) => ({
          ...current,
          courses: [course, ...current.courses.filter((item) => item.code !== course.code)],
        }));
      },
      deleteCourse: async (code) => {
        if (supabase) {
          await runRemote(async () => supabase!.from("courses").delete().eq("code", code));
        }
        setData((current) => ({
          ...current,
          courses: current.courses.filter((course) => course.code !== code),
          courseFiles: current.courseFiles.filter((file) => file.courseCode !== code),
          courseForums: current.courseForums.filter((forum) => forum.courseCode !== code),
        }));
      },
      addCourseFile: async (file) => {
        if (supabase) {
          await runRemote(async () =>
            supabase!.from("academic_files").insert({
              id: file.id,
              course_code: file.courseCode,
              title: file.title,
              file_type: file.type,
              visibility: file.visibility,
              uploaded_at: file.uploadedAt,
              category: file.category,
              file_url: file.fileUrl,
              storage_path: file.storagePath,
            }),
          );
        }
        setData((current) => addFileToState(current, file));
      },
      uploadCourseFile: async ({ courseCode, file, category, visibility }) => {
        const extension = file.name.split(".").pop()?.toUpperCase() || "FILE";
        const id = makeId("file");
        let storagePath: string | undefined;
        let fileUrl: string | undefined;

        if (supabase) {
          storagePath = `${courseCode}/${id}-${sanitizeFileName(file.name)}`;
          const upload = await supabase!.storage.from(FILE_BUCKET).upload(storagePath, file, {
            upsert: false,
            contentType: file.type || undefined,
          });
          if (upload.error) {
            setError(upload.error.message);
            throw upload.error;
          }
        } else {
          fileUrl = URL.createObjectURL(file);
        }

        const fileRecord: CourseFile = {
          id,
          courseCode,
          title: file.name.replace(/\.[^/.]+$/, ""),
          type: extension,
          visibility,
          uploadedAt: new Date().toISOString().slice(0, 10),
          category,
          fileUrl,
          storagePath,
        };

        if (supabase) {
          await runRemote(async () =>
            supabase!.from("academic_files").insert({
              id: fileRecord.id,
              course_code: fileRecord.courseCode,
              title: fileRecord.title,
              file_type: fileRecord.type,
              visibility: fileRecord.visibility,
              uploaded_at: fileRecord.uploadedAt,
              category: fileRecord.category,
              file_url: fileRecord.fileUrl,
              storage_path: fileRecord.storagePath,
            }),
          );
        }
        setData((current) => addFileToState(current, fileRecord));
      },
      deleteCourseFile: async (id) => {
        const removed = data.courseFiles.find((file) => file.id === id);
        if (supabase) {
          if (removed?.storagePath) {
            await supabase!.storage.from(FILE_BUCKET).remove([removed.storagePath]);
          }
          await runRemote(async () => supabase!.from("academic_files").delete().eq("id", id));
        }
        setData((current) => removeFileFromState(current, id));
      },
      addPublication: async (publication) => {
        if (supabase) {
          await runRemote(async () =>
            supabase!.from("publications").insert({
              id: publication.id,
              title: publication.title,
              publication_year: Number(publication.year),
              publication_type: publication.type,
              venue: publication.venue,
              authors: publication.authors,
              status: publication.status,
            }),
          );
        }
        setData((current) => ({
          ...current,
          publications: [publication, ...current.publications],
        }));
      },
      deletePublication: async (id) => {
        if (supabase) {
          await runRemote(async () => supabase!.from("publications").delete().eq("id", id));
        }
        setData((current) => ({
          ...current,
          publications: current.publications.filter((publication) => publication.id !== id),
        }));
      },
      addTimelineEvent: async (event) => {
        if (supabase) {
          await runRemote(async () =>
            supabase!.from("timeline_events").insert({
              id: event.id,
              event_year: event.year,
              title: event.title,
              category: event.type,
              description: event.description,
            }),
          );
        }
        setData((current) => ({
          ...current,
          timeline: [event, ...current.timeline].sort((a, b) => Number(a.year) - Number(b.year)),
        }));
      },
      deleteTimelineEvent: async (id) => {
        if (supabase) {
          await runRemote(async () => supabase!.from("timeline_events").delete().eq("id", id));
        }
        setData((current) => ({
          ...current,
          timeline: current.timeline.filter((event) => event.id !== id),
        }));
      },
      addForum: async (forum) => {
        if (supabase) {
          await runRemote(async () =>
            supabase!.from("course_forums").insert({
              id: forum.id,
              course_code: forum.courseCode,
              title: forum.title,
              description: forum.excerpt,
              status: forum.status,
              likes: forum.likes,
            }),
          );
        }
        setData((current) => ({
          ...current,
          courseForums: [forum, ...current.courseForums],
        }));
      },
      addForumReply: async (forumId, reply) => {
        if (supabase) {
          await runRemote(async () =>
            supabase!.from("forum_replies").insert({
              id: reply.id,
              forum_id: forumId,
              author_name: reply.author,
              body: reply.body,
              depth: reply.level,
              likes: reply.likes,
              parent_reply_id: reply.parentId ?? null,
            }),
          );
        }
        setData((current) => ({
          ...current,
          courseForums: current.courseForums.map((forum) =>
            forum.id === forumId
              ? {
                  ...forum,
                  replies: forum.replies + 1,
                  lastActivity: "Ahora",
                  thread: [...forum.thread, reply],
                }
              : forum,
          ),
        }));
      },
      likeForum: async (forumId) => {
        if (supabase) {
          await runRemote(async () => supabase!.rpc("increment_forum_like", { target_id: forumId }));
        }
        setData((current) => ({
          ...current,
          courseForums: current.courseForums.map((forum) =>
            forum.id === forumId ? { ...forum, likes: forum.likes + 1 } : forum,
          ),
        }));
      },
      likeReply: async (forumId, replyId) => {
        if (supabase) {
          await runRemote(async () => supabase!.rpc("increment_reply_like", { target_id: replyId }));
        }
        setData((current) => ({
          ...current,
          courseForums: current.courseForums.map((forum) =>
            forum.id === forumId
              ? {
                  ...forum,
                  thread: forum.thread.map((reply) =>
                    reply.id === replyId ? { ...reply, likes: reply.likes + 1 } : reply,
                  ),
                }
              : forum,
          ),
        }));
      },
      resetData: () => {
        if (!supabase) {
          window.localStorage.removeItem(STORAGE_KEY);
          setData(initialData);
        }
      },
    }),
    [data, error, loading, mode, refreshData, runRemote],
  );

  return <AcademicDataContext.Provider value={value}>{children}</AcademicDataContext.Provider>;
}

export function useAcademicData() {
  const context = useContext(AcademicDataContext);
  if (!context) {
    throw new Error("useAcademicData must be used inside AcademicDataProvider");
  }
  return context;
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addFileToState(current: AcademicData, file: CourseFile): AcademicData {
  return {
    ...current,
    courseFiles: [file, ...current.courseFiles],
    courses: current.courses.map((course) =>
      course.code === file.courseCode ? { ...course, files: course.files + 1 } : course,
    ),
  };
}

function removeFileFromState(current: AcademicData, id: string): AcademicData {
  const removed = current.courseFiles.find((file) => file.id === id);
  return {
    ...current,
    courseFiles: current.courseFiles.filter((file) => file.id !== id),
    courses: current.courses.map((course) =>
      course.code === removed?.courseCode
        ? { ...course, files: Math.max(0, course.files - 1) }
        : course,
    ),
  };
}

function sanitizeFileName(fileName: string) {
  return fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(new Date(value));
}
