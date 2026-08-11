import fs from "fs";
import path from "path";

export interface HistoryItem {
  id: string;
  title: string;
  type: "quiz" | "watch" | "live" | "read";
  detail: string;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  avatar_url: string;
  quizzes_solved: number;
  total_questions: number;
  correct_answers: number;
  accuracy: number;
  saved_ids: string[];
  history: HistoryItem[];
  created_at: string;
}

const DB_FILE_PATH = path.join(process.cwd(), "data_user_store.json");

const DEFAULT_PROFILE: UserProfile = {
  id: "user-1",
  name: "Current Aspirant",
  role: "Civil Services & Competitive Exam Candidate",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  quizzes_solved: 0,
  total_questions: 0,
  correct_answers: 0,
  accuracy: 0,
  saved_ids: [],
  history: [],
  created_at: new Date().toISOString(),
};

export class UserStore {
  private profile: UserProfile;

  constructor() {
    this.profile = this.loadFromFile();
  }

  private loadFromFile(): UserProfile {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
        };
      }
    } catch (err) {
      console.warn("Could not read user database file, using clean initial default:", err);
    }
    return { ...DEFAULT_PROFILE };
  }

  private saveToFile(): void {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.profile, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write user store to file:", err);
    }
  }

  public getProfile(): UserProfile {
    return { ...this.profile };
  }

  public recordQuizResult(headline: string, score: number, total: number): UserProfile {
    this.profile.quizzes_solved += 1;
    this.profile.total_questions += total;
    this.profile.correct_answers += score;

    this.profile.accuracy =
      this.profile.total_questions > 0
        ? Math.round((this.profile.correct_answers / this.profile.total_questions) * 100)
        : 0;

    const percentage = Math.round((score / total) * 100);
    this.addHistoryItem({
      title: `Completed MCQ Quiz on "${headline.slice(0, 45)}${headline.length > 45 ? "..." : ""}"`,
      type: "quiz",
      detail: `Scored ${score}/${total} (${percentage}%)`,
    });

    this.saveToFile();
    return this.getProfile();
  }

  public toggleBookmark(articleId: string, headline?: string): { profile: UserProfile; is_saved: boolean } {
    const index = this.profile.saved_ids.indexOf(articleId);
    let isSaved = false;

    if (index >= 0) {
      this.profile.saved_ids.splice(index, 1);
      isSaved = false;
    } else {
      this.profile.saved_ids.push(articleId);
      isSaved = true;

      if (headline) {
        this.addHistoryItem({
          title: `Saved Snippet "${headline.slice(0, 45)}${headline.length > 45 ? "..." : ""}"`,
          type: "read",
          detail: "Bookmarked for exam revision",
        });
      }
    }

    this.saveToFile();
    return { profile: this.getProfile(), is_saved: isSaved };
  }

  public addHistoryItem(item: { title: string; type: "quiz" | "watch" | "live" | "read"; detail: string }): UserProfile {
    const newItem: HistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: item.title,
      type: item.type,
      detail: item.detail,
      timestamp: "Just now",
    };

    // Keep up to 25 history items
    this.profile.history = [newItem, ...this.profile.history].slice(0, 25);
    this.saveToFile();
    return this.getProfile();
  }

  public resetProfile(): UserProfile {
    this.profile = {
      ...DEFAULT_PROFILE,
      created_at: new Date().toISOString(),
    };
    this.saveToFile();
    return this.getProfile();
  }
}

export const userStore = new UserStore();
