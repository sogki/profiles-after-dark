import React from "react";
import { Stars, Download, Users, Image, Moon } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-black via-blue-900/20 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-1 h-1 bg-white rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse delay-700"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="">
                <img
                  src="https://zzywottwfffyddnorein.supabase.co/storage/v1/object/public/static-assets//profiles-after-dark-logomark.png"
                  alt=""
                  className="h-15"
                />
              </div>
              <Stars className="absolute -top-1 -left-7 h-20 w-20 text-yellow-500" />
            </div>
          </div>

          <p className="text-m text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover and download stunning aesthetic profile pictures and
            banners for all your favourite social media. Join the night owls who
            know that the best profiles come alive after dark.
          </p>

          <div className="flex flex-wrap justify-center gap-6 mb-16">
            <div className="flex items-center space-x-3 bg-slate-800/50 backdrop-blur-sm rounded-lg px-6 py-3 border border-slate-700/50">
              <Image className="h-5 w-5 text-blue-500" />
              <span className="text-white font-medium">
                Profiles that express your style
              </span>
            </div>
            <div className="flex items-center space-x-3 bg-slate-800/50 backdrop-blur-sm rounded-lg px-6 py-3 border border-slate-700/50">
              <Download className="h-5 w-5 text-blue-500" />
              <span className="text-white font-medium">
                Downloads empowering your creativity
              </span>
            </div>
            <div className="flex items-center space-x-3 bg-slate-800/50 backdrop-blur-sm rounded-lg px-6 py-3 border border-slate-700/50">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-white font-medium">
                A vibrant community of creators
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
