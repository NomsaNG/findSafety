'use client';

interface Post {
  id: string;
  author: string;
  date: string;
  tags?: string[];
  title: string;
  details: string;
}

import { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, addDoc, onSnapshot } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function CommunityPage() {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [posts, setPosts] = useState<Post[]>([]); // Typed with Post interface
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'community-posts'), (snapshot) => {
      try {
        const postData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Post));
        setPosts(postData);
      } catch (error) {
        console.error('Error updating posts:', error);
        setError('Failed to update community posts. Please try again later.');
      }
    }, (error) => {
      console.error('Snapshot error:', error);
      setError('Failed to connect to community posts. Please check your connection.');
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !details.trim()) {
      alert('Please fill in both title and details.');
      return;
    }
    try {
      await addDoc(collection(db, 'community-posts'), {
        title,
        details,
        author: 'Anonymous',
        date: new Date().toISOString(),
        tags: ['burglary', 'suspicious-activity', 'neighborhood-watch'],
      });
      setTitle('');
      setDetails('');
      alert('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post.');
    }
  };

  const handleShare = (post: Post) => {
    const shareUrl = window.location.origin + '/dashboard/community';
    const shareText = `${post.title}\n${post.details}\nCheck it out: ${shareUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: shareText,
        url: shareUrl,
      }).catch(error => console.error('Error sharing:', error));
    } else {
      const encodedText = encodeURIComponent(shareText);
      const platformChoices = [
        { name: 'WhatsApp', url: `whatsapp://send?text=${encodedText}` },
        { name: 'Twitter/X', url: `https://twitter.com/intent/tweet?text=${encodedText}` },
        { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
        { name: 'LinkedIn', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
      ];

      platformChoices.forEach(platform => {
        if (confirm(`Share on ${platform.name}?`)) {
          window.open(platform.url, '_blank');
        }
      });
    }
  };

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center bg-background text-foreground text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-[--primary] text-[--primary-foreground] text-center py-6">
        <h1 className="text-3xl font-bold">Community Safety Hub</h1>
        <p className="mt-2">Connect with neighbors, share safety concerns, and work together to make your community safer</p>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-4 flex flex-col lg:flex-row gap-6">
        {/* Post Creation Form */}
        <div className="w-full lg:w-2/3 bg-card p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-4 text-[--primary]">Create a Post</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full p-2 border border-[--border] rounded bg-[--input] text-foreground"
              required
            />
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe what you've observed..."
              className="w-full p-2 border border-[--border] rounded bg-[--input] text-foreground h-32"
              required
            />
            <button
              type="submit"
              className="w-full p-2 bg-[--primary] text-[--primary-foreground] border border-[--border] rounded-none hover:bg-[--primary]/90"
            >
              Post to Community
            </button>
          </form>
        </div>

        {/* Local Safety Resources Sidebar */}
        <aside className="w-full lg:w-1/3 bg-card p-4 rounded shadow">
          <h2 className="text-xl font-bold mb-4 text-[--primary]">Local Safety Resources</h2>
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className="text-[--destructive] mr-2">⭕</span>
              <a href="#" className="text-[--destructive] hover:underline">Police Department Contacts</a>
            </li>
            <li className="flex items-center">
              <span className="text-[--alert-green] mr-2">📞</span>
              <a href="#" className="text-[--alert-green] hover:underline">Emergency Numbers</a>
            </li>
            <li className="flex items-center">
              <span className="text-[--alert-yellow] mr-2">📊</span>
              <a href="#" className="text-[--alert-yellow] hover:underline">Crime Statistics</a>
            </li>
          </ul>
        </aside>
      </div>

      {/* Recent Community Posts */}
      <div className="container mx-auto p-4 mt-6">
        <h2 className="text-xl font-bold mb-4 text-[--alert-green]">Recent Community Posts</h2>
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-[--muted] p-4 rounded-lg shadow border border-[--border]">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[--border] rounded-full mr-2"></div> {/* Profile picture placeholder */}
                  <div>
                    <p className="font-semibold">{post.author}</p>
                    <p className="text-sm text-[--muted-foreground]">3 hours ago - {post.tags?.join(', ') || ''}</p>
                  </div>
                </div>
                <span className="text-[--alert-green] text-sm">4 Supports</span> {/* Placeholder support count */}
              </div>
              <h3 className="mt-2 text-lg font-medium text-[--primary]">{post.title}</h3>
              <p className="text-[--muted-foreground] mt-1">{post.details}</p>
              <div className="flex items-center mt-4 space-x-4 text-sm text-[--muted-foreground]">
                <button className="hover:underline">12 Comments</button>
                <button className="hover:underline">Supports</button>
                <button
                  className="hover:underline"
                  onClick={() => handleShare(post)}
                >
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}