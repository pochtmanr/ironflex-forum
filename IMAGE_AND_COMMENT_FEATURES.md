# 🖼️ Image Lightbox & Editable Comments

## New Features Added

### 1. ✅ Full-Resolution Image Viewer (Lightbox)
Click any image to view it in full resolution with a beautiful lightbox overlay.

### 2. ✅ Editable Comments
Users can edit and delete their own comments. Admins can edit/delete any comment.

---

## 🖼️ Image Lightbox Usage

### Components Created:
- `ImageLightbox.tsx` - Full-screen image viewer
- `ClickableImage.tsx` - Wrapper for images with click-to-zoom

### How to Use in Topic View:

```tsx
import { ClickableImage } from '@/components/UI'

// In your topic content rendering:
<ClickableImage 
  src={imageUrl} 
  alt="Image description"
  className="my-4"
/>
```

### Features:
- ✅ **Click to open** - Opens image in 80-90% screen overlay
- ✅ **Full resolution** - Shows original image quality
- ✅ **Hover effect** - Zoom icon appears on hover
- ✅ **ESC to close** - Press Escape key to close
- ✅ **Click outside** - Click background to close
- ✅ **Responsive** - Works on all screen sizes
- ✅ **Smooth animations** - Fade in/out transitions

---

## 💬 Editable Comments Usage

### Component Created:
- `EditableComment.tsx` - Comment with edit/delete functionality

### API Endpoints Created:
- `PUT /api/comments/[id]` - Update comment
- `DELETE /api/comments/[id]` - Delete comment

### How to Use:

```tsx
import { EditableComment } from '@/components/UI'

const handleUpdateComment = async (commentId: string, newContent: string) => {
  const response = await fetch(`/api/comments/${commentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ content: newContent })
  })
  
  if (!response.ok) throw new Error('Failed to update')
  
  // Refresh comments list
  await fetchComments()
}

const handleDeleteComment = async (commentId: string) => {
  const response = await fetch(`/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
  
  if (!response.ok) throw new Error('Failed to delete')
  
  // Remove from list
  setComments(prev => prev.filter(c => c.id !== commentId))
}

// Render comment
<EditableComment
  commentId={comment._id}
  userId={comment.userId}
  content={comment.content}
  createdAt={comment.created_at}
  updatedAt={comment.updated_at}
  onUpdate={handleUpdateComment}
  onDelete={handleDeleteComment}
/>
```

### Features:
- ✅ **Edit mode** - Click "Редактировать" to edit
- ✅ **Save/Cancel** - Save changes or cancel editing
- ✅ **Delete** - Delete comment with confirmation
- ✅ **Permissions** - Only owner or admin can edit/delete
- ✅ **Timestamps** - Shows "edited" timestamp
- ✅ **Error handling** - Shows error messages
- ✅ **Loading states** - Disabled during save/delete

---

## 📝 Example: Topic Page with Both Features

```tsx
'use client'

import React, { useState, useEffect } from 'react'
import { ClickableImage, EditableComment } from '@/components/UI'
import { useAuth } from '@/contexts/AuthContext'

export default function TopicPage({ topicId }: { topicId: string }) {
  const { currentUser } = useAuth()
  const [topic, setTopic] = useState(null)
  const [comments, setComments] = useState([])

  // Fetch topic and comments
  useEffect(() => {
    fetchTopicData()
  }, [topicId])

  const fetchTopicData = async () => {
    // Fetch topic with images
    const topicRes = await fetch(`/api/forum/topics/${topicId}`)
    const topicData = await topicRes.json()
    setTopic(topicData)

    // Fetch comments
    const commentsRes = await fetch(`/api/comments?contentType=forum&contentId=${topicId}`)
    const commentsData = await commentsRes.json()
    setComments(commentsData.comments)
  }

  const handleUpdateComment = async (commentId: string, newContent: string) => {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(`/api/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content: newContent })
    })

    if (!response.ok) throw new Error('Failed to update comment')
    
    await fetchTopicData()
  }

  const handleDeleteComment = async (commentId: string) => {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) throw new Error('Failed to delete comment')
    
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Topic Content */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">{topic?.title}</h1>
        
        <div className="prose max-w-none">
          <p>{topic?.content}</p>
        </div>

        {/* Images with lightbox */}
        {topic?.mediaLinks?.map((imageUrl, index) => (
          <ClickableImage
            key={index}
            src={imageUrl}
            alt={`Image ${index + 1}`}
            className="my-4"
          />
        ))}
      </div>

      {/* Comments */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Комментарии ({comments.length})</h2>
        
        {comments.map(comment => (
          <EditableComment
            key={comment._id}
            commentId={comment._id}
            userId={comment.userId}
            content={comment.content}
            createdAt={comment.created_at}
            updatedAt={comment.updated_at}
            onUpdate={handleUpdateComment}
            onDelete={handleDeleteComment}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## 🎨 Styling

### Image Lightbox:
- Black overlay (90% opacity)
- Image max 90% of viewport
- Close button in top-right
- Image info at bottom
- Smooth fade animations

### Editable Comment:
- White background with border
- Edit mode: textarea with save/cancel buttons
- View mode: content with edit/delete buttons
- Timestamps in gray
- Error messages in red

---

## 🔐 Security

### Comment Editing:
- ✅ JWT authentication required
- ✅ User can only edit own comments
- ✅ Admin can edit any comment
- ✅ Content validation (not empty)
- ✅ XSS protection (escaped content)

### Image Viewing:
- ✅ No authentication needed (read-only)
- ✅ Images served from fileserver
- ✅ Original URLs preserved

---

## 📱 Mobile Responsive

Both features work perfectly on mobile:
- **Lightbox:** Adapts to screen size, touch to close
- **Comments:** Full-width textarea, touch-friendly buttons

---

## 🚀 Next Steps

To implement in your topic view page:

1. **Import components:**
   ```tsx
   import { ClickableImage, EditableComment } from '@/components/UI'
   ```

2. **Wrap images:**
   ```tsx
   <ClickableImage src={url} alt="description" />
   ```

3. **Replace comment rendering:**
   ```tsx
   <EditableComment {...commentProps} />
   ```

4. **Add update/delete handlers** as shown in example above

---

**All features are ready to use!** 🎉

