import React from "react";
import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="glass-chip flex items-start gap-3.5 p-5 rounded-[20px] max-w-2xl mx-auto">
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-400/10 border border-amber-400/25 shrink-0">
        <AlertCircle className="w-4 h-4 text-amber-300" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">
          Unable to Load Download Options
        </p>
        <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
};

export default ErrorMessage;
