"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, GripVertical, Edit, Trash2, ImageIcon, Play, Upload, Type } from "lucide-react"

interface ShowcaseItem {
  id: string
  type: "image" | "video" | "text"
  content: string
  title: string
  description: string
  size?: "normal" | "long"
}

interface Friend {
  id: string
  name: string
  avatar: string
  status: "online" | "offline" | "away"
  lastSeen?: string
}

interface ShowcaseEditorProps {
  items: ShowcaseItem[]
  onItemsChange: (items: ShowcaseItem[]) => void
  profilePicture?: string
  profileName?: string
  profileDescription?: string
  onProfileChange?: (data: { profilePicture?: string; profileName?: string; profileDescription?: string }) => void
  layout?: "default" | "minimal" | "grid" | "masonry" | "spotlight"
  onLayoutChange?: (layout: "default" | "minimal" | "grid" | "masonry" | "spotlight") => void
  backgroundColor?: string
  onBackgroundColorChange?: (color: string) => void
  backgroundImage?: string
  onBackgroundImageChange?: (image: string) => void
  contentBoxColor?: string
  onContentBoxColorChange?: (color: string) => void
  contentBoxTrimColor?: string
  onContentBoxTrimColorChange?: (color: string) => void
  friends?: Friend[]
  onFriendsChange?: (friends: Friend[]) => void
  theme?: "light-business" | "dark-business" | "business-casual"
  onThemeChange?: (theme: "light-business" | "dark-business" | "business-casual") => void
  resumeFile?: string
  onResumeFileChange?: (file: string) => void
}

