import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';

export const EventWaitingScreen: React.FC = () => {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 animate-fade-in text-center">
      <div className="neu-card p-8 rounded-3xl flex flex-col items-center">
        <CheckCircle className="w-16 h-16 text-rose-500 mb-6" />
        
        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">SUBMISSION RECEIVED</h2>
        <p className="text-slate-200 font-medium mb-2">
          Your submission has been recorded successfully.
        </p>
        <p className="text-slate-400 text-sm italic mb-10">
          Manual verification may be carried out by the organizing team.
        </p>

        <div className="w-full h-px bg-white/10 mb-10"></div>

        <Clock className="w-12 h-12 text-slate-400 mb-6 opacity-50" />
        <h2 className="text-xl font-black text-slate-300 mb-4 tracking-widest uppercase">WAITING FOR THE NEXT ROUND</h2>
        <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
          The next round will begin soon. Please wait for further instructions from the organizing team.
        </p>
      </div>
    </div>
  );
};
