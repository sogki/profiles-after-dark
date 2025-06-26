import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Hero from "./components/Hero";
import FilterBar from "./components/FilterBar";
import Gallery from "./components/Gallery";
import UploadModal from "./components/UploadModal";
import AuthModal from "./components/AuthModal";
import Footer from "./components/Footer";
import DiscordCTA from "./components/DiscordCTA";
import ProfileSettings from "./components/users/ProfileSettings";
import UsersList from './components/users/UserList';
import UserProfile from './components/users/UserProfile';

import PfpGallery from "./components/gallery/PfpGallery";
import BannersGallery from "./components/gallery/BannersGallery";
import EmotesGallery from "./components/gallery/EmotesGallery";
import EmojiCombosGallery from "./components/gallery/EmojiCombosGallery";

import ModerationPanel from "./components/users/moderation/ModerationPanel";
import ModerationLogs from "./components/users/moderation/ModerationLogs"; 

import { useAuth } from "./context/authContext";
import { Toaster } from "react-hot-toast";

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { user, loading } = useAuth();

  const handleUploadClick = () => {
    if (user) {
      setIsUploadModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

        <Header
          onUploadClick={handleUploadClick}
          onAuthClick={() => setIsAuthModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          user={user}
        />

        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero />

                <FilterBar
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  selectedType={selectedType}
                  onTypeChange={setSelectedType}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  totalItems={0}
                />

                <Gallery
                  searchQuery={searchQuery}
                  selectedCategory={selectedCategory}
                  selectedType={selectedType}
                  viewMode={viewMode}
                />

                <DiscordCTA />

                <Footer />
              </>
            }
          />

          <Route path="/profile-settings" element={<ProfileSettings />} />

          {/* User routes */}
          <Route path="/users" element={<UsersList />} />
          <Route path="/user/:username" element={<UserProfile />} />

          {/* Moderation route */}
          <Route path="/moderation" element={<ModerationPanel />} />
          <Route path="/moderation/logs" element={<ModerationLogs />} />

          {/* Gallery routes */}
          <Route path="/gallery/pfps" element={<PfpGallery />} />
          <Route path="/gallery/banners" element={<BannersGallery />} />
          <Route path="/gallery/emotes" element={<EmotesGallery />} />
          <Route path="/gallery/emoji-combos" element={<EmojiCombosGallery />} />
        </Routes>

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