export function ShowcaseEditor({
  items,
  onItemsChange,
  profilePicture,
  profileName,
  profileDescription,
  onProfileChange,
  layout = "default",
  onLayoutChange,
  backgroundColor = "#0a0a0a",
  onBackgroundColorChange,
  backgroundImage,
  onBackgroundImageChange,
  contentBoxColor = "#1a1a1a",
  onContentBoxColorChange,
  contentBoxTrimColor = "#22c55e",
  onContentBoxTrimColorChange,
  friends = [],
  onFriendsChange,
  theme = "light-business",
  onThemeChange,
  resumeFile = "",
  onResumeFileChange,
}: ShowcaseEditorProps) {
  const [editingItem, setEditingItem] = useState<ShowcaseItem | null>(null)
  const [editingItemType, setEditingItemType] = useState<"image" | "video" | "text">("image")
  const [editingItemSize, setEditingItemSize] = useState<"normal" | "long">("normal")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newItemType, setNewItemType] = useState<"image" | "video" | "text">("image")
  const [newItemSize, setNewItemSize] = useState<"normal" | "long">("normal")
  const [uploadedProfilePicture, setUploadedProfilePicture] = useState<string | null>(null)
  const [uploadedItemFile, setUploadedItemFile] = useState<string | null>(null)
  const [editUploadedFile, setEditUploadedFile] = useState<string | null>(null)
  const [uploadedBackgroundImage, setUploadedBackgroundImage] = useState<string | null>(null)
  const [isMainEditorOpen, setIsMainEditorOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"profile" | "showcase" | "resume" | "appearance" | "layout">("profile")

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const newItems = Array.from(items)
    const [reorderedItem] = newItems.splice(result.source.index, 1)
    newItems.splice(result.destination.index, 0, reorderedItem)

    onItemsChange(newItems)
  }

  const handleFileUpload = (file: File, callback: (url: string) => void) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      callback(result)
    }
    reader.readAsDataURL(file)
  }

  const handleAddItem = (formData: FormData) => {
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const content = formData.get("content") as string

    if (!title) return

    let itemContent = content
    if ((newItemType === "image" || newItemType === "video") && uploadedItemFile) {
      itemContent = uploadedItemFile
    } else if (newItemType === "image" || newItemType === "video") {
      itemContent = content
        ? `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(content)}`
        : "/placeholder.svg"
    }

    const newItem: ShowcaseItem = {
      id: Date.now().toString(),
      type: newItemType,
      title,
      description,
      content: itemContent,
      size: newItemSize,
    }

    onItemsChange([...items, newItem])
    setIsAddDialogOpen(false)
    setUploadedItemFile(null)
  }

  const handleEditItem = (formData: FormData) => {
    if (!editingItem) return

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const content = formData.get("content") as string

    let itemContent = editingItem.content
    if ((editingItemType === "image" || editingItemType === "video") && editUploadedFile) {
      itemContent = editUploadedFile
    } else if (editingItemType === "image" || editingItemType === "video") {
      itemContent = content
        ? `/placeholder.svg?height=300&width=400&query=${encodeURIComponent(content)}`
        : editingItem.content
    } else {
      itemContent = content
    }

    const updatedItem = {
      ...editingItem,
      type: editingItemType,
      title,
      description,
      content: itemContent,
      size: editingItemSize,
    }

    onItemsChange(items.map((item) => (item.id === editingItem.id ? updatedItem : item)))
    setEditingItem(null)
    setEditUploadedFile(null)
  }

  const handleProfileEdit = (formData: FormData) => {
    const name = formData.get("profileName") as string
    const description = formData.get("profileDescription") as string
    const pictureDescription = formData.get("profilePicture") as string

    let profilePic = profilePicture
    if (uploadedProfilePicture) {
      profilePic = uploadedProfilePicture
    } else if (pictureDescription) {
      profilePic = `/placeholder.svg?height=120&width=120&query=${encodeURIComponent(pictureDescription)}`
    }

    onProfileChange?.({
      profileName: name,
      profileDescription: description,
      profilePicture: profilePic,
    })
    setUploadedProfilePicture(null)
  }

  const handleDeleteItem = (id: string) => {
    onItemsChange(items.filter((item) => item.id !== id))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Play className="h-4 w-4" />
      case "text":
        return <Type className="h-4 w-4" />
      default:
        return null
    }
  }

  const renderContent = (item: ShowcaseItem) => {
    switch (item.type) {
      case "image":
        return (
          <img src={item.content || "/placeholder.svg"} alt={item.title} className="w-full h-32 object-cover rounded" />
        )
      case "video":
        return (
          <div className="relative">
            <img
              src={item.content || "/placeholder.svg"}
              alt={item.title}
              className="w-full h-32 object-cover rounded"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
              <Play className="h-6 w-6 text-white fill-current" />
            </div>
          </div>
        )
      case "text":
        return (
          <div className="p-3 bg-muted rounded text-sm">
            <p className="line-clamp-3">{item.content}</p>
          </div>
        )
      default:
        return null
    }
  }

  const openEditDialog = (item: ShowcaseItem) => {
    setEditingItem(item)
    setEditingItemType(item.type)
    setEditingItemSize(item.size || "normal")
    setEditUploadedFile(null)
  }

  const layoutDescriptions = {
    default: "Classic Steam-style layout with profile on top",
    minimal: "Clean centered design with large profile picture",
    grid: "Compact grid layout perfect for many items",
    masonry: "Pinterest-style flowing layout",
    spotlight: "Hero-focused design with prominent profile",
  }

  const handleSaveAsPreset = () => {
    const presetData = {
      profileName,
      profileDescription,
      profilePicture,
      layout,
      backgroundColor,
      backgroundImage,
      contentBoxColor,
      contentBoxTrimColor,
      theme,
      showcaseItems: items.slice(0, 6),
    }

    const savedPresets = JSON.parse(localStorage.getItem("profilePresets") || "[]")
    const newPreset = {
      id: Date.now().toString(),
      name: `${profileName}'s Profile`,
      data: presetData,
      createdAt: new Date().toISOString(),
    }

    savedPresets.push(newPreset)
    localStorage.setItem("profilePresets", JSON.stringify(savedPresets.slice(-5)))

    alert("Profile saved as preset!")
  }

  return (
    <div className="space-y-6" style={{ backgroundColor }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Edit Your Showcase</h2>
          <p className="text-muted-foreground">Customize your profile, showcase, and friends</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveAsPreset}>
            Save as Preset
          </Button>
          <Dialog open={isMainEditorOpen} onOpenChange={setIsMainEditorOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl w-[95vw] max-h-[85vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Profile Editor</DialogTitle>
              </DialogHeader>
              <div className="flex h-[75vh]">
                <div className="w-48 border-r pr-4 flex-shrink-0">
                  <nav className="space-y-2">
                    {[
                      { id: "profile", label: "Profile Info", icon: "👤" },
                      { id: "showcase", label: "Showcase Items", icon: "🎮" },
                      { id: "resume", label: "Resume", icon: "📄" },
                      { id: "appearance", label: "Appearance", icon: "🎨" },
                      { id: "layout", label: "Layout", icon: "📐" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeTab === tab.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                      >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="flex-1 pl-6 overflow-y-auto">
                  {activeTab === "profile" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Profile Information</h3>
                      <form action={handleProfileEdit} className="space-y-4">
                        <div>
                          <Label htmlFor="profileName">Profile Name</Label>
                          <Input name="profileName" defaultValue={profileName} placeholder="Enter your name" />
                        </div>
                        <div>
                          <Label htmlFor="profileDescription">Profile Description</Label>
                          <Textarea
                            name="profileDescription"
                            defaultValue={profileDescription}
                            placeholder="Tell others about yourself"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Profile Picture</Label>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleFileUpload(file, setUploadedProfilePicture)
                                  }
                                }}
                                className="flex-1"
                              />
                              <Button type="button" variant="outline" size="sm">
                                <Upload className="h-3 w-3" />
                                Upload
                              </Button>
                            </div>
                            {uploadedProfilePicture && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <ImageIcon className="h-4 w-4" />
                                Profile picture uploaded successfully
                              </div>
                            )}
                            <Input name="profilePicture" placeholder="Or describe your ideal profile picture" />
                          </div>
                        </div>
                        <Button type="submit" className="w-full">
                          Save Profile
                        </Button>
                      </form>
                    </div>
                  )}

                  {activeTab === "showcase" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Showcase Items</h3>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                              <Plus className="h-4 w-4" />
                              Add Item
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Showcase Item</DialogTitle>
                            </DialogHeader>
                            <form action={handleAddItem} className="space-y-4">
                              <div>
                                <Label htmlFor="type">Type</Label>
                                <Select
                                  value={newItemType}
                                  onValueChange={(value: "image" | "video" | "text") => {
                                    setNewItemType(value)
                                    setUploadedItemFile(null)
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="image">Image</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="text">Text</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="longBox"
                                  checked={newItemSize === "long"}
                                  onCheckedChange={(checked) => setNewItemSize(checked ? "long" : "normal")}
                                />
                                <Label htmlFor="longBox">Make this a long box (spans full width)</Label>
                              </div>
                              <div>
                                <Label htmlFor="title">Title</Label>
                                <Input name="title" placeholder="Enter title" required />
                              </div>
                              <div>
                                <Label htmlFor="description">Description</Label>
                                <Input name="description" placeholder="Enter description (optional)" />
                              </div>
                              <div>
                                <Label htmlFor="content">Content</Label>
                                {newItemType === "text" ? (
                                  <Textarea name="content" placeholder="Enter your text content" required />
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="file"
                                        accept={newItemType === "image" ? "image/*" : "video/*"}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0]
                                          if (file) {
                                            handleFileUpload(file, setUploadedItemFile)
                                          }
                                        }}
                                        className="flex-1"
                                      />
                                      <Button type="button" variant="outline" size="sm">
                                        <Upload className="h-3 w-3" />
                                        Upload
                                      </Button>
                                    </div>
                                    {uploadedItemFile && (
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {newItemType === "image" ? (
                                          <ImageIcon className="h-4 w-4" />
                                        ) : (
                                          <Play className="h-4 w-4" />
                                        )}
                                        {newItemType === "image" ? "Image" : "Video"} uploaded
                                      </div>
                                    )}
                                    <Input
                                      name="content"
                                      placeholder={`Describe the ${newItemType} for placeholder generation`}
                                    />
                                  </div>
                                )}
                              </div>
                              <Button type="submit" className="w-full">
                                Add Item
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                        {items.map((item) => (
                          <Card key={item.id} className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="gap-1">
                                  {getTypeIcon(item.type)}
                                  {item.type}
                                </Badge>
                                <span className="font-medium text-sm">{item.title}</span>
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => openEditDialog(item)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "resume" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Resume Upload</h3>
                      <div className="space-y-4">
                        <div>
                          <Label>Upload Resume (PDF)</Label>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleFileUpload(file, (url) => {
                                      onResumeFileChange?.(url)
                                    })
                                  }
                                }}
                                className="flex-1"
                              />
                              <Button type="button" variant="outline" size="sm">
                                <Upload className="h-3 w-3" />
                                Upload
                              </Button>
                            </div>
                            {resumeFile && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <ImageIcon className="h-4 w-4" />
                                Resume uploaded successfully
                              </div>
                            )}
                            {resumeFile && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onResumeFileChange?.("")}
                                className="w-full"
                              >
                                Remove Resume
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "appearance" && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Customize Appearance</h3>

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Color Theme</h4>
                        <div className="grid grid-cols-1 gap-3">
                          {[
                            {
                              id: "light-business",
                              name: "Light Business",
                              description: "Clean professional light theme",
                            },
                            {
                              id: "dark-business",
                              name: "Dark Business",
                              description: "Sleek professional dark theme",
                            },
                            {
                              id: "business-casual",
                              name: "Business Casual",
                              description: "Warm and approachable professional theme",
                            },
                          ].map((themeOption) => (
                            <Card
                              key={themeOption.id}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                theme === themeOption.id ? "ring-2 ring-primary" : ""
                              }`}
                              onClick={() => onThemeChange?.(themeOption.id as any)}
                            >
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardTitle className="text-sm">{themeOption.name}</CardTitle>
                                    <CardDescription className="text-xs">{themeOption.description}</CardDescription>
                                  </div>
                                  {theme === themeOption.id && <Badge>Active</Badge>}
                                </div>
                              </CardHeader>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Background</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Label htmlFor="backgroundColor" className="text-sm min-w-[60px]">
                              Color:
                            </Label>
                            <input
                              id="backgroundColor"
                              type="color"
                              value={backgroundColor}
                              onChange={(e) => onBackgroundColorChange?.(e.target.value)}
                              className="w-12 h-8 rounded border cursor-pointer"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Background Image:</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleFileUpload(file, (url) => {
                                      setUploadedBackgroundImage(url)
                                      onBackgroundImageChange?.(url)
                                    })
                                  }
                                }}
                                className="flex-1"
                              />
                              <Button type="button" variant="outline" size="sm">
                                <Upload className="h-3 w-3" />
                              </Button>
                            </div>
                            {backgroundImage && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onBackgroundImageChange?.("")}
                                className="w-full"
                              >
                                Remove Background Image
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Content Boxes</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Label htmlFor="contentBoxColor" className="text-sm min-w-[60px]">
                              Fill:
                            </Label>
                            <input
                              id="contentBoxColor"
                              type="color"
                              value={contentBoxColor}
                              onChange={(e) => onContentBoxColorChange?.(e.target.value)}
                              className="w-12 h-8 rounded border cursor-pointer"
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <Label htmlFor="contentBoxTrimColor" className="text-sm min-w-[60px]">
                              Border:
                            </Label>
                            <input
                              id="contentBoxTrimColor"
                              type="color"
                              value={contentBoxTrimColor}
                              onChange={(e) => onContentBoxTrimColorChange?.(e.target.value)}
                              className="w-12 h-8 rounded border cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "layout" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Choose Layout Preset</h3>
                      <div className="space-y-3">
                        {Object.entries(layoutDescriptions).map(([key, description]) => (
                          <Card
                            key={key}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              layout === key ? "ring-2 ring-primary" : ""
                            }`}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-base capitalize">{key}</CardTitle>
                                  {layout === key && <Badge>Current</Badge>}
                                </div>
                                <Button size="sm" onClick={() => onLayoutChange?.(key as any)}>
                                  Select
                                </Button>
                              </div>
                              <CardDescription className="text-sm">{description}</CardDescription>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="showcase-items">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`transition-shadow ${snapshot.isDragging ? "shadow-lg rotate-2" : "hover:shadow-md"} ${
                        item.size === "long" ? "md:col-span-2 lg:col-span-3" : ""
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div {...provided.dragHandleProps} className="cursor-grab">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            {item.size === "long" && (
                              <Badge variant="outline" className="text-xs">
                                Long
                              </Badge>
                            )}
                            <Badge variant="secondary" className="gap-1">
                              {getTypeIcon(item.type)}
                              {item.type}
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEditDialog(item)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <CardTitle className="text-sm">{item.title}</CardTitle>
                        {item.description && <CardDescription className="text-xs">{item.description}</CardDescription>}
                      </CardHeader>
                      <CardContent className="pt-0">{renderContent(item)}</CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Showcase Item</DialogTitle>
            </DialogHeader>
            <form action={handleEditItem} className="space-y-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={editingItemType}
                  onValueChange={(value: "image" | "video" | "text") => {
                    setEditingItemType(value)
                    setEditUploadedFile(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editLongBox"
                  checked={editingItemSize === "long"}
                  onCheckedChange={(checked) => setEditingItemSize(checked ? "long" : "normal")}
                />
                <Label htmlFor="editLongBox">Make this a long box (spans full width)</Label>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input name="title" defaultValue={editingItem.title} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input name="description" defaultValue={editingItem.description} />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                {editingItemType === "text" ? (
                  <Textarea
                    name="content"
                    defaultValue={editingItem.type === "text" ? editingItem.content : ""}
                    placeholder="Enter your text content"
                    required
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept={editingItemType === "image" ? "image/*" : "video/*"}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleFileUpload(file, setEditUploadedFile)
                          }
                        }}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="sm">
                        <Upload className="h-3 w-3" />
                        Upload
                      </Button>
                    </div>
                    {editUploadedFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {editingItemType === "image" ? <ImageIcon className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {editingItemType === "image" ? "Image" : "Video"} uploaded
                      </div>
                    )}
                    <Input
                      name="content"
                      placeholder={`Describe the ${editingItemType} for placeholder generation`}
                      defaultValue={editingItem.type !== "text" ? editingItem.content : ""}
                    />
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full">
                Update Item
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
