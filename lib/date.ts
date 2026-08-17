/**
 * 本地日期工具。
 *
 * 日记的 created_at 存的是 UTC ISO 字符串；按「本地时区日期」聚合（韧性折线、
 * 情绪色带、导出）时，若直接 `slice(0,10)` 会取到 UTC 日期，导致中国用户凌晨
 * 写的记录被归到「前一天」。这里统一用本地时区换算，与服务端所在机器的时区一致。
 */
export function localDateKey(iso: string): string {
  const d = new Date(iso);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
