// 前后端情绪 key 衔接层。
// 前端场景用 "lost"（迷茫），后端 WindFall 用 "confused"（迷茫）。
// 其余 11 种情绪 key 两端一致。这里统一做边界转换，避免各自维护两份词表。
export function toBackendEmotion(frontendEmotion: string): string {
  return frontendEmotion === "lost" ? "confused" : frontendEmotion
}

export function toFrontendEmotion(backendEmotion: string): string {
  return backendEmotion === "confused" ? "lost" : backendEmotion
}