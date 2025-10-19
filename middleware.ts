// middleware.ts
import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (login page)
     * - /api/auth/* (auth API routes)
     * - /_next/* (Next.js internals)
     * - /static/* (static files)
     * - /favicon.ico, /robots.txt (public files)
     */
    '/((?!login|api/auth|_next|static|favicon.ico|robots.txt).*)',
  ]
}