import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Building2, MapPin, Briefcase, Clock, Search,
  ArrowRight, ChevronRight, DollarSign, Users
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

const jobTypeLabels = {
  full_time: { en: 'Full Time', id: 'Penuh Waktu' },
  part_time: { en: 'Part Time', id: 'Paruh Waktu' },
  contract: { en: 'Contract', id: 'Kontrak' },
  internship: { en: 'Internship', id: 'Magang' }
};

export const Careers = () => {
  const { domain } = useParams();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchJobs();
  }, [domain]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API}/public/careers/${domain}/jobs`);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Company not found');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = data?.jobs?.filter(job => {
    const matchSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (job.department && job.department.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = filterType === 'all' || job.job_type === filterType;
    return matchSearch && matchType;
  }) || [];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return language === 'id' ? 'Hari ini' : 'Today';
    if (diffDays <= 7) return language === 'id' ? `${diffDays} hari lalu` : `${diffDays} days ago`;
    if (diffDays <= 30) return language === 'id' ? `${Math.floor(diffDays/7)} minggu lalu` : `${Math.floor(diffDays/7)} weeks ago`;
    return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { 
      day: 'numeric', month: 'short', year: 'numeric' 
    });
  };

  const formatSalary = (min, max) => {
    const format = (num) => {
      if (num >= 1000000) return `${(num/1000000).toFixed(0)}jt`;
      if (num >= 1000) return `${(num/1000).toFixed(0)}rb`;
      return num;
    };
    
    if (min && max) return `Rp ${format(min)} - ${format(max)}`;
    if (min) return `Rp ${format(min)}+`;
    if (max) return `Up to Rp ${format(max)}`;
    return null;
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {language === 'id' ? 'Perusahaan Tidak Ditemukan' : 'Company Not Found'}
          </h1>
          <p className="text-gray-500 mb-4">{error}</p>
          <Link to="/">
            <Button className="bg-[#2E4DA7]">
              {language === 'id' ? 'Kembali' : 'Go Back'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const company = data?.company;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2E4DA7] to-[#1e3a8a] text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center p-2">
              {company?.logo_url ? (
                <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-10 h-10 text-[#2E4DA7]" />
              )}
            </div>
            <div>
              <Link to={`/company/${domain}`} className="hover:underline">
                <h1 className="text-3xl font-bold font-['Manrope']">{company?.name}</h1>
              </Link>
              {company?.tagline && (
                <p className="text-white/80 mt-1">{company.tagline}</p>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-2">
              {language === 'id' ? 'Bergabung dengan Tim Kami' : 'Join Our Team'}
            </h2>
            <p className="text-white/80">
              {language === 'id' 
                ? `Temukan ${filteredJobs.length} lowongan kerja yang tersedia`
                : `Discover ${filteredJobs.length} job opportunities available`}
            </p>
          </div>
        </div>
      </div>

      {/* Culture & Benefits */}
      {(company?.culture || (company?.benefits && company.benefits.length > 0)) && (
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {company?.culture && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-3">
                  {language === 'id' ? 'Budaya Kerja' : 'Work Culture'}
                </h3>
                <p className="text-gray-600 text-sm">{company.culture}</p>
              </div>
            )}
            {company?.benefits && company.benefits.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-3">
                  {language === 'id' ? 'Benefit' : 'Benefits'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {company.benefits.slice(0, 6).map((benefit, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-[#2E4DA7]/10 text-[#2E4DA7]">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder={language === 'id' ? 'Cari lowongan...' : 'Search jobs...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
              data-testid="search-jobs"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'full_time', 'part_time', 'contract', 'internship'].map(type => (
              <Button
                key={type}
                variant={filterType === type ? 'default' : 'outline'}
                onClick={() => setFilterType(type)}
                className={filterType === type ? 'bg-[#2E4DA7]' : ''}
                size="sm"
              >
                {type === 'all' 
                  ? (language === 'id' ? 'Semua' : 'All')
                  : jobTypeLabels[type]?.[language] || type}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {language === 'id' ? 'Tidak Ada Lowongan' : 'No Jobs Found'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? (language === 'id' ? 'Coba kata kunci lain' : 'Try different keywords')
                : (language === 'id' ? 'Belum ada lowongan tersedia' : 'No positions available at the moment')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(job => {
              const isClosed = job.status === 'closed';
              return (
              <div 
                key={job.id} 
                className={`bg-white rounded-xl p-6 shadow-sm transition-shadow ${isClosed ? 'opacity-70' : 'hover:shadow-md cursor-pointer group'}`}
                onClick={() => !isClosed && navigate(`/careers/${domain}/apply/${job.id}`)}
                data-testid={`job-card-${job.id}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isClosed ? 'bg-gray-100' : 'bg-[#2E4DA7]/10'}`}>
                        <Briefcase className={`w-6 h-6 ${isClosed ? 'text-gray-400' : 'text-[#2E4DA7]'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`text-lg font-bold transition-colors ${isClosed ? 'text-gray-500' : 'text-gray-800 group-hover:text-[#2E4DA7]'}`}>
                            {job.title}
                          </h3>
                          <Badge className={isClosed 
                            ? 'bg-red-100 text-red-700 hover:bg-red-100' 
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                          }>
                            {isClosed 
                              ? (language === 'id' ? 'Ditutup' : 'Closed') 
                              : (language === 'id' ? 'Dibuka' : 'Open')}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                          {job.department && (
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {job.department}
                            </span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(job.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge className="bg-[#2E4DA7]/10 text-[#2E4DA7] hover:bg-[#2E4DA7]/10">
                        {jobTypeLabels[job.job_type]?.[language] || job.job_type}
                      </Badge>
                      {job.salary_min && (
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-1 justify-end">
                          <DollarSign className="w-4 h-4" />
                          {formatSalary(job.salary_min, job.salary_max)}
                        </p>
                      )}
                    </div>
                    {!isClosed && <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#2E4DA7] transition-colors" />}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="w-8 h-8 object-contain" />
                ) : (
                  <Building2 className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <span className="text-gray-600">{company?.name}</span>
            </div>
            <div className="flex gap-4">
              <Link to={`/company/${domain}`} className="text-gray-500 hover:text-[#2E4DA7] text-sm">
                {language === 'id' ? 'Tentang Perusahaan' : 'About Company'}
              </Link>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            Powered by Makar.id
          </p>
        </div>
      </footer>
    </div>
  );
};
