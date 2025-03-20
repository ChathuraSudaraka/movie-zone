import { useState, FormEvent } from "react";
import { Send, Mail, User, Loader2, MessageSquare } from "lucide-react";
import { supabase } from "../../config/supabase";
import toast from "react-hot-toast";

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      // Try to send the email directly via the mail-sender edge function
      try {
        await supabase.functions.invoke("mail-sender", {
          method: "POST",
          body: {
            to: "chathurasudaraka@eversoft.lk",
            subject: `Contact Form: ${formData.subject}`,
            template:
              "https://yqggxjuqaplmklqpcwsx.supabase.co/storage/v1/object/public/email-template/ContactFormTemplate.html",
            data: {
              name: formData.name,
              email: formData.email,
              subject: formData.subject,
              message: formData.message,
            },
          },
        });

        setStatus("success");
        toast.success("Message sent successfully!");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        throw new Error("Failed to send message. Please try again later.");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Sorry, we couldn't send your message right now. Please try again later."
      );
      toast.error("Failed to send message");
    } finally {
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
        <MessageSquare className="w-6 h-6 text-red-500" />
        <h2 className="text-xl font-semibold text-white">Contact Us</h2>
      </div>

      <div>
        <p className="text-gray-400 mb-6">
          Have a question or feedback? We'd love to hear from you. Fill out the
          form below and we'll get back to you as soon as possible.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
                  placeholder="Your name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
              placeholder="Message subject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message
            </label>
            <textarea
              required
              value={formData.message}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, message: e.target.value }))
              }
              rows={5}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
              placeholder="Your message..."
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Message
                </>
              )}
            </button>
          </div>

          {status === "success" && (
            <div className="p-4 bg-green-500/10 border border-green-500 text-green-500 rounded-md">
              Message sent successfully!
            </div>
          )}

          {status === "error" && (
            <div className="p-4 bg-red-500/10 border border-red-500 text-red-500 rounded-md">
              {errorMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
