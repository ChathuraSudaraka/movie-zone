export function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#141414] px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-zinc-900/80 p-8 rounded-lg border border-zinc-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Forgot Password</h2>
          <p className="mt-2 text-sm text-gray-400">
            Enter your email to reset your password
          </p>
        </div>
        <form className="mt-8 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className="mt-1 block w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
              placeholder="Enter your email"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Send Reset Link
          </button>
        </form>
        <div className="text-center">
          <p className="mt-2 text-sm text-gray-400">
            Remembered your password?{" "}
            <a
              href="/auth/login"
              className="font-medium text-red-600 hover:text-red-500"
            >
              Sign In
            </a>
          </p>

          <p className="mt-2 text-sm text-gray-400">
            Don't have an account?{" "}
            <a
              href="/auth/register"
              className="font-medium text-red-600 hover:text-red-500"
            >
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
