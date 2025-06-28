import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Github, Twitter, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Profiles After Dark</h3>
                <p className="text-sm text-slate-400">Aesthetic profiles for the night owls</p>
              </div>
            </div>
            <p className="text-slate-400 mb-6 max-w-md">
              The ultimate destination for stunning profile pictures and banners. 
              Join the community who've discovered their perfect aesthetic.
            </p>
            {/* Socials (optional)
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-purple-400 transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
            */}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/users" className="text-slate-400 hover:text-white transition-colors">Members</Link></li>
              <li><Link to="/gallery/pfps" className="text-slate-400 hover:text-white transition-colors">Profile Pictures</Link></li>
              <li><Link to="/gallery/banners" className="text-slate-400 hover:text-white transition-colors">Profile Banners</Link></li>
              <li><Link to="/profile-settings" className="text-slate-400 hover:text-white transition-colors">Account Settings</Link></li>
              {/* <li><Link to="/report-content" className="text-slate-400 hover:text-white transition-colors">Report Content</Link></li> */}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Your Account</h4>
            <ul className="space-y-2">
              <li><Link to="/profile-settings" className="text-slate-400 hover:text-white transition-colors">Account Settings</Link></li>
              {/* <li><Link to="/about-your-data" className="text-slate-400 hover:text-white transition-colors">Regarding Data</Link></li> */}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-slate-400 hover:text-white transition-colors">Terms</Link></li>
              <li><Link to="/policies" className="text-slate-400 hover:text-white transition-colors">Policies</Link></li>
              <li><Link to="/guidelines" className="text-slate-400 hover:text-white transition-colors">Guidelines</Link></li>
              <li><Link to="/report-content" className="text-slate-400 hover:text-white transition-colors">Report Content</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            © 2025 Profiles After Dark. All rights reserved.
          </p>
          <div className="flex items-center space-x-1 text-slate-400 text-sm mt-4 sm:mt-0">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-white" />
            <span>by Soggs</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
