"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Store,
  Upload,
  MapPin,
  Phone,
  Mail,
  User,
  Building,
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle,
  Camera,
  X,
  Plus,
  Save,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";

interface VendorFormData {
  storeName: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: File | null;
  banner: File | null;
  businessLicense: File | null;
  bankAccount: string;
  taxId: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  businessHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  deliveryAreas: string[];
  paymentMethods: string[];
}

const categories = [
  "Гейминг хэрэгсэл",
  "Компьютер",
  "Хувцас",
  "Аксессуар",
  "Цахилгаан бараа",
  "Спорт бараа",
  "Цэцэг",
  "Хүүхдийн бараа",
  "Гэр ахуйн бараа",
  "Бусад",
];

const paymentMethods = [
  "Банкны карт",
  "QPay",
  "SocialPay",
  "Бэлнээр",
  "Банкны шилжүүлэг",
];

const deliveryAreas = [
  "Улаанбаатар",
  "Дархан",
  "Эрдэнэт",
  "Чойбалсан",
  "Мөрөн",
  "Ховд",
  "Увс",
  "Хөвсгөл",
  "Архангай",
  "Бусад",
];

export default function VendorRegistrationPage() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<VendorFormData>({
    storeName: "",
    description: "",
    category: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo: null,
    banner: null,
    businessLicense: null,
    bankAccount: "",
    taxId: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    socialMedia: {
      facebook: "",
      instagram: "",
      twitter: "",
    },
    businessHours: {
      monday: "09:00-18:00",
      tuesday: "09:00-18:00",
      wednesday: "09:00-18:00",
      thursday: "09:00-18:00",
      friday: "09:00-18:00",
      saturday: "10:00-16:00",
      sunday: "Амрах",
    },
    deliveryAreas: [],
    paymentMethods: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { number: 1, title: "Үндсэн мэдээлэл", icon: Store },
    { number: 2, title: "Бизнес мэдээлэл", icon: Building },
    { number: 3, title: "Холбоо барих", icon: Phone },
    { number: 4, title: "Зураг болон баримт", icon: Upload },
    { number: 5, title: "Үйлчилгээний мэдээлэл", icon: Shield },
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.storeName.trim()) newErrors.storeName = "Дэлгүүрийн нэр заавал оруулна уу";
        if (formData.storeName.trim().length < 3) newErrors.storeName = "Дэлгүүрийн нэр хамгийн багадаа 3 тэмдэгт байх ёстой";
        if (!formData.description.trim()) newErrors.description = "Тайлбар заавал оруулна уу";
        if (formData.description.trim().length < 20) newErrors.description = "Тайлбар хамгийн багадаа 20 тэмдэгт байх ёстой";
        if (!formData.category) newErrors.category = "Ангилал сонгоно уу";
        if (formData.website && !isValidUrl(formData.website)) newErrors.website = "Зөв вэб сайтын хаяг оруулна уу";
        break;
      case 2:
        if (!formData.address.trim()) newErrors.address = "Хаяг заавал оруулна уу";
        if (formData.address.trim().length < 10) newErrors.address = "Хаяг хамгийн багадаа 10 тэмдэгт байх ёстой";
        if (!formData.phone.trim()) newErrors.phone = "Утасны дугаар заавал оруулна уу";
        if (!isValidPhone(formData.phone)) newErrors.phone = "Зөв утасны дугаар оруулна уу (99112233)";
        if (!formData.email.trim()) newErrors.email = "Имэйл заавал оруулна уу";
        if (!isValidEmail(formData.email)) newErrors.email = "Зөв имэйл хаяг оруулна уу";
        if (!formData.bankAccount.trim()) newErrors.bankAccount = "Банкны данс заавал оруулна уу";
        if (formData.bankAccount.trim().length < 8) newErrors.bankAccount = "Банкны дансны дугаар хамгийн багадаа 8 тэмдэгт байх ёстой";
        break;
      case 3:
        if (!formData.contactPerson.trim()) newErrors.contactPerson = "Холбоо барих хүний нэр заавал оруулна уу";
        if (formData.contactPerson.trim().length < 2) newErrors.contactPerson = "Холбоо барих хүний нэр хамгийн багадаа 2 тэмдэгт байх ёстой";
        if (!formData.contactPhone.trim()) newErrors.contactPhone = "Холбоо барих утас заавал оруулна уу";
        if (!isValidPhone(formData.contactPhone)) newErrors.contactPhone = "Зөв утасны дугаар оруулна уу (99112233)";
        if (!formData.contactEmail.trim()) newErrors.contactEmail = "Холбоо барих имэйл заавал оруулна уу";
        if (!isValidEmail(formData.contactEmail)) newErrors.contactEmail = "Зөв имэйл хаяг оруулна уу";
        break;
      case 4:
        if (!formData.logo) newErrors.logo = "Лого зураг заавал оруулна уу";
        if (formData.logo && !isValidImageFile(formData.logo)) newErrors.logo = "Зөвхөн зураг файл оруулна уу (JPG, PNG, GIF)";
        if (formData.banner && !isValidImageFile(formData.banner)) newErrors.banner = "Зөвхөн зураг файл оруулна уу (JPG, PNG, GIF)";
        if (!formData.businessLicense) newErrors.businessLicense = "Бизнес лиценз заавал оруулна уу";
        if (formData.businessLicense && !isValidDocumentFile(formData.businessLicense)) newErrors.businessLicense = "Зөвхөн PDF эсвэл зураг файл оруулна уу";
        break;
      case 5:
        if (!formData.bankAccount.trim()) newErrors.bankAccount = "Банкны данс заавал оруулна уу";
        if (formData.deliveryAreas.length === 0) newErrors.deliveryAreas = "Хүргэлтийн бүс заавал сонгоно уу";
        if (formData.paymentMethods.length === 0) newErrors.paymentMethods = "Төлбөрийн арга заавал сонгоно уу";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation helper functions
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    return validTypes.includes(file.type);
  };

  const isValidDocumentFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    return validTypes.includes(file.type);
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      // Prepare form data for submission
      const submitData = new FormData();
      
      // Add all form fields
      submitData.append('storeName', formData.storeName);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('address', formData.address);
      submitData.append('phone', formData.phone);
      submitData.append('email', formData.email);
      submitData.append('website', formData.website || '');
      submitData.append('bankAccount', formData.bankAccount);
      submitData.append('taxId', formData.taxId || '');
      submitData.append('contactPerson', formData.contactPerson);
      submitData.append('contactPhone', formData.contactPhone);
      submitData.append('contactEmail', formData.contactEmail);
      submitData.append('socialMedia', JSON.stringify(formData.socialMedia));
      submitData.append('businessHours', JSON.stringify(formData.businessHours));
      submitData.append('deliveryAreas', JSON.stringify(formData.deliveryAreas));
      submitData.append('paymentMethods', JSON.stringify(formData.paymentMethods));
      submitData.append('userId', user?.id || '');
      
      // Add files
      if (formData.logo) submitData.append('logo', formData.logo);
      if (formData.banner) submitData.append('banner', formData.banner);
      if (formData.businessLicense) submitData.append('businessLicense', formData.businessLicense);

      console.log("Submitting vendor registration:", formData);
      
      // Submit to backend
      const response = await fetch('/api/vendors/register', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Алдаа гарлаа');
      }

      const result = await response.json();
      
      // Redirect to success page
      window.location.href = '/shopping/vendor-onboarding-success';
      
    } catch (error) {
      console.error("Error submitting vendor registration:", error);
      alert(`Алдаа гарлаа: ${error instanceof Error ? error.message : 'Дахин оролдоно уу.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (field: keyof VendorFormData, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleArrayToggle = (field: "deliveryAreas" | "paymentMethods", value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Дэлгүүрийн нэр *
              </label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
                className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Жишээ: Gaming Pro Store"
              />
              {errors.storeName && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.storeName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Тайлбар *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Дэлгүүрийн талаар дэлгэрэнгүй тайлбар бичнэ үү..."
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Ангилал *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="" className="bg-gray-800">Ангилал сонгох</option>
                {categories.map((category) => (
                  <option key={category} value={category} className="bg-gray-800">
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Вэб сайт
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://example.com"
              />
              {errors.website && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.website}
                </p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Хаяг *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-white/10 text-white px-12 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Бүрэн хаяг оруулна уу"
                />
              </div>
              {errors.address && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Утасны дугаар *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-white/10 text-white px-12 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="99112233"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Имэйл *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-white/10 text-white px-12 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="example@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Банкны данс *
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankAccount: e.target.value }))}
                    className="w-full bg-white/10 text-white px-12 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Банкны дансны дугаар"
                  />
                </div>
                {errors.bankAccount && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.bankAccount}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Татварын дугаар
                </label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                  className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Татварын дугаар"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Холбоо барих мэдээлэл</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Холбоо барих хүний нэр *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    className="w-full bg-white/10 text-white px-12 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Холбоо барих хүний нэр"
                  />
                </div>
                {errors.contactPerson && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.contactPerson}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Холбоо барих утас *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    className="w-full bg-white/10 text-white px-12 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="99112233"
                  />
                </div>
                {errors.contactPhone && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.contactPhone}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Холбоо барих имэйл *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className="w-full bg-white/10 text-white px-12 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="contact@example.com"
                />
              </div>
              {errors.contactEmail && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.contactEmail}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-4">
                Сошиал медиа
              </label>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="url"
                    value={formData.socialMedia.facebook}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      socialMedia: { ...prev.socialMedia, facebook: e.target.value }
                    }))}
                    className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Facebook хуудасны холбоос"
                  />
                </div>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.socialMedia.instagram}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                    }))}
                    className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Instagram хуудасны холбоос"
                  />
                </div>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.socialMedia.twitter}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      socialMedia: { ...prev.socialMedia, twitter: e.target.value }
                    }))}
                    className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Twitter хуудасны холбоос"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Зураг болон баримт</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Лого зураг *
                </label>
                <div className="border-2 border-dashed border-white/30 rounded-xl p-6 text-center">
                  {formData.logo ? (
                    <div className="space-y-2">
                      <img
                        src={URL.createObjectURL(formData.logo)}
                        alt="Logo preview"
                        className="w-20 h-20 object-cover rounded-lg mx-auto"
                      />
                      <p className="text-gray-300 text-sm">{formData.logo.name}</p>
                      <button
                        onClick={() => handleFileUpload("logo", null)}
                        className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 mx-auto"
                      >
                        <X className="w-4 h-4" />
                        Устгах
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-gray-300 text-sm">Лого зураг оруулах</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload("logo", e.target.files?.[0] || null)}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg cursor-pointer text-sm"
                      >
                        Файл сонгох
                      </label>
                    </div>
                  )}
                </div>
                {errors.logo && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.logo}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Баннер зураг
                </label>
                <div className="border-2 border-dashed border-white/30 rounded-xl p-6 text-center">
                  {formData.banner ? (
                    <div className="space-y-2">
                      <img
                        src={URL.createObjectURL(formData.banner)}
                        alt="Banner preview"
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <p className="text-gray-300 text-sm">{formData.banner.name}</p>
                      <button
                        onClick={() => handleFileUpload("banner", null)}
                        className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 mx-auto"
                      >
                        <X className="w-4 h-4" />
                        Устгах
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-gray-300 text-sm">Баннер зураг оруулах</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload("banner", e.target.files?.[0] || null)}
                        className="hidden"
                        id="banner-upload"
                      />
                      <label
                        htmlFor="banner-upload"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg cursor-pointer text-sm"
                      >
                        Файл сонгох
                      </label>
                    </div>
                  )}
                </div>
                {errors.banner && (
                  <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.banner}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Бизнес лиценз *
              </label>
              <div className="border-2 border-dashed border-white/30 rounded-xl p-6 text-center">
                {formData.businessLicense ? (
                  <div className="space-y-2">
                    <div className="w-16 h-16 bg-green-100 rounded-lg mx-auto flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-gray-300 text-sm">{formData.businessLicense.name}</p>
                    <button
                      onClick={() => handleFileUpload("businessLicense", null)}
                      className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 mx-auto"
                    >
                      <X className="w-4 h-4" />
                      Устгах
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-gray-300 text-sm">Бизнес лиценз оруулах</p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload("businessLicense", e.target.files?.[0] || null)}
                      className="hidden"
                      id="license-upload"
                    />
                    <label
                      htmlFor="license-upload"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg cursor-pointer text-sm"
                    >
                      Файл сонгох
                    </label>
                  </div>
                )}
              </div>
              {errors.businessLicense && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.businessLicense}
                </p>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">Үйлчилгээний мэдээлэл</h3>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-4">
                Хүргэлтийн бүс *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {deliveryAreas.map((area) => (
                  <label key={area} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.deliveryAreas.includes(area)}
                      onChange={() => handleArrayToggle("deliveryAreas", area)}
                      className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                    />
                    <span className="text-gray-300 text-sm">{area}</span>
                  </label>
                ))}
              </div>
              {errors.deliveryAreas && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.deliveryAreas}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-4">
                Төлбөрийн арга *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <label key={method} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.paymentMethods.includes(method)}
                      onChange={() => handleArrayToggle("paymentMethods", method)}
                      className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                    />
                    <span className="text-gray-300 text-sm">{method}</span>
                  </label>
                ))}
              </div>
              {errors.paymentMethods && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.paymentMethods}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-4">
                Ажлын цаг
              </label>
              <div className="space-y-3">
                {Object.entries(formData.businessHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm capitalize w-24">
                      {day === "monday" && "Даваа"}
                      {day === "tuesday" && "Мягмар"}
                      {day === "wednesday" && "Лхагва"}
                      {day === "thursday" && "Пүрэв"}
                      {day === "friday" && "Баасан"}
                      {day === "saturday" && "Бямба"}
                      {day === "sunday" && "Ням"}
                    </span>
                    <input
                      type="text"
                      value={hours}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        businessHours: { ...prev.businessHours, [day]: e.target.value }
                      }))}
                      className="bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 w-32"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Нэвтрэх шаардлагатай</h1>
          <p className="text-gray-300 mb-6">Дэлгүүр бүртгэхийн тулд эхлээд нэвтэрнэ үү</p>
          <Link href="/auth/login">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg">
              Нэвтрэх
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            {/* Go Back Button */}
            <div className="mb-6">
              <Link href="/shopping">
                <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200">
                  <ArrowLeft className="w-5 h-5" />
                  <span>Дэлгүүрүүд рүү буцах</span>
                </button>
              </Link>
            </div>
            
            {/* Title */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                <Store className="w-10 h-10 text-purple-400" />
                Дэлгүүр бүртгэх
              </h1>
              <p className="text-gray-300 text-lg">
                Манай платформ дээр өөрийн дэлгүүрийг нээж бараа зарах
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                
                return (
                  <div key={step.number} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted 
                          ? "bg-green-500 text-white" 
                          : isActive 
                          ? "bg-purple-600 text-white" 
                          : "bg-white/20 text-gray-400"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </div>
                      <span className={`text-sm mt-2 ${
                        isActive ? "text-white font-semibold" : "text-gray-400"
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-16 h-0.5 mx-4 ${
                        isCompleted ? "bg-green-500" : "bg-white/20"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg transition-colors duration-200 ${
                  currentStep === 1
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                Өмнөх
              </button>

              {currentStep < steps.length ? (
                <button
                  onClick={handleNext}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  Дараах
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Бүртгэж байна...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Бүртгэх
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
