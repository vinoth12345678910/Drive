import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">File Share</h1>
          <p className="text-gray-600 mb-8">Secure file sharing made simple</p>
        </div>

        <div className="space-y-4">
          <Link href="/login" className="w-full">
            <Button className="w-full bg-green-600 hover:bg-green-700">Login</Button>
          </Link>

          <Link href="/register" className="w-full">
            <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-50">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
