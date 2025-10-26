// middleware.ts
import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    '/((?!login|api/auth|_next|static|favicon.ico|robots.txt|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
}