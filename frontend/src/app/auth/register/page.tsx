"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  User,
  Building,
  Gamepad2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

type UserRole = "PLAYER" | "ORGANIZATION";

interface RoleOption {
  id: UserRole;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const roleOptions: RoleOption[] = [
  {
    id: "PLAYER",
    name: "Тоглогч",
    description: "Баг болон боломжуудыг хайж байна",
    icon: <Gamepad2 className="w-6 h-6" />,
    color: "from-blue-500 to-purple-600",
  },
  {
    id: "ORGANIZATION",
    name: "Organization",
    description: "E-sport organization",
    icon: <Building className="w-6 h-6" />,
    color: "from-orange-500 to-red-600",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const validateForm = () => {
    // Check if role is selected
    if (!selectedRole) {
      setError("Үүрэг сонгоно уу");
      return false;
    }

    // Check if name is provided
    if (!formData.name.trim()) {
      setError("Нэр оруулна уу");
      return false;
    }

    if (formData.name.trim().length < 2) {
      setError("Нэр хамгийн багадаа 2 тэмдэгт байх ёстой");
      return false;
    }

    // Check if email is provided and valid
    if (!formData.email.trim()) {
      setError("И-мэйл хаяг оруулна уу");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("И-мэйл хаяг буруу форматтай байна");
      return false;
    }

    // Check if password is provided
    if (!formData.password) {
      setError("Нууц үг оруулна уу");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
      return false;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Нууц үгнүүд таарахгүй байна");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register(
        formData.name.trim(),
        formData.email.trim(),
        formData.password,
        selectedRole!
      );

      // Redirect to home page after successful registration
      router.push("/");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Бүртгүүлэхэд алдаа гарлаа";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <motion.h1
              whileHover={{ scale: 1.05 }}
              className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent mb-2"
            >
              E-Sport Connection
            </motion.h1>
          </Link>
          <p className="text-white">
            Бүртгэлээ үүсгээд бидэнтэй нэгдээрэй
          </p>
        </div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Би бол...
              </label>
              <div className="space-y-3">
                {roleOptions.map((role) => (
                  <motion.button
                    key={role.id}
                    type="button"
                    disabled={isLoading}
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    whileTap={{ scale: isLoading ? 1 : 0.98 }}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedRole === role.id
                        ? `border-transparent bg-gradient-to-r ${role.color} text-white shadow-lg`
                        : "border-gray-700 bg-gray-800 text-white hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">{role.icon}</div>
                      <div>
                        <div className="font-semibold">{role.name}</div>
                        <div className="text-sm opacity-80">
                          {role.description}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Бүтэн Нэр
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Бүтэн нэрээ оруулна уу"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                И-мэйл Хаяг
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="И-мэйл хаягаа оруулна уу"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Нууц Үг
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="w-full pr-12 px-4 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Нууц үг үүсгэнэ үү"
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2 flex items-center space-x-2">
                  {formData.password.length >= 6 ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-xs text-gray-300">
                    Хамгийн багадаа 6 тэмдэгт
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Нууц Үг Баталгаажуулах
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="w-full pr-12 px-4 py-3 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Нууц үгээ баталгаажуулна уу"
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white disabled:opacity-50"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && (
                <div className="mt-2 flex items-center space-x-2">
                  {formData.password === formData.confirmPassword ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-gray-300">
                    {formData.password === formData.confirmPassword
                      ? "Нууц үгнүүд таарч байна"
                      : "Нууц үгнүүд таарахгүй байна"}
                  </span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm flex items-center space-x-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full relative overflow-hidden bg-gradient-to-r from-amber-500 via-fuchsia-500 to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:from-amber-400 hover:via-fuchsia-500 hover:to-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Хэрэглэгч үүсгэж байна...</span>
                </div>
              ) : (
                "Хэрэглэгч Үүсгэх"
              )}
            </motion.button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-white">
              Хэрэглэгч байгаа юу?{" "}
              <Link
                href="/auth/login"
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200"
              >
                Нэвтрэх
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
