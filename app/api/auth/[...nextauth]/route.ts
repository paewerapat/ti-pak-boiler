import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { 
          label: 'Username', 
          type: 'text', 
          placeholder: 'Enter your username' 
        },
        password: { 
          label: 'Password', 
          type: 'password',
          placeholder: 'Enter your password'
        },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // ค้นหา user จากฐานข้อมูล
          const users = await query(
            'SELECT id, username, email, password, full_name, role, status FROM users WHERE (username = ? OR email = ?) AND status = "active"',
            [credentials.username, credentials.username]
          ) as any[];

          if (users.length === 0) {
            return null;
          }

          const user = users[0];

          const encryptPassword = await bcrypt.hash(credentials.password, 10);
          console.log('Encrypted Password:', encryptPassword);

          // ตรวจสอบรหัสผ่าน
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          
          console.log("isPasswordValid: ", isPasswordValid)

          if (!isPasswordValid) {
            return null;
          }

          // Return user object (ไม่รวม password)
          return {
            id: user.id.toString(),
            username: user.username,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = (user as any).username;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.sub ?? '',
          username: token.username as string,
          full_name: token.full_name as string,
          role: token.role as 'admin' | 'user',
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // หน้า login ที่คุณสร้างขึ้น
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };