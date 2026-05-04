import { Suspense } from "react"

import { Login } from "@/components/login/login"

export default function Home() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  )
}
