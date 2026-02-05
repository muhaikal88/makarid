import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { 
  Building2, 
  Search, 
  ArrowRight,
  Globe,
  ChevronLeft
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CompanyLoginPortal = () => {
  const { language, setLanguage } = useLanguage();
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.domain.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCompanies(filtered);
    } else {
      setFilteredCompanies(companies);
    }
  }, [searchTerm, companies]);

  const fetchCompanies = async () => {
    try {
      // Get public list of active companies
      const response = await axios.get(`${API}/public/companies`);
      setCompanies(response.data);
      setFilteredCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = (company) => {
    // Redirect to company login page
    window.location.href = `/login/${company.slug || company.domain}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
            <Building2 className="w-8 h-8 text-[#2E4DA7]" />
            <span className="text-xl font-bold text-gray-900">Makar.id</span>
          </Link>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>{language.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('id')}>
                  🇮🇩 Bahasa Indonesia
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')}>
                  🇬🇧 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {language === 'id' ? 'Pilih Perusahaan Anda' : 'Select Your Company'}
          </h1>
          <p className="text-base text-gray-600">
            {language === 'id' 
              ? 'Pilih perusahaan Anda untuk melanjutkan ke halaman login'
              : 'Choose your company to continue to login page'}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder={language === 'id' ? 'Cari perusahaan...' : 'Search company...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Companies Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">
              {searchTerm 
                ? (language === 'id' ? 'Perusahaan tidak ditemukan' : 'Company not found')
                : (language === 'id' ? 'Belum ada perusahaan' : 'No companies yet')}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredCompanies.map((company) => (
              <Card 
                key={company.id}
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-[#2E4DA7]"
                onClick={() => handleCompanyClick(company)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-[#2E4DA7]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      {company.logo_url ? (
                        <img 
                          src={company.logo_url} 
                          alt={company.name} 
                          className="w-12 h-12 rounded object-cover" 
                        />
                      ) : (
                        <Building2 className="w-7 h-7 text-[#2E4DA7]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
                        {company.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3 truncate">
                        {company.slug}.makar.id
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {language === 'id' ? 'Klik untuk login' : 'Click to login'}
                        </span>
                        <ArrowRight className="w-4 h-4 text-[#2E4DA7]" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            {language === 'id' 
              ? 'Tidak menemukan perusahaan Anda? Hubungi administrator sistem.'
              : "Can't find your company? Contact system administrator."}
          </p>
        </div>
      </div>
    </div>
  );
};
