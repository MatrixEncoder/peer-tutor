// Auth route handler - NextAuth needs this to handle sign-in/sign-out requests

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
