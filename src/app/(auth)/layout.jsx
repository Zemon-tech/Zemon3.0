export default function AuthLayout({ children }) {
  return (
    <div className="flex h-screen">
      {/* Left side with image/branding */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-gray-50 p-10">
        <div className="text-2xl font-bold">Team Management System</div>
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-6">Collaborate efficiently with your team</h1>
          <p className="text-lg text-gray-600">
            Manage tasks, chat in real-time, and share resources all in one place.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Team Management Inc. All rights reserved.
        </div>
      </div>
      
      {/* Right side with auth forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
} 