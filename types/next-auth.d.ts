import 'next-auth';

declare module 'next-auth' {
  interface User {
    id?: string;
    role?: string;
    assignedNailTechId?: string | null;
  }

  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      assignedNailTechId?: string | null;
      isActive?: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    assignedNailTechId?: string | null;
    isActive?: boolean;
  }
}
