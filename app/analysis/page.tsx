import { redirect } from "next/navigation"

/** 成长页已并入纸叠（/history），旧地址转到记录页。 */
export default function Page() {
  redirect("/history")
}
