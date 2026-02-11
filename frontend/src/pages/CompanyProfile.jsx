import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Building2, MapPin, Phone, Mail, Globe, 
  Briefcase, ArrowRight, Users, Target, Eye,
  Facebook, Instagram, Linkedin, Twitter
} from 'lucide-react';
import { useDomain } from '../contexts/DomainContext';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const CompanyProfile = ({ domainOverride }) => {
  const { domain: paramDomain } = useParams();
  const domain = domainOverride || paramDomain;
  const { language } = useLanguage();
  const { isCustomDomain } = useDomain();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompanyProfile();
  }, [domain]);

  const fetchCompanyProfile = async () => {
    try {
      const response = await axios.get(`${API}/public/company/${domain}`);
      setCompany(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Company not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Company Not Found</h1>
          <p className="text-gray-500 mb-4">{error}</p>
          <Link to="/">
            <Button className="bg-[#2E4DA7]">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const socialIcons = {
    facebook: Facebook,
    instagram: Instagram,
    linkedin: Linkedin,
    twitter: Twitter
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Cover */}
      <div 
        className="relative h-80 bg-gradient-to-br from-[#2E4DA7] to-[#1e3a8a]"
        style={company.cover_image ? {
          backgroundImage: `url(${company.cover_image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        <div className="absolute inset-0 bg-[#2E4DA7]/80"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-6xl mx-auto flex items-end gap-6">
            {/* Logo */}
            <div className="w-32 h-32 bg-white rounded-xl shadow-lg flex items-center justify-center p-3 -mb-16 relative z-10">
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-16 h-16 text-[#2E4DA7]" />
              )}
            </div>
            <div className="text-white pb-4">
              <h1 className="text-3xl font-bold font-['Manrope']">{company.name}</h1>
              {company.tagline && (
                <p className="text-white/80 text-lg mt-1">{company.tagline}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex items-center justify-between h-16 pt-8">
            <div className="flex gap-6">
              <a href="#about" className="text-gray-600 hover:text-[#2E4DA7] font-medium">
                {language === 'id' ? 'Tentang' : 'About'}
              </a>
              {company.vision && (
                <a href="#vision" className="text-gray-600 hover:text-[#2E4DA7] font-medium">
                  {language === 'id' ? 'Visi & Misi' : 'Vision & Mission'}
                </a>
              )}
              {company.culture && (
                <a href="#culture" className="text-gray-600 hover:text-[#2E4DA7] font-medium">
                  {language === 'id' ? 'Budaya' : 'Culture'}
                </a>
              )}
            </div>
            <Link to={isCustomDomain ? '/careers' : `/careers/${domain}`}>
              <Button className="bg-[#E31E24] hover:bg-[#E31E24]/90">
                <Briefcase className="w-4 h-4 mr-2" />
                {language === 'id' ? 'Lihat Lowongan' : 'View Jobs'}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* About */}
            <section id="about">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 font-['Manrope']">
                {language === 'id' ? 'Tentang Kami' : 'About Us'}
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {company.description || (language === 'id' ? 'Informasi perusahaan akan segera tersedia.' : 'Company information coming soon.')}
              </p>
            </section>

            {/* History */}
            {company.history && (
              <section id="history">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 font-['Manrope']">
                  {language === 'id' ? 'Sejarah' : 'Our History'}
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{company.history}</p>
              </section>
            )}

            {/* Vision & Mission */}
            {(company.vision || company.mission) && (
              <section id="vision" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {company.vision && (
                  <div className="bg-[#2E4DA7]/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[#2E4DA7] rounded-lg">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {language === 'id' ? 'Visi' : 'Vision'}
                      </h3>
                    </div>
                    <p className="text-gray-600">{company.vision}</p>
                  </div>
                )}
                {company.mission && (
                  <div className="bg-[#E31E24]/5 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[#E31E24] rounded-lg">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {language === 'id' ? 'Misi' : 'Mission'}
                      </h3>
                    </div>
                    <p className="text-gray-600">{company.mission}</p>
                  </div>
                )}
              </section>
            )}

            {/* Culture */}
            {company.culture && (
              <section id="culture">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 font-['Manrope']">
                  {language === 'id' ? 'Budaya Perusahaan' : 'Our Culture'}
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{company.culture}</p>
              </section>
            )}

            {/* Benefits */}
            {company.benefits && company.benefits.length > 0 && (
              <section id="benefits">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 font-['Manrope']">
                  {language === 'id' ? 'Benefit Karyawan' : 'Employee Benefits'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {company.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                      <div className="w-2 h-2 bg-[#2E4DA7] rounded-full"></div>
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Gallery */}
            {company.gallery_images && company.gallery_images.length > 0 && (
              <section id="gallery">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 font-['Manrope']">
                  {language === 'id' ? 'Galeri' : 'Gallery'}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {company.gallery_images.map((img, index) => (
                    <img 
                      key={index} 
                      src={img} 
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-800 mb-4">
                {language === 'id' ? 'Informasi Kontak' : 'Contact Information'}
              </h3>
              <div className="space-y-4">
                {company.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#2E4DA7] mt-0.5" />
                    <span className="text-gray-600 text-sm">{company.address}</span>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-[#2E4DA7]" />
                    <span className="text-gray-600 text-sm">{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#2E4DA7]" />
                    <span className="text-gray-600 text-sm">{company.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[#2E4DA7]" />
                  <span className="text-gray-600 text-sm">{company.domain}</span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            {company.social_links && Object.keys(company.social_links).length > 0 && (
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4">
                  {language === 'id' ? 'Media Sosial' : 'Social Media'}
                </h3>
                <div className="flex gap-3">
                  {Object.entries(company.social_links).map(([platform, url]) => {
                    const Icon = socialIcons[platform] || Globe;
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 bg-white rounded-lg hover:bg-[#2E4DA7] hover:text-white transition-colors"
                      >
                        <Icon className="w-5 h-5" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="bg-[#2E4DA7] rounded-xl p-6 text-white text-center">
              <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-80" />
              <h3 className="font-bold text-lg mb-2">
                {language === 'id' ? 'Bergabung dengan Kami?' : 'Join Our Team?'}
              </h3>
              <p className="text-white/80 text-sm mb-4">
                {language === 'id' 
                  ? 'Lihat posisi yang tersedia dan mulai karir Anda bersama kami'
                  : 'Check available positions and start your career with us'}
              </p>
              <Link to={isCustomDomain ? '/careers' : `/careers/${domain}`}>
                <Button className="w-full bg-white text-[#2E4DA7] hover:bg-white/90">
                  {language === 'id' ? 'Lihat Lowongan' : 'View Jobs'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-8 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} {company.name}. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Powered by Makar.id
          </p>
        </div>
      </footer>
    </div>
  );
};
