"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Upload, File, LogOut, ExternalLink, Share2, Trash2, Copy, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FileItem {
  _id: string
  filename: string
  fileURl: string
  isPublic: boolean
  shareId?: string
  createdAt: string
}

export default function DashboardPage() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [processingFileId, setProcessingFileId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetchFiles()
  }, [router])

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/files/files`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFiles(data)
        setError("")
      } else {
        const errorData = await response.json()
        setError(`Failed to fetch files: ${response.status}`)

        if (response.status === 401) {
          localStorage.removeItem("token")
          router.push("/login")
        }
      }
    } catch (error) {
      setError("Network error fetching files")
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const file = formData.get("file") as File

    if (!file) {
      setError("Please select a file")
      return
    }

    setUploading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No authentication token found")
        router.push("/login")
        return
      }

      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      })

      const data = await response.json()

      if (response.ok) {
        await fetchFiles()
        ;(e.target as HTMLFormElement).reset()
        setError("")
        toast({
          title: "Success",
          description: "File uploaded successfully!",
        })
      } else {
        setError(data.message || `Upload failed: ${response.status}`)
      }
    } catch (error) {
      setError(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setUploading(false)
    }
  }

  const toggleFilePrivacy = async (fileId: string) => {
    setProcessingFileId(fileId)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/files/files/${fileId}/toggle-privacy`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        await fetchFiles()
        toast({
          title: "Success",
          description: data.message,
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update file privacy",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error",
        variant: "destructive",
      })
    } finally {
      setProcessingFileId(null)
    }
  }

  const copyShareLink = async (file: FileItem) => {
    if (file.shareId) {
      const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/files/share/${file.shareId}`
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Copied!",
          description: "Share link copied to clipboard",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        })
      }
    }
  }

  const deleteFile = async (fileId: string) => {
    setProcessingFileId(fileId)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/files/files/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        await fetchFiles()
        toast({
          title: "Success",
          description: "File deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete file",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error",
        variant: "destructive",
      })
    } finally {
      setProcessingFileId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">File Dashboard</h1>
            <Button onClick={handleLogout} variant="outline" size="sm" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Upload Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload File
              </CardTitle>
              <CardDescription>Upload a new file to your collection</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileUpload} className="space-y-4">
                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

                <div className="space-y-2">
                  <Label htmlFor="file">Choose File</Label>
                  <Input id="file" name="file" type="file" required className="cursor-pointer" />
                </div>

                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload File"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Files List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Your Files ({files.length})
              </CardTitle>
              <CardDescription>Manage your uploaded files</CardDescription>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No files uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {files.map((file) => (
                    <div key={file._id} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.filename}</p>
                            <Badge variant={file.isPublic ? "default" : "secondary"} className="text-xs">
                              {file.isPublic ? "Public" : "Private"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mb-3">{new Date(file.createdAt).toLocaleDateString()}</p>

                          {/* Share link display */}
                          {file.isPublic && file.shareId && (
                            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs">
                              <p className="text-green-700 font-medium mb-1">Shareable Link:</p>
                              <div className="flex items-center gap-2">
                                <code className="flex-1 text-green-600 break-all">
                                  ${process.env.NEXT_PUBLIC_BASE_URL}/api/files/share/{file.shareId}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyShareLink(file)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(file.fileURl, "_blank")}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleFilePrivacy(file._id)}
                          disabled={processingFileId === file._id}
                          className="flex items-center gap-1"
                        >
                          {file.isPublic ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          {processingFileId === file._id
                            ? "Processing..."
                            : file.isPublic
                              ? "Make Private"
                              : "Make Public"}
                        </Button>

                        {file.isPublic && file.shareId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyShareLink(file)}
                            className="flex items-center gap-1"
                          >
                            <Share2 className="h-3 w-3" />
                            Copy Link
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete File</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{file.filename}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteFile(file._id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={processingFileId === file._id}
                              >
                                {processingFileId === file._id ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
