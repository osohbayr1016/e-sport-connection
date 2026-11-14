"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Store,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  Calendar,
  AlertCircle,
} from "lucide-react";
import Navigation from "../../components/Navigation";
import { useAuth } from "../../contexts/AuthContext";

interface VendorApplication {
  id: string;
  userId: string;
  storeName: string;
  description: string;
  category: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  bankAccount: string;
  taxId?: string;
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
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  logo?: string;
  banner?: string;
  businessLicense?: string;
}

export default function VendorApprovalPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<VendorApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        // TODO: Implement API call to fetch vendor applications
        // const response = await fetch('/api/vendors/applications');
        // const data = await response.json();
        // setApplications(data.applications);
        
        setApplications([]);
      } catch (error) {
        console.error("Error fetching vendor applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const filteredApplications = applications.filter(app => 
    filter === 'all' || app.status === filter
  );

  const handleApprove = async (applicationId: string) => {
    try {
      // Update application status
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'approved' as const, updatedAt: new Date().toISOString() }
            : app
        )
      );
      
      // Close modal if open
      setShowModal(false);
      setSelectedApplication(null);
      
      console.log(`Approved vendor application: ${applicationId}`);
    } catch (error) {
      console.error('Error approving application:', error);
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      // Update application status
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'rejected' as const, updatedAt: new Date().toISOString() }
            : app
        )
      );
      
      // Close modal if open
      setShowModal(false);
      setSelectedApplication(null);
      
      console.log(`Rejected vendor application: ${applicationId}`);
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'approved': return 'text-green-400 bg-green-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Хүлээгдэж буй';
      case 'approved': return 'Зөвшөөрөгдсөн';
      case 'rejected': return 'Татгалзсан';
      default: return 'Тодорхойгүй';
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Эрх байхгүй</h1>
          <p className="text-gray-300">Энэ хуудсыг үзэхийн тулд админ эрх шаардлагатай</p>
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
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
              <Store className="w-10 h-10 text-purple-400" />
              Дэлгүүрийн бүртгэл шалгах
            </h1>
            <p className="text-gray-300 text-lg">
              Дэлгүүрийн бүртгэлийн хүсэлтүүдийг шалгаж зөвшөөрөх эсвэл татгалзах
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'all', label: 'Бүгд', count: applications.length },
                { key: 'pending', label: 'Хүлээгдэж буй', count: applications.filter(app => app.status === 'pending').length },
                { key: 'approved', label: 'Зөвшөөрөгдсөн', count: applications.filter(app => app.status === 'approved').length },
                { key: 'rejected', label: 'Татгалзсан', count: applications.filter(app => app.status === 'rejected').length },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-6 py-3 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
                    filter === key
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/20 text-gray-300 hover:bg-white/30'
                  }`}
                >
                  {label}
                  <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Applications List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-300">Ачааллаж байна...</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredApplications.map((application) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {application.logo && (
                        <img
                          src={application.logo}
                          alt={application.storeName}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">
                            {application.storeName}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                            {getStatusText(application.status)}
                          </span>
                        </div>
                        <p className="text-gray-300 mb-2">{application.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {application.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {application.address}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(application.createdAt).toLocaleDateString('mn-MN')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedApplication(application);
                          setShowModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Дэлгэрэнгүй
                      </button>
                      
                      {application.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(application.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Зөвшөөрөх
                          </button>
                          <button
                            onClick={() => handleReject(application.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Татгалзах
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {filteredApplications.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Хүсэлт олдсонгүй</h3>
                  <p className="text-gray-300">
                    {filter === 'all' 
                      ? 'Одоогоор дэлгүүрийн бүртгэлийн хүсэлт байхгүй байна'
                      : `${getStatusText(filter)} статустай хүсэлт олдсонгүй`
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {selectedApplication.storeName} - Дэлгэрэнгүй мэдээлэл
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedApplication(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Үндсэн мэдээлэл</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-sm">Дэлгүүрийн нэр</label>
                    <p className="text-white">{selectedApplication.storeName}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Тайлбар</label>
                    <p className="text-white">{selectedApplication.description}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Ангилал</label>
                    <p className="text-white">{selectedApplication.category}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Вэб сайт</label>
                    <p className="text-white">{selectedApplication.website || 'Байхгүй'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Холбоо барих мэдээлэл</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-sm">Хаяг</label>
                    <p className="text-white flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedApplication.address}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Утас</label>
                    <p className="text-white flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {selectedApplication.phone}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Имэйл</label>
                    <p className="text-white flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {selectedApplication.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Холбоо барих хүн</label>
                    <p className="text-white flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedApplication.contactPerson}
                    </p>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Бизнес мэдээлэл</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-sm">Банкны данс</label>
                    <p className="text-white flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      {selectedApplication.bankAccount}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Татварын дугаар</label>
                    <p className="text-white">{selectedApplication.taxId || 'Байхгүй'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Хүргэлтийн бүс</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.deliveryAreas.map((area) => (
                        <span key={area} className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-sm">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Төлбөрийн арга</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.paymentMethods.map((method) => (
                        <span key={method} className="bg-green-600/20 text-green-300 px-2 py-1 rounded text-sm">
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Files */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Файлууд</h3>
                <div className="space-y-3">
                  {selectedApplication.logo && (
                    <div>
                      <label className="text-gray-400 text-sm">Лого</label>
                      <div className="flex items-center gap-2">
                        <img src={selectedApplication.logo} alt="Logo" className="w-12 h-12 object-cover rounded" />
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          Татах
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedApplication.banner && (
                    <div>
                      <label className="text-gray-400 text-sm">Баннер</label>
                      <div className="flex items-center gap-2">
                        <img src={selectedApplication.banner} alt="Banner" className="w-12 h-12 object-cover rounded" />
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          Татах
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedApplication.businessLicense && (
                    <div>
                      <label className="text-gray-400 text-sm">Бизнес лиценз</label>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                          <Download className="w-6 h-6 text-red-600" />
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          Татах
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {selectedApplication.status === 'pending' && (
              <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-700">
                <button
                  onClick={() => handleReject(selectedApplication.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Татгалзах
                </button>
                <button
                  onClick={() => handleApprove(selectedApplication.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Зөвшөөрөх
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
