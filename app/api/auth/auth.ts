import NextAuth, { type User } from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      // Google requires "offline" access_type to provide a `refresh_token`
      authorization: { params: { access_type: "offline", prompt: "consent" } },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }: any) {
      if (account) {
        // First-time login, save the `access_token`, its expiry and the `refresh_token`

        // console.log("account", account);

        token.accessToken = account.access_token; // Google's access token
        token.refreshToken = account.refresh_token; // Google's refresh token
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : undefined; // Convert to ms
        token.idToken = account.id_token; // *** STORE GOOGLE ID TOKEN ***

        // Add user details from profile to the token if needed directly
        // This 'user' object in the token can be different from NextAuth's User model
        if (profile) {
          token.user = {
            id: profile.sub, // or profile.id if you mapped it in profile()
            name: profile.name,
            email: profile.email,
            image: profile.picture,
          };
        }
        return token;
      }

      // Return previous token if the access token has not expired yet
      // Compare with a small buffer (e.g., 60 seconds)
      if (
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires - 60000
      ) {
        // console.log("Access token still valid");
        return token;
      }

      if (!token.refreshToken) {
        console.error("Missing refresh_token, cannot refresh");
        token.error = "RefreshTokenError"; // Mark token as having an error
        return token; // Return token with error, session callback can handle it
      }

      // Subsequent logins, but the `access_token` has expired, try to refresh it
      if (!token.refresh_token) throw new TypeError("Missing refresh_token");

      // console.log("refreshing token", token);

      try {
        // The `token_endpoint` can be found in the provider's documentation. Or if they support OIDC,
        // at their `/.well-known/openid-configuration` endpoint.
        // i.e. https://accounts.google.com/.well-known/openid-configuration
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          body: new URLSearchParams({
            client_id: process.env.AUTH_GOOGLE_ID!,
            client_secret: process.env.AUTH_GOOGLE_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refresh_token!,
          }),
        });

        const tokensOrError = await response.json();

        if (!response.ok) throw tokensOrError;

        const newTokens = tokensOrError as {
          access_token: string;
          id_token?: string; // Google often returns a new ID token on refresh
          expires_in: number; // Duration in seconds
          refresh_token?: string; // Google MIGHT issue a new refresh token
        };

        return {
          ...token, // Spread existing token properties
          accessToken: newTokens.access_token,
          accessTokenExpires: Date.now() + newTokens.expires_in * 1000, // Expiry in ms
          // Preserve original refresh token if a new one isn't issued
          refreshToken: newTokens.refresh_token ?? token.refreshToken,
          // IMPORTANT: Update the ID token if Google sends a new one
          idToken: newTokens.id_token ?? token.idToken,
          error: undefined, // Clear any previous error
        };
      } catch (error) {
        console.error("Error refreshing access_token", error);
        // If we fail to refresh the token, return an error so we can handle it on the page
        token.error = "RefreshTokenError";
        return token;
      }
    },
    async session({ session, token }: any) {
      if (token) {
        session.user = token.user; // User info from profile stored in token
        session.accessToken = token.accessToken; // Google's access token
        session.idToken = token.idToken; // *** PASS GOOGLE ID TOKEN TO SESSION ***
        session.error = token.error; // Pass any token error to the session
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string | null; // Google's access token
    idToken?: string | null; // Google's ID token
    error?: "RefreshTokenError" | string | null;
  }

  interface JWT {
    accessToken?: string | null;
    refreshToken?: string | null;
    accessTokenExpires?: number | null;
    idToken?: string | null; // Google's ID token
    user?: {
      id?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    error?: "RefreshTokenError" | string | null;
  }
}
