import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Building2, UserCog, Users, ArrowRight } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const CompanySelector = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loginData, setLoginData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get login data from navigation state or sessionStorage
    const data = location.state?.loginData || JSON.parse(sessionStorage.getItem('login_data') || 'null');
    
    if (!data || !data.access_list) {
      navigate('/company-login');
      return;
    }
    
    setLoginData(data);
  }, []);

  const handleSelect = async (access) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/select-company`, {
        company_id: access.company_id,
        role: access.role,
        user_table: access.user_table,
        user_id: access.user_id
      }, {
        withCredentials: true
      });
      
      // Clear stored data
      sessionStorage.removeItem('login_data');
      
      // Redirect based on role
      if (access.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err) {
      console.error('Selection error:', err);
      toast.error(language === 'id' ? 'Gagal memilih perusahaan' : 'Failed to select company');
    } finally {
      setLoading(false);
    }
  };

  if (!loginData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div>
      </div>
    );
  }

  // Group by company
  const companiesMap = {};
  loginData.access_list.forEach(access => {
    if (!companiesMap[access.company_id]) {
      companiesMap[access.company_id] = {
        company_id: access.company_id,
        company_name: access.company_name,
        company_slug: access.company_slug,
        roles: []
      };
    }
    companiesMap[access.company_id].roles.push({
      role: access.role,
      user_table: access.user_table,
      user_id: access.user_id
    });
  });

  const companies = Object.values(companiesMap);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2E4DA7]/10 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-[#2E4DA7]" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'id' ? 'Pilih Perusahaan & Peran' : 'Select Company & Role'}
          </h1>
          <p className="text-base text-gray-600">
            {language === 'id' 
              ? `Halo ${loginData.user_name}, pilih perusahaan yang ingin Anda akses`
              : `Hello ${loginData.user_name}, choose the company you want to access`}
          </p>
        </div>

        {/* Companies Grid */}
        <div className="space-y-6">
          {companies.map((company) => (
            <Card key={company.company_id} className="border-2 hover:border-[#2E4DA7] transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {company.company_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {company.company_slug}.makar.id
                    </p>
                  </div>
                </div>

                {/* Roles */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    {language === 'id' ? 'Pilih peran:' : 'Select role:'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {company.roles.map((roleData, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="h-auto py-4 justify-start hover:bg-[#2E4DA7]/5 hover:border-[#2E4DA7]"
                        onClick={() => handleSelect({
                          company_id: company.company_id,
                          company_name: company.company_name,
                          company_slug: company.company_slug,
                          role: roleData.role,
                          user_table: roleData.user_table,
                          user_id: roleData.user_id
                        })}
                        disabled={loading}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            roleData.role === 'admin' 
                              ? 'bg-blue-100' 
                              : 'bg-emerald-100'
                          }`}>
                            {roleData.role === 'admin' ? (
                              <UserCog className={`w-5 h-5 text-blue-600`} />
                            ) : (
                              <Users className={`w-5 h-5 text-emerald-600`} />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-900">
                              {roleData.role === 'admin' 
                                ? (language === 'id' ? 'Admin Perusahaan' : 'Company Admin')
                                : (language === 'id' ? 'Karyawan' : 'Employee')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {roleData.role === 'admin' 
                                ? (language === 'id' ? 'Kelola rekrutmen & karyawan' : 'Manage recruitment & employees')
                                : (language === 'id' ? 'Akses portal karyawan' : 'Access employee portal')}
                            </p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
};
