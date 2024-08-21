export default function BlockedPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Account Blocked</h1>
      <p className="text-lg">
        This account has been blocked. If you are an employee, please sign in
        with your personal email. Otherwise, please contact our support team for
        assistance.
      </p>
    </div>
  );
}
