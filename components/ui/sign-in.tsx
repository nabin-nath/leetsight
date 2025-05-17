import { signIn } from "@/app/api/auth/auth";
import { FcGoogle } from "react-icons/fc";
import { SiMinds } from "react-icons/si";

export default function SignIn() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl backdrop-blur-md">
        {/* App Logo/Name (Optional but Recommended) */}
        <div className="mb-8 text-center">
          {/* You can replace this with an actual SVG logo if you have one */}
          <h1 className="text-5xl font-bold text-black-600 bg-clip-text flex items-center justify-center">
            <SiMinds className="h-10 w-10 mr-2" />
            Leetsight
          </h1>
          <p className="mt-2 text-black-600">Illuminate Your Interview Path</p>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-black-600">Welcome!</h2>
            <p className="mt-2 text-black-500">
              Sign in to unlock insights into real-world interview questions and
              supercharge your preparation.
            </p>
          </div>

          {/* App Insights Section */}
          <div className="space-y-3 rounded-lg border border-slate-700 bg-gray-100 p-6 shadow-md">
            <h3 className="text-lg font-semibold text-black-600">
              Why Join Leetsight?
            </h3>
            <ul className="list-inside list-disc space-y-1.5 text-black-300 text-sm">
              <li>
                Discover{" "}
                <span className="font-medium text-black-100">
                  actual interview questions
                </span>{" "}
                asked at top tech companies.
              </li>
              <li>
                Filter questions by{" "}
                <span className="font-medium text-black-100">
                  company, role
                </span>
                .
              </li>
              <li>
                Find{" "}
                <span className="font-medium text-black-100">
                  similar questions
                </span>{" "}
                available on online coding platforms.
              </li>
              <li>
                Understand{" "}
                <span className="font-medium text-black-100">
                  trends and common topics
                </span>{" "}
                in technical interviews.
              </li>
              <li>
                Stay ahead with the{" "}
                <span className="font-medium text-black-100">
                  latest insights
                </span>{" "}
                from the community.
              </li>
            </ul>
          </div>

          {/* Sign-in Action */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" }); // Redirect to home after sign-in
            }}
            className="w-full"
          >
            <button
              type="submit"
              className="group flex w-full items-center justify-center gap-3 rounded-lg bg-gray-600 px-6 py-3.5 text-lg font-semibold text-white shadow-lg transition-all duration-300 ease-in-out hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 active:bg-gray-700 cursor-pointer"
            >
              <FcGoogle className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
              Sign in with Google
            </button>
          </form>

          <p className="text-center text-xs text-slate-500">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      <footer className="absolute bottom-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Leetsight. All rights reserved.
      </footer>
    </div>
  );
}
