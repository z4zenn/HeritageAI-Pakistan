import React from 'react';
import ReactDOM from 'react-dom';
import { LogOut } from 'lucide-react';

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-[2px] p-4 select-none">
      <div className="w-full max-w-[400px] bg-[#23282D] border border-[#3D494F] rounded-xl p-8 shadow-2xl relative text-center">
        
        {/* Content */}
        <div className="flex flex-col items-center">
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-[#1D9E75]/10 flex items-center justify-center mb-4 text-[#1D9E75]">
            <LogOut className="w-6 h-6" />
          </div>

          {/* Heading */}
          <h3 className="font-serif font-bold text-xl text-[#EDE9DF]">
            Sign Out?
          </h3>

          {/* Subtext */}
          <p className="font-sans text-sm text-[#C8B89A] mt-2 leading-relaxed">
            Are you sure you want to sign out of HeritageAI?
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-[#3D494F] text-[#C8B89A] hover:bg-[#3D494F]/30 font-sans text-sm font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-[#E05252] text-white hover:bg-[#c93e3e] font-sans text-sm font-medium transition-colors cursor-pointer shadow-md"
          >
            Sign Out
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
