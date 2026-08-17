import { promises as fs } from "fs";
import path from "path";
import type { ChatRecord, DiaryEntry, InsightsSnapshot, UserProfile } from "./types";

/**
 * 文件持久化存储（仅服务端使用）。
 *
 * 日记数据写入磁盘上的 data/entries.json，浏览器刷新、服务器重启后都不丢失。
 * 首次运行时若文件不存在，用 Mock 数据作为种子初始化。
 *
 * 聊天记录写入 data/chats.json（「聊天内容回溯」）。
 * 用户画像写入 data/profile.json，文件不存在表示「尚未完成 onboarding」。
 *
 * 注意：本模块只被 app/api/**（服务端）引用，绝不进入前端 bundle。
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "entries.json");
const TMP_FILE = DATA_FILE + ".tmp";
const PROFILE_FILE = path.join(DATA_DIR, "profile.json");
const CHATS_FILE = path.join(DATA_DIR, "chats.json");
const CHATS_TMP = CHATS_FILE + ".tmp";
const INSIGHTS_FILE = path.join(DATA_DIR, "insights-snapshot.json");

// 写操作串行化：避免并发请求互相覆盖
let writeChain: Promise<void> = Promise.resolve();
let chatWriteChain: Promise<void> = Promise.resolve();

/** 确保数据文件存在；不存在则初始化为空数组（不再写入任何测试种子数据） */
async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

/** 读取全部日记 */
export async function loadEntries(): Promise<DiaryEntry[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    const data = JSON.parse(raw) as DiaryEntry[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** 保存全部日记（原子写：先写临时文件再重命名，避免中途崩溃损坏数据） */
export async function saveEntries(entries: DiaryEntry[]): Promise<void> {
  await ensureFile();
  writeChain = writeChain
    .catch(() => {})
    .then(async () => {
      await fs.writeFile(TMP_FILE, JSON.stringify(entries, null, 2), "utf8");
      await fs.rename(TMP_FILE, DATA_FILE);
    });
  await writeChain;
}

/** 读取用户画像；文件不存在或内容为空（三个字段都没填）时返回 null，表示「尚未完成 onboarding」 */
export async function loadProfile(): Promise<UserProfile | null> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(PROFILE_FILE, "utf8");
    if (!raw.trim()) return null;
    const profile = JSON.parse(raw) as UserProfile;
    if (!profile.mbti && !profile.life_stage && !profile.support_preference) {
      return null;
    }
    return profile;
  } catch {
    return null;
  }
}

/** 保存用户画像 */
export async function saveProfile(profile: UserProfile): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(PROFILE_FILE, JSON.stringify(profile, null, 2), "utf8");
}

/** 清空用户画像（写空对象占位，等效于「尚未完成 onboarding」） */
export async function clearProfile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(PROFILE_FILE, "{}", "utf8");
}

/** 读取全部聊天记录（不存在时返回空数组） */
export async function loadChats(): Promise<ChatRecord[]> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(CHATS_FILE, "utf8");
    const data = JSON.parse(raw) as ChatRecord[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** 保存全部聊天记录（原子写） */
export async function saveChats(chats: ChatRecord[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  chatWriteChain = chatWriteChain
    .catch(() => {})
    .then(async () => {
      await fs.writeFile(CHATS_TMP, JSON.stringify(chats, null, 2), "utf8");
      await fs.rename(CHATS_TMP, CHATS_FILE);
    });
  await chatWriteChain;
}

/** 读取左栏画像 / 折线快照；没有则返回 null */
export async function loadInsightsSnapshot(): Promise<InsightsSnapshot | null> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(INSIGHTS_FILE, "utf8");
    if (!raw.trim()) return null;
    const data = JSON.parse(raw) as InsightsSnapshot;
    if (!data || !Array.isArray(data.included_ids)) return null;
    return data;
  } catch {
    return null;
  }
}

/** 保存左栏快照 */
export async function saveInsightsSnapshot(
  snapshot: InsightsSnapshot,
): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(INSIGHTS_FILE, JSON.stringify(snapshot, null, 2), "utf8");
}

/** 清空左栏快照 */
export async function clearInsightsSnapshot(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.unlink(INSIGHTS_FILE);
  } catch {
    /* 文件不存在即可 */
  }
}

// ============================================================
// 回收站：软删除 + 30 天自动清理
// ============================================================

/** 回收站保留天数 */
export const TRASH_RETENTION_DAYS = 30;

/**
 * 惰性清理：把 deleted_at 超过 30 天的记录彻底删除（写回磁盘）。
 * 在读取日记列表时调用，避免长期积累。
 */
export async function cleanupTrash(): Promise<void> {
  const entries = await loadEntries();
  const cutoff = Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const kept = entries.filter(
    (e) => !e.deleted_at || new Date(e.deleted_at).getTime() >= cutoff
  );
  if (kept.length !== entries.length) {
    await saveEntries(kept);
  }
}
